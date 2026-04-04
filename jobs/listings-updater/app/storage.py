import logging
import re
from datetime import datetime, timezone

import psycopg2
import psycopg2.extras

logger = logging.getLogger(__name__)

_DDL = """
CREATE TABLE IF NOT EXISTS zillow_listings (
    zpid          TEXT        PRIMARY KEY,
    category      TEXT,
    data          JSONB       NOT NULL,
    details_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zl_updated ON zillow_listings (updated_at DESC);

-- Migrations: add columns that may be missing from older table versions
ALTER TABLE zillow_listings ADD COLUMN IF NOT EXISTS category   TEXT;
ALTER TABLE zillow_listings ADD COLUMN IF NOT EXISTS details_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_zl_category ON zillow_listings (category);
"""

# ── Zillow → app schema mappings ──────────────────────────────────────────────

def _parse_number(val) -> float:
    """Parse a number that may be formatted as '$168,500' or plain 168500."""
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    cleaned = re.sub(r"[^\d.]", "", str(val))
    return float(cleaned) if cleaned else 0.0


_HOME_TYPE_MAP = {
    "SINGLE_FAMILY": 0,    "CONDO": 1,
    "CONDOP": 1,
    "APARTMENT": 1,
    "COMMERCIAL": 2,
    "LAND": 3,
    "LOT": 3,
    "TOWNHOUSE": 7,
    "MULTI_FAMILY": 11,
    "MOBILE": 13,
    "MANUFACTURED": 14,
}

_TRANSACTION_MAP = {
    "for_sale": 0,
    "sold": 0,
    "for_rent": 1,
}

_STATUS_MAP = {
    "FOR_SALE": 0,
    "ACTIVE": 0,
    "COMING_SOON": 1,
    "CONTINGENT": 2,
    "PENDING": 3,
    "SOLD": 0,
}

_KNOWN_CITIES = {"boca raton", "miami", "palm beach", "fort lauderdale", "delray beach"}


def _normalize_city(city: str | None) -> str | None:
    if not city:
        return None
    c = city.lower().strip()
    if c in _KNOWN_CITIES:
        return c
    if "palm beach" in c:
        return "palm beach"
    if "fort lauderdale" in c or "ft lauderdale" in c or "ft. lauderdale" in c:
        return "fort lauderdale"
    if "boca raton" in c:
        return "boca raton"
    if "delray" in c:
        return "delray beach"
    if "miami" in c:
        return "miami"
    return c


def _map_to_listing(item: dict) -> dict | None:
    """Map a raw Zillow profile-API item to the listings table schema. Returns None if invalid."""
    try:
        zpid = str(item.get("zpid", "")).strip()
        if not zpid:
            return None

        price = _parse_number(item.get("price"))
        if price <= 0:
            return None

        # Address — profile API uses flat fields, not a nested address object
        street = item.get("street_address", "")
        city_raw = item.get("city", "")
        state = item.get("state", "")
        # Fallback: parse "City, ST, Zip" from city_state_zipcode
        if not city_raw:
            csz = item.get("city_state_zipcode", "")
            parts = [p.strip() for p in csz.split(",")]
            city_raw = parts[0] if parts else ""
        full_address = ", ".join(p for p in [street, city_raw, state] if p) or "Unknown"

        # sqr_footage: profile API uses livingAreaValue, public API uses livingArea
        sqr_footage = _parse_number(item.get("livingAreaValue") or item.get("livingArea"))
        bedrooms = int(_parse_number(item.get("bedrooms")))
        bathrooms = int(_parse_number(item.get("bathrooms")))

        home_type = str(item.get("homeType", "") or "").upper()
        listing_type = _HOME_TYPE_MAP.get(home_type, 0)

        transaction_type = _TRANSACTION_MAP.get(item.get("category", "for_sale"), 0)

        status_raw = str(item.get("statusType", "") or "").upper()
        status = _STATUS_MAP.get(status_raw, 0)

        year_built = item.get("yearBuilt")
        built_date = f"{year_built}-01-01 00:00:00" if year_built else None

        description = item.get("description") or ""

        # Thumbnail: profile API uses image_url / medium_image_url
        thumbnail = (item.get("medium_image_url") or item.get("image_url")
                     or item.get("imgSrc"))

        return {
            "mls": zpid,
            "address": full_address,
            "city": _normalize_city(city_raw),
            "description": description,
            "style": item.get("homeType") or "",
            "data_source": "zillow",
            "sqr_footage": sqr_footage,
            "price": price,
            "tax": None,
            "bedrooms": bedrooms,
            "bathrooms": bathrooms,
            "half_bathrooms": 0,
            "status": status,
            "type": listing_type,
            "transaction_type": transaction_type,
            "built_date": built_date,
            "thumbnail": thumbnail,
        }
    except Exception as exc:
        logger.warning(f"Could not map listing zpid={item.get('zpid', '?')}: {exc}")
        return None


class Storage:
    def __init__(self, database_url: str):
        self._url = database_url
        self._conn = None

    # ── Lifecycle ──────────────────────────────────────────────────────────────

    def connect(self) -> None:
        self._conn = psycopg2.connect(self._url)
        self._conn.autocommit = False
        logger.info("Connected to PostgreSQL")

    def close(self) -> None:
        if self._conn:
            self._conn.close()
            logger.info("Database connection closed")

    def init_schema(self) -> None:
        with self._conn.cursor() as cur:
            cur.execute(_DDL)
        self._conn.commit()
        logger.info("Schema ready")

    # ── Queries ────────────────────────────────────────────────────────────────

    def get_all_zpids(self) -> set:
        """Return the set of every zpid already stored."""
        with self._conn.cursor() as cur:
            cur.execute("SELECT zpid FROM zillow_listings")
            return {row[0] for row in cur.fetchall()}

    def upsert_many(self, listings: list[dict]) -> None:
        """
        Insert or update listings.  On conflict the data payload and
        updated_at timestamp are refreshed.
        """
        if not listings:
            return

        now = datetime.now(timezone.utc)
        # Deduplicate by zpid — keep last occurrence (most recent data wins)
        seen: dict = {}
        for item in listings:
            seen[str(item["zpid"])] = item
        records = [
            (zpid, item["category"], psycopg2.extras.Json(item), now)
            for zpid, item in seen.items()
        ]

        with self._conn.cursor() as cur:
            psycopg2.extras.execute_values(
                cur,
                """
                INSERT INTO zillow_listings (zpid, category, data, updated_at)
                VALUES %s
                ON CONFLICT (zpid) DO UPDATE
                    SET category   = EXCLUDED.category,
                        data       = EXCLUDED.data,
                        updated_at = EXCLUDED.updated_at
                """,
                records,
                template="(%s, %s, %s, %s)",
            )
        self._conn.commit()
        logger.info(f"Upserted {len(listings)} listings into zillow_listings")

    def get_zpids_without_details(self, limit: int = 50) -> list[tuple[str, str | None]]:
        """Return (zpid, listing_url) tuples that have not had their detail page scraped yet."""
        with self._conn.cursor() as cur:
            cur.execute(
                """
                SELECT zpid, data->>'listing_url' FROM zillow_listings
                WHERE details_at IS NULL
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (limit,),
            )
            return [(row[0], row[1]) for row in cur.fetchall()]

    def upsert_details(self, zpid: str, detail: dict) -> None:
        """
        Merge detail-page data into the existing zillow_listings row.
        Adds photos, resoFacts and other enriched fields to the JSONB data column.
        """
        now = datetime.now(timezone.utc)
        with self._conn.cursor() as cur:
            cur.execute(
                """
                UPDATE zillow_listings
                SET data       = data || %s::jsonb,
                    details_at = %s,
                    updated_at = %s
                WHERE zpid = %s
                """,
                (
                    psycopg2.extras.Json(detail),
                    now,
                    now,
                    zpid,
                ),
            )
        self._conn.commit()
        logger.debug(f"[details] Stored detail data for zpid={zpid}")

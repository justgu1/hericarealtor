import logging
import random
import threading
import time

from app.browser import fetch_json
from app.config import cfg
from app.details import fetch_homedetails, extract_carousel_photos

logger = logging.getLogger(__name__)

ZILLOW_BASE = "https://www.zillow.com"

_DETAIL_TIMEOUT_S = 90  # seconds before giving up on a single detail page


def _fetch_with_timeout(driver, zpid, detail_url):
    """Fetch detail page with a timeout — works in any thread (no signal)."""
    result = [None]
    exc = [None]
    done = threading.Event()

    def _worker():
        try:
            result[0] = fetch_homedetails(driver, zpid, detail_url=detail_url)
        except Exception as e:
            exc[0] = e
        finally:
            done.set()

    t = threading.Thread(target=_worker, daemon=True)
    t.start()

    if not done.wait(_DETAIL_TIMEOUT_S):
        # Interrupt the stuck driver then wait briefly for the thread to exit
        try:
            driver.execute_script("window.stop()")
        except Exception:
            pass
        done.wait(10)
        raise TimeoutError(f"Detail fetch exceeded {_DETAIL_TIMEOUT_S}s")

    if exc[0]:
        raise exc[0]
    return result[0]

# Endpoint template + the key that holds the listings array in the response
_ENDPOINTS = {
    "for_sale": (
        "/profile-page/api/public/v1/active-listings"
        "?encodedZuid={zuid}&page={page}&include_team=true",
        "listings",
    ),
    "for_rent": (
        "/profile-page/api/public/v1/rental-listings"
        "?encodedZuid={zuid}&page={page}&include_team=true",
        "listings",
    ),
    "sold": (
        "/profile-page/api/public/v1/past-sales"
        "?encodedZuid={zuid}&page={page}",
        "past_sales",
    ),
}

# Delay between detail-page requests to avoid Cloudflare/PX blocks
_DETAIL_THROTTLE_MIN = 5.0
_DETAIL_THROTTLE_MAX = 10.0


def _throttle(min_s: float = None, max_s: float = None) -> None:
    lo = min_s if min_s is not None else cfg.THROTTLE_MIN
    hi = max_s if max_s is not None else cfg.THROTTLE_MAX
    delay = random.uniform(lo, hi)
    logger.debug(f"Throttling {delay:.1f}s")
    time.sleep(delay)


def _scrape_category(
    driver,
    category: str,
    known_zpids: set,
    max_pages: int = 0,
    notify_fn=None,
) -> list[dict]:
    """
    Paginate through a single category endpoint.
    Saves every listing whose zpid is not already in known_zpids.
    Stops as soon as a known zpid is encountered (listings are newest-first,
    so everything after a known one is also already stored).

    Args:
        max_pages: limit pagination to this many pages (0 = unlimited).
        notify_fn: optional callable(new_listings) called immediately after the
                   first page when new listings are found — used to notify
                   Laravel quickly without waiting for the full scrape.

    Returns the list of new listings with the 'category' field attached.
    """
    path_template, items_key = _ENDPOINTS[category]
    new_listings: list[dict] = []
    page = 1

    logger.info(f"[{category}] Starting pagination (max_pages={max_pages or 'unlimited'})")

    while True:
        url = ZILLOW_BASE + path_template.format(
            zuid=cfg.ZILLOW_ENCODED_ZUID, page=page
        )
        data = fetch_json(driver, url)

        if not data:
            logger.warning(f"[{category}] Empty/failed response on page {page} — stopping")
            break

        items = data.get(items_key, [])
        if not items:
            logger.info(f"[{category}] No items on page {page} — reached the end")
            break

        page_new: list[dict] = []
        stop = False

        for item in items:
            zpid = str(item["zpid"])
            if zpid in known_zpids:
                logger.info(
                    f"[{category}] Reached known zpid {zpid} on page {page} — stopping"
                )
                stop = True
                break
            item["category"] = category
            page_new.append(item)

        new_listings.extend(page_new)
        logger.info(f"[{category}] Page {page}: {len(page_new)} new listings")

        # After first page: immediately notify Laravel if new listings found
        # so they are visible faster without waiting for the full pagination.
        if page == 1 and page_new and notify_fn is not None:
            logger.info(f"[{category}] First page has {len(page_new)} new listings — notifying Laravel early")
            notify_fn(page_new)

        if stop:
            break

        if max_pages and page >= max_pages:
            logger.info(f"[{category}] Reached max_pages={max_pages} — stopping")
            break

        page += 1
        _throttle()

    logger.info(f"[{category}] Done — {len(new_listings)} new listings across {page} page(s)")
    return new_listings


def _fetch_details_batch(driver, storage, items: list[tuple[str, str | None]]) -> int:
    """
    Scrape homedetails pages for each (zpid, detail_url) tuple and persist enriched data.
    Skips any listing that takes longer than _DETAIL_TIMEOUT_S seconds (Zillow challenge).
    Skipped listings keep details_at=NULL so backfill retries them on the next run.
    Returns the number of successfully fetched detail pages.
    """
    if not items:
        return 0

    def _alarm_handler(signum, frame):
        raise TimeoutError(f"Detail fetch exceeded {_DETAIL_TIMEOUT_S}s timeout")

    logger.info(f"[details] Fetching detail pages for {len(items)} listings")
    success = 0
    skipped = 0

    for i, (zpid, detail_url) in enumerate(items):
        try:
            detail = _fetch_with_timeout(driver, zpid, detail_url)
            if detail:
                storage.upsert_details(zpid, detail)
                success += 1
                logger.info(
                    f"[details] {i+1}/{len(items)} zpid={zpid}: "
                    f"{len(detail.get('photos', []))} photos"
                )
            else:
                logger.warning(f"[details] {i+1}/{len(items)} zpid={zpid}: no data returned")
        except TimeoutError as e:
            skipped += 1
            logger.warning(f"[details] {i+1}/{len(items)} zpid={zpid}: SKIPPED — {e} (will retry next run)")
        except Exception as e:
            logger.error(f"[details] zpid={zpid} error: {e}")

        if i < len(items) - 1:
            _throttle(_DETAIL_THROTTLE_MIN, _DETAIL_THROTTLE_MAX)

    logger.info(f"[details] Done — {success}/{len(items)} fetched, {skipped} skipped (timeout)")
    return success


def run_scraper(driver, storage, max_pages: int = 0, notify_fn=None) -> dict:
    """
    Run all three category scrapers sequentially, then fetch detail pages
    for any listings that don't yet have them.

    Args:
        max_pages: limit pagination per category (0 = unlimited, 1 = quick-check mode).
        notify_fn: optional callable to invoke immediately when first-page new listings
                   are found (enables fast-path notification to Laravel).

    Returns a dict with new listing counts per category.
    """
    logger.info("Loading known zpids from database…")
    known_zpids = storage.get_all_zpids()
    logger.info(f"{len(known_zpids)} existing listings in DB")

    results = {}
    new_items: list[tuple[str, str | None]] = []  # (zpid, listing_url)

    for category in ("for_sale", "for_rent", "sold"):
        new_listings = _scrape_category(
            driver, category, known_zpids,
            max_pages=max_pages,
            notify_fn=notify_fn,
        )

        if new_listings:
            storage.upsert_many(new_listings)
            for item in new_listings:
                zpid = str(item["zpid"])
                known_zpids.add(zpid)
                new_items.append((zpid, item.get("listing_url")))

                # Extract photos from carouselPhotosComposable if already available
                carousel_photos = extract_carousel_photos(item)
                if carousel_photos:
                    logger.info(f"[{category}] zpid={zpid}: {len(carousel_photos)} photos from carousel API")
                    storage.upsert_details(zpid, {"photos": carousel_photos})

            # Notify Laravel immediately after upsert so each category is visible ASAP
            if notify_fn is not None:
                logger.info(f"[{category}] Notifying Laravel — {len(new_listings)} new listings upserted")
                notify_fn(len(new_listings))

        results[category] = len(new_listings)
        _throttle()

    # In quick-check mode (max_pages=1), skip detail fetching to keep it fast
    if max_pages == 1:
        logger.info("[quick] max_pages=1 — skipping detail page fetching")
        return results

    # Fetch detail pages for newly scraped listings
    if new_items:
        logger.info(f"[details] Will fetch detail pages for {len(new_items)} new listings")
        _throttle(_DETAIL_THROTTLE_MIN, _DETAIL_THROTTLE_MAX)
        results["details_fetched"] = _fetch_details_batch(driver, storage, new_items)

    # Also backfill any older listings that never had details fetched
    backfill_items = storage.get_zpids_without_details(limit=100)
    new_zpids = {z for z, _ in new_items}
    backfill_items = [(z, u) for z, u in backfill_items if z not in new_zpids]
    if backfill_items:
        logger.info(f"[details] Backfilling {len(backfill_items)} older listings without details")
        _throttle(_DETAIL_THROTTLE_MIN, _DETAIL_THROTTLE_MAX)
        backfilled = _fetch_details_batch(driver, storage, backfill_items)
        results["details_backfilled"] = backfilled

    return results


# Endpoint template + the key that holds the listings array in the response
_ENDPOINTS = {
    "for_sale": (
        "/profile-page/api/public/v1/active-listings"
        "?encodedZuid={zuid}&page={page}&include_team=true",
        "listings",
    ),
    "for_rent": (
        "/profile-page/api/public/v1/rental-listings"
        "?encodedZuid={zuid}&page={page}&include_team=true",
        "listings",
    ),
    "sold": (
        "/profile-page/api/public/v1/past-sales"
        "?encodedZuid={zuid}&page={page}",
        "past_sales",
    ),
}

# Delay between detail-page requests to avoid Cloudflare/PX blocks
_DETAIL_THROTTLE_MIN = 30.0
_DETAIL_THROTTLE_MAX = 45.0


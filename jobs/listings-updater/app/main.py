import argparse
import logging
import sys

import requests

from app.browser import close_browser, create_browser, init_session
from app.config import cfg
from app.scraper import run_scraper
from app.storage import Storage

logging.basicConfig(
    level=getattr(logging, cfg.LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

_PROFILE_URL = f"https://www.zillow.com/profile/{cfg.ZILLOW_PROFILE_SLUG}/"


def notify_laravel(total_new: int) -> None:
    """Notify Laravel to run listings:import after a successful scrape."""
    if not cfg.LARAVEL_API_URL or not cfg.LARAVEL_INTERNAL_TOKEN:
        logger.warning("LARAVEL_API_URL or LARAVEL_INTERNAL_TOKEN not set — skipping notification")
        return
    try:
        url = cfg.LARAVEL_API_URL.rstrip("/") + "/api/jobs/listings-import"
        resp = requests.post(
            url,
            headers={"X-Internal-Token": cfg.LARAVEL_INTERNAL_TOKEN},
            timeout=15,
        )
        resp.raise_for_status()
        logger.info(f"Laravel notified ({resp.status_code}): listings:import triggered ({total_new} new in zillow_listings)")
    except Exception as exc:
        logger.warning(f"Failed to notify Laravel: {exc}")


def _early_notify(_listings: list) -> None:
    """Called immediately after first-page data is found to accelerate Laravel import."""
    logger.info(f"[early] Triggering fast-path Laravel import for {len(_listings)} first-page listing(s)")
    notify_laravel(len(_listings))


def main() -> None:
    parser = argparse.ArgumentParser(description="Zillow Listings Updater")
    parser.add_argument(
        "--max-pages", type=int, default=0,
        help="Limit pagination to N pages per category. 0 = unlimited (default). "
             "Use 1 for a quick first-page check that notifies Laravel immediately.",
    )
    args = parser.parse_args()

    if not cfg.ZILLOW_ENCODED_ZUID:
        logger.error("ZILLOW_ENCODED_ZUID is not set")
        sys.exit(1)
    if not cfg.DATABASE_URL:
        logger.error("DATABASE_URL is not set")
        sys.exit(1)

    quick_mode = args.max_pages == 1
    mode_label = "QUICK (page 1 only)" if quick_mode else f"FULL (max_pages={args.max_pages or 'unlimited'})"
    logger.info(f"=== Zillow Listings Updater — starting [{mode_label}] ===")

    storage = Storage(cfg.DATABASE_URL)
    storage.connect()
    storage.init_schema()

    driver, display = create_browser(headless=cfg.USE_VIRTUAL_DISPLAY)

    try:
        if not init_session(driver, _PROFILE_URL):
            logger.error("Could not initialise Zillow session — aborting")
            sys.exit(1)

        # In quick mode, enable early notification so Laravel sees new data ASAP
        early_notify_fn = _early_notify if quick_mode else None

        results = run_scraper(
            driver, storage,
            max_pages=args.max_pages,
            notify_fn=early_notify_fn,
        )

        logger.info("=== Scraping complete ===")
        total_new = sum(v for k, v in results.items() if k in ("for_sale", "for_rent", "sold"))
        for category, count in results.items():
            logger.info(f"  {category:20s}: {count}")
        logger.info(f"  {'TOTAL new listings':20s}: {total_new}")

        # In non-quick mode, do the final notify (quick mode notified per-page already)
        if not quick_mode and total_new > 0:
            notify_laravel(total_new)

    finally:
        close_browser(driver, display)
        storage.close()


if __name__ == "__main__":
    main()


logging.basicConfig(
    level=getattr(logging, cfg.LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

_PROFILE_URL = f"https://www.zillow.com/profile/{cfg.ZILLOW_PROFILE_SLUG}/"


def notify_laravel(total_new: int) -> None:
    """Notify Laravel to run listings:import after a successful scrape."""
    if not cfg.LARAVEL_API_URL or not cfg.LARAVEL_INTERNAL_TOKEN:
        logger.warning("LARAVEL_API_URL or LARAVEL_INTERNAL_TOKEN not set — skipping notification")
        return
    try:
        url = cfg.LARAVEL_API_URL.rstrip("/") + "/api/jobs/listings-import"
        resp = requests.post(
            url,
            headers={"X-Internal-Token": cfg.LARAVEL_INTERNAL_TOKEN},
            timeout=15,
        )
        resp.raise_for_status()
        logger.info(f"Laravel notified ({resp.status_code}): listings:import triggered ({total_new} new in zillow_listings)")
    except Exception as exc:
        logger.warning(f"Failed to notify Laravel: {exc}")


def main() -> None:
    if not cfg.ZILLOW_ENCODED_ZUID:
        logger.error("ZILLOW_ENCODED_ZUID is not set")
        sys.exit(1)
    if not cfg.DATABASE_URL:
        logger.error("DATABASE_URL is not set")
        sys.exit(1)

    logger.info("=== Zillow Listings Updater — starting ===")

    storage = Storage(cfg.DATABASE_URL)
    storage.connect()
    storage.init_schema()

    driver, display = create_browser(headless=cfg.USE_VIRTUAL_DISPLAY)

    try:
        if not init_session(driver, _PROFILE_URL):
            logger.error("Could not initialise Zillow session — aborting")
            sys.exit(1)

        results = run_scraper(driver, storage)

        logger.info("=== Scraping complete ===")
        total_new = sum(results.values())
        for category, count in results.items():
            logger.info(f"  {category:10s}: {count} new listings")
        logger.info(f"  TOTAL      : {total_new} new listings")

        if total_new > 0:
            notify_laravel(total_new)

    finally:
        close_browser(driver, display)
        storage.close()


if __name__ == "__main__":
    main()

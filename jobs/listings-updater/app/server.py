"""
server.py — HTTP trigger server para listings-updater.
n8n chama POST /run a cada 10 minutos; quando o job termina, o servidor
envia os resultados para N8N_WEBHOOK_URL.

Endpoints:
  POST /run     → dispara o scraper em background (não bloqueia)
  GET  /health  → retorna status do último run
"""

import logging
import sys
import threading
import time
from datetime import datetime, timezone
from typing import Any

import requests
import uvicorn
from fastapi import FastAPI
from fastapi.responses import JSONResponse

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

app = FastAPI(title="listings-updater", version="1.0")

_lock = threading.Lock()
_state: dict[str, Any] = {
    "running": False,
    "last_run": None,   # populated after each run
}

_PROFILE_URL = f"https://www.zillow.com/profile/{cfg.ZILLOW_PROFILE_SLUG}/"


def _notify_n8n(payload: dict) -> None:
    if not cfg.N8N_WEBHOOK_URL:
        logger.warning("N8N_WEBHOOK_URL not set — skipping webhook")
        return
    try:
        resp = requests.post(cfg.N8N_WEBHOOK_URL, json=payload, timeout=15)
        resp.raise_for_status()
        logger.info(f"n8n webhook notified ({resp.status_code})")
    except Exception as exc:
        logger.warning(f"Failed to notify n8n: {exc}")


def _notify_laravel(count: int) -> None:
    if not cfg.LARAVEL_API_URL or not cfg.LARAVEL_INTERNAL_TOKEN:
        logger.warning("LARAVEL_API_URL or LARAVEL_INTERNAL_TOKEN not set — skipping Laravel notify")
        return
    try:
        url = cfg.LARAVEL_API_URL.rstrip("/") + "/api/jobs/listings-import"
        resp = requests.post(
            url,
            headers={"X-Internal-Token": cfg.LARAVEL_INTERNAL_TOKEN},
            timeout=15,
        )
        resp.raise_for_status()
        logger.info(f"Laravel notified ({resp.status_code}): {count} new listings")
    except Exception as exc:
        logger.warning(f"Failed to notify Laravel: {exc}")


def _run_job() -> None:
    started_at = datetime.now(timezone.utc)
    started_ts = started_at.isoformat()
    results: dict = {}
    error: str | None = None

    logger.info(f"=== Listings updater job started at {started_ts} ===")

    try:
        storage = Storage(cfg.DATABASE_URL)
        storage.connect()
        storage.init_schema()

        driver, display = create_browser(headless=cfg.USE_VIRTUAL_DISPLAY)
        try:
            if not init_session(driver, _PROFILE_URL):
                raise RuntimeError("Could not initialise Zillow session")

            results = run_scraper(driver, storage, notify_fn=_notify_laravel)

            total_new = sum(v for k, v in results.items() if k in ("for_sale", "for_rent", "sold"))
            logger.info(f"Scrape complete — {total_new} total new listings")
        finally:
            close_browser(driver, display)
            storage.close()

    except Exception as exc:
        error = str(exc)
        logger.error(f"Job failed: {exc}", exc_info=True)

    finished_at = datetime.now(timezone.utc)
    duration_s = round((finished_at - started_at).total_seconds(), 1)

    last_run = {
        "started_at": started_ts,
        "finished_at": finished_at.isoformat(),
        "duration_s": duration_s,
        "results": results,
        "error": error,
        "success": error is None,
    }

    with _lock:
        _state["running"] = False
        _state["last_run"] = last_run

    logger.info(f"=== Job finished in {duration_s}s — error={error} ===")
    _notify_n8n({"service": "listings-updater", **last_run})


@app.post("/run")
def trigger_run():
    with _lock:
        if _state["running"]:
            return JSONResponse({"status": "already_running", "last_run": _state["last_run"]})
        _state["running"] = True

    thread = threading.Thread(target=_run_job, daemon=True)
    thread.start()
    return {"status": "started", "message": "Scraper running in background"}


@app.get("/health")
def health():
    with _lock:
        return {
            "status": "ok",
            "running": _state["running"],
            "last_run": _state["last_run"],
        }


if __name__ == "__main__":
    uvicorn.run("app.server:app", host="0.0.0.0", port=8001, log_level="info")

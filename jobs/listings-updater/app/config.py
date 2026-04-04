import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Config:
    ZILLOW_ENCODED_ZUID: str = os.getenv("ZILLOW_ENCODED_ZUID", "")
    ZILLOW_PROFILE_SLUG: str = os.getenv("ZILLOW_PROFILE_SLUG", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    THROTTLE_MIN: float = float(os.getenv("THROTTLE_MIN", "1.5"))
    THROTTLE_MAX: float = float(os.getenv("THROTTLE_MAX", "4.0"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    # In Docker/CI set to "true" to run Chrome through Xvfb virtual display
    USE_VIRTUAL_DISPLAY: bool = os.getenv("USE_VIRTUAL_DISPLAY", "true").lower() == "true"
    # Laravel internal API — notify after scraping so it can import listings
    LARAVEL_API_URL: str = os.getenv("LARAVEL_API_URL", "")
    LARAVEL_INTERNAL_TOKEN: str = os.getenv("LARAVEL_INTERNAL_TOKEN", "")
    N8N_WEBHOOK_URL: str = os.getenv("N8N_WEBHOOK_URL", "")


cfg = Config()

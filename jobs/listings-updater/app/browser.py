import json
import logging
import re
import subprocess
import time

import undetected_chromedriver as uc
from pyvirtualdisplay import Display
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

logger = logging.getLogger(__name__)

# PerimeterX "Press & Hold" challenge selectors (Zillow uses PX)
_CHALLENGE_SELECTORS = [
    "#px-captcha",
    "[id^='px-captcha']",
    ".px-captcha-container button",
    "button[data-px-action]",
]

# Text fragments that indicate the challenge page is active
_CHALLENGE_TEXT_MARKERS = [
    "press & hold",
    "press and hold",
    "hold the button",
    "perimeter",
]


def _chrome_major_version() -> int | None:
    """Detect the installed Chrome major version to avoid driver/browser mismatch."""
    for binary in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser"):
        try:
            out = subprocess.check_output([binary, "--version"], stderr=subprocess.DEVNULL, text=True)
            match = re.search(r"(\d+)\.", out)
            if match:
                return int(match.group(1))
        except Exception:
            continue
    return None


def create_browser(headless: bool = False) -> tuple:
    """
    Launch Chrome via undetected-chromedriver.
    When headless=True a virtual Xvfb display is started so Chrome runs
    in a non-headless mode (required to avoid additional bot detection).
    Returns (driver, display_or_None).
    """
    display = None
    if headless:
        display = Display(visible=False, size=(1920, 1080))
        display.start()
        logger.info("Xvfb virtual display started")

    options = uc.ChromeOptions()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--lang=en-US,en;q=0.9")
    options.add_argument("--start-maximized")

    driver = uc.Chrome(options=options, use_subprocess=True, version_main=_chrome_major_version())
    driver.set_page_load_timeout(60)
    logger.info("Chrome browser started")
    return driver, display


def _is_challenge_present(driver) -> bool:
    """Return True if a PerimeterX press-and-hold page is detected."""
    try:
        body_text = driver.find_element(By.TAG_NAME, "body").text.lower()
        return any(marker in body_text for marker in _CHALLENGE_TEXT_MARKERS)
    except Exception:
        return False


def _find_challenge_button(driver):
    """Try known selectors to locate the challenge button element."""
    for selector in _CHALLENGE_SELECTORS:
        try:
            el = WebDriverWait(driver, 3).until(
                EC.visibility_of_element_located((By.CSS_SELECTOR, selector))
            )
            return el
        except Exception:
            continue
    # Last resort — find any visible button on the page
    try:
        buttons = driver.find_elements(By.TAG_NAME, "button")
        for btn in buttons:
            if btn.is_displayed():
                return btn
    except Exception:
        pass
    return None


def solve_press_hold_challenge(driver, hold_seconds: int = 12, max_attempts: int = 3) -> bool:
    """
    Detect and solve the PerimeterX press-and-hold challenge.
    Uses ActionChains.click_and_hold to simulate a human holding the button.
    Returns True when the challenge is cleared, False if it could not be solved.
    """
    if not _is_challenge_present(driver):
        return True  # No challenge active

    logger.info("Press-and-hold challenge detected — attempting to solve")

    for attempt in range(1, max_attempts + 1):
        button = _find_challenge_button(driver)
        if button is None:
            logger.error("Challenge button not found")
            return False

        logger.info(f"Attempt {attempt}/{max_attempts}: holding button for {hold_seconds}s")
        try:
            actions = ActionChains(driver)
            actions.move_to_element(button).perform()
            time.sleep(0.5)
            actions.click_and_hold(button).perform()
            time.sleep(hold_seconds)
            actions.release(button).perform()
            time.sleep(3)

            if not _is_challenge_present(driver):
                logger.info("Challenge solved successfully")
                return True

            logger.warning(f"Challenge still present after attempt {attempt}")
            time.sleep(2)
        except Exception as e:
            logger.error(f"Error during press-and-hold: {e}")
            return False

    logger.error("Failed to solve challenge after all attempts")
    return False


def init_session(driver, profile_url: str) -> bool:
    """
    Navigate to the Zillow agent profile page to establish a valid session
    (cookies + zguid are set automatically on page load).
    Handles the press-and-hold challenge if it appears.
    """
    logger.info(f"Initialising session via {profile_url}")
    driver.get(profile_url)
    time.sleep(4)

    if not solve_press_hold_challenge(driver):
        logger.error("Could not pass Zillow anti-bot challenge")
        return False

    logger.info("Session ready")
    return True


def fetch_json(driver, url: str) -> dict | None:
    """
    Navigate to a Zillow API URL that renders raw JSON in the browser,
    then parse and return the JSON object.
    Re-runs challenge handling if it reappears.
    """
    logger.debug(f"GET {url}")
    driver.get(url)
    time.sleep(2)

    # The challenge can reappear when navigating to API endpoints
    if _is_challenge_present(driver):
        logger.warning("Challenge appeared on API URL — attempting to solve")
        if not solve_press_hold_challenge(driver):
            return None
        # Re-navigate after solving
        driver.get(url)
        time.sleep(2)

    try:
        # Browsers wrap JSON responses in a <pre> tag or render in <body> directly
        try:
            pre = driver.find_element(By.TAG_NAME, "pre")
            raw = pre.text
        except Exception:
            raw = driver.find_element(By.TAG_NAME, "body").text

        return json.loads(raw)
    except Exception as e:
        logger.error(f"Failed to parse JSON from {url}: {e}")
        return None


def close_browser(driver, display=None) -> None:
    """Cleanly quit the browser and virtual display."""
    try:
        driver.quit()
        logger.info("Browser closed")
    except Exception:
        pass
    if display:
        try:
            display.stop()
            logger.info("Virtual display stopped")
        except Exception:
            pass

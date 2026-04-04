"""
Zillow homedetails page scraper.

Navigates to https://www.zillow.com/homedetails/{zpid}_zpid/,
extracts __NEXT_DATA__ and returns a flat dict of enriched fields:
  - photos: list of image URLs (largest available)
  - resoFacts: raw dict (heating, cooling, appliances, features…)
  - description: full text
  - yearBuilt, lotAreaValue, lotAreaUnit, hoaFee
  - All existing profile-API fields are preserved.
"""
import json
import logging
import re
import time

from selenium.webdriver.common.by import By

from app.browser import solve_press_hold_challenge, _is_challenge_present

logger = logging.getLogger(__name__)

ZILLOW_BASE = "https://www.zillow.com"
ZILLOW_DETAIL_URL = ZILLOW_BASE + "/homedetails/{zpid}_zpid/"


def extract_carousel_photos(item: dict) -> list[str]:
    """
    Extract photo URLs from carouselPhotosComposable (profile API / search API).
    Format: { baseUrl: "https://.../{photoKey}-p_e.jpg", photoData: [{photoKey: "..."}] }
    Returns highest-res variant by replacing the suffix.
    """
    carousel = item.get("carouselPhotosComposable")
    if not carousel:
        return []
    base_url = carousel.get("baseUrl", "")
    if not base_url or "{photoKey}" not in base_url:
        return []
    photos = []
    for entry in carousel.get("photoData", []):
        key = entry.get("photoKey")
        if key:
            url = base_url.replace("{photoKey}", key).replace("-p_e.jpg", "-uncropped_scaled_within_1536.jpg")
            photos.append(url)
    return photos


def _best_photo_url(mixed_sizes: list[dict]) -> str | None:
    """Pick the largest jpg from a Zillow photo size list."""
    jpg = [s for s in mixed_sizes if s.get("url", "").endswith(".jpg")]
    for suffix in ("1536_1152.jpg", "1344_1008.jpg", "o_a.jpg", "d_d.jpg"):
        for entry in jpg:
            if entry.get("url", "").endswith(suffix):
                return entry["url"]
    return (jpg or mixed_sizes)[0].get("url") if (jpg or mixed_sizes) else None


def _extract_photos(property_data: dict) -> list[str]:
    """
    Extract all unique photo URLs from a Zillow property dict.
    Handles both the 'photos' array and the older 'bigPhotos'/'originalPhotos'.
    """
    urls: list[str] = []
    seen: set[str] = set()

    def _add(url: str | None) -> None:
        if url and url not in seen:
            seen.add(url)
            urls.append(url)

    # Primary: photos[].mixedSources.jpeg[]
    for photo in property_data.get("photos", []):
        mixed = photo.get("mixedSources", {})
        jpeg_list = mixed.get("jpeg", mixed.get("jpg", []))
        url = _best_photo_url(jpeg_list) if jpeg_list else photo.get("url")
        _add(url)

    # Fallback: originalPhotos[]
    for photo in property_data.get("originalPhotos", []):
        mixed = photo.get("mixedSources", {})
        jpeg_list = mixed.get("jpeg", mixed.get("jpg", []))
        url = _best_photo_url(jpeg_list) if jpeg_list else photo.get("url")
        _add(url)

    # Fallback: bigPhotos[]
    for photo in property_data.get("bigPhotos", []):
        _add(photo.get("url"))

    return urls


def _parse_next_data(page_source: str) -> dict | None:
    """Extract and parse the __NEXT_DATA__ JSON embedded in the page."""
    match = re.search(
        r'<script[^>]+id=["\']__NEXT_DATA__["\'][^>]*>(.*?)</script>',
        page_source,
        re.DOTALL,
    )
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse __NEXT_DATA__: {e}")
    return None


def _find_property_in_gdp(gdp_cache: dict, zpid: str) -> dict | None:
    """
    Navigate the gdpClientCache dict to find the property object.
    Keys are like: 'ForSaleDoubleScrollFullRightRailDesktopPreviewDialog{"zpid":"12345"}'
    """
    zpid_str = str(zpid)
    for key, value in gdp_cache.items():
        if not isinstance(value, dict):
            continue
        if zpid_str in key and "property" in value:
            return value["property"]
        prop = value.get("property", {})
        if isinstance(prop, dict) and str(prop.get("zpid", "")) == zpid_str:
            return prop
    for value in gdp_cache.values():
        if isinstance(value, dict) and "property" in value:
            return value["property"]
    return None


def _click_show_more_buttons(driver) -> int:
    """
    Click all 'Show more' / 'See more' / expand buttons visible on the page
    so that full description and facts sections are loaded into the DOM.
    Returns number of buttons clicked.
    """
    clicked = 0

    # Scroll through page to trigger lazy loads
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight / 3);")
    time.sleep(1)
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight / 2);")
    time.sleep(1)
    driver.execute_script("window.scrollTo(0, 0);")
    time.sleep(0.5)

    # XPath selectors for common expand buttons
    _lc = "translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz')"
    xpath_selectors = [
        f"//button[contains({_lc},'see more')]",
        f"//button[contains({_lc},'show more')]",
        f"//button[contains({_lc},'read more')]",
        f"//button[contains({_lc},'see all')]",
        f"//button[contains({_lc},'show all')]",
        f"//button[contains({_lc},'view all')]",
        f"//button[contains({_lc},'more facts')]",
        f"//button[contains({_lc},'all facts')]",
        f"//a[contains({_lc},'see more')]",
        f"//a[contains({_lc},'show more')]",
        "//button[contains(@aria-label,'more') or contains(@aria-label,'expand') or contains(@aria-label,'show')]",
        # Zillow specific data-testid patterns
        "//*[contains(@data-testid,'read-more')]",
        "//*[contains(@data-testid,'show-more')]",
        "//*[contains(@data-testid,'facts-toggle')]",
        "//*[contains(@data-testid,'expand')]",
        # Collapsed accordion / chevron patterns in facts section
        "//section[contains(@class,'facts')]//button",
        "//*[@data-testid='facts-and-features']//button",
        "//*[contains(@class,'fact')]//button[contains(@class,'expand') or contains(@class,'more') or contains(@class,'toggle')]",
    ]

    for xpath in xpath_selectors:
        try:
            buttons = driver.find_elements(By.XPATH, xpath)
            for btn in buttons:
                try:
                    if btn.is_displayed():
                        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", btn)
                        time.sleep(0.3)
                        driver.execute_script("arguments[0].click();", btn)
                        clicked += 1
                        time.sleep(1.5)
                except Exception:
                    pass
        except Exception:
            pass

    if clicked:
        logger.info(f"[details] Clicked {clicked} 'show more' button(s), waiting for data to load")
        time.sleep(2)

    return clicked


def _extract_description_from_dom(driver) -> str:
    """
    Extract the full description text from visible DOM after 'Show more' click.
    Falls back through multiple known Zillow selectors.
    """
    # Try JS-based extraction first: find any paragraph/div in main content with substantial text
    try:
        desc = driver.execute_script("""
            // Skip these common Zillow boilerplate phrases
            var BOILERPLATE = ['zillow group is committed', 'zillow, inc.', 'equal housing opportunity',
                               'get a cash offer', 'services availability', 'homes for you'];
            function isBoilerplate(text) {
                var t = text.toLowerCase();
                return BOILERPLATE.some(function(b) { return t.indexOf(b) !== -1; });
            }

            // Look for the listing description in common Zillow containers
            var selectors = [
                '[data-testid="description"]',
                '[data-testid="overview-section"] p',
                '[data-testid="listing-description"]',
                '.ds-overview-section',
                '[class*="PropertyDescription"] p',
                '[class*="description-container"] p',
                '[class*="ListingDescription"]',
            ];
            for (var i = 0; i < selectors.length; i++) {
                var els = document.querySelectorAll(selectors[i]);
                for (var j = 0; j < els.length; j++) {
                    var t = (els[j].innerText || els[j].textContent || '').trim();
                    if (t.length > 80 && !isBoilerplate(t)) {
                        return t;
                    }
                }
            }
            return '';
        """)
        if desc and len(desc) > 80:
            logger.info(f"[details] Extracted description from DOM: {len(desc)} chars")
            return desc
    except Exception as e:
        logger.debug(f"[details] JS description extraction failed: {e}")

    selectors = [
        "[data-testid='description']",
        "[data-testid='overview-section'] p",
        ".ds-overview-section",
        "[class*='PropertyDescription']",
        "[class*='description-container']",
        "section[aria-label*='description' i] p",
        "section[aria-label*='overview' i] p",
    ]
    BOILERPLATE_PHRASES = ["zillow group is committed", "zillow, inc.", "equal housing opportunity", "get a cash offer"]
    for sel in selectors:
        try:
            elements = driver.find_elements(By.CSS_SELECTOR, sel)
            for el in elements:
                text = el.text.strip()
                if len(text) > 80 and not text.lower().startswith("see more"):
                    if not any(phrase in text.lower() for phrase in BOILERPLATE_PHRASES):
                        logger.info(f"[details] Extracted description via CSS '{sel}': {len(text)} chars")
                        return text
        except Exception:
            pass

    logger.debug("[details] No meaningful description found in DOM (sold listings often have none)")
    return ""


def _extract_facts_from_dom(driver) -> dict:
    """
    Parse the Facts & Features section from the DOM into a dict that
    supplements the sparse resoFacts from __NEXT_DATA__.

    Returns keys matching resoFacts structure where possible, plus extras.
    """
    facts: dict = {}

    # Zillow renders facts as groups: each group has a header and a list of items
    # Try multiple known structures
    try:
        # Modern Zillow: grouped fact lists
        # Each group: <div> with <h6>Category</h6> and <ul><li>Key: Value</li>...</ul>
        raw_text = driver.execute_script("""
            var results = [];
            var headings = document.querySelectorAll(
                '[data-testid="facts-section"] h6, ' +
                '[data-testid*="fact"] h6, ' +
                'h6'
            );
            headings.forEach(function(h) {
                var section = {header: h.innerText, items: []};
                var parent = h.parentElement;
                var ul = parent ? parent.querySelector('ul') : null;
                if (!ul) ul = h.nextElementSibling;
                if (!ul && parent) ul = parent.nextElementSibling ? parent.nextElementSibling.querySelector('ul') : null;
                if (ul) {
                    ul.querySelectorAll('li').forEach(function(li) {
                        var t = (li.innerText || li.textContent || '').trim();
                        if (t) section.items.push(t);
                    });
                }
                if (section.items.length > 0) results.push(section);
            });
            return JSON.stringify(results);
        """)

        if raw_text:
            sections = json.loads(raw_text)
            logger.info(f"[details] DOM facts sections found: {[(s.get('header','?'), s.get('items',[])) for s in sections[:5]]}")
            for section in sections:
                header = section.get("header", "").lower().strip()
                items = section.get("items", [])
                facts[f"_section_{header}"] = items

                for item in items:
                    item_lower = item.lower()

                    # ── Section-header-based mapping (most reliable) ──────────────────────
                    if header in ("heating", "heat"):
                        facts.setdefault("heating", []).append(item)
                    elif header in ("cooling", "air conditioning"):
                        facts.setdefault("cooling", []).append(item)
                    elif header in ("appliances",):
                        facts.setdefault("appliances", []).append(item)
                    elif header in ("flooring", "floor covering", "floors", "features") and "floor" in item_lower:
                        facts.setdefault("flooring", []).append(item)
                    elif header in ("parking", "parking features", "garage"):
                        facts.setdefault("parkingFeatures", []).append(item)
                        if "garage" in item_lower:
                            facts["hasGarage"] = True
                    elif header in ("laundry", "laundry room"):
                        facts.setdefault("laundryFeatures", []).append(item)
                    elif header in ("pool", "pool features"):
                        facts.setdefault("exteriorFeatures", []).append(item)
                        facts["hasPool"] = True
                    elif header in ("community features", "community amenities"):
                        facts.setdefault("communityFeatures", []).append(item)
                    elif header in ("lot", "lot features"):
                        facts.setdefault("lotFeatures", []).append(item)
                    elif header in ("view", "views"):
                        facts.setdefault("view", []).append(item)
                    elif header in ("interior features", "features"):
                        facts.setdefault("interiorFeatures", []).append(item)
                    elif header in ("exterior features", "exterior"):
                        facts.setdefault("exteriorFeatures", []).append(item)
                    elif header in ("hoa", "hoa & financial"):
                        if "fee" in item_lower or "$" in item:
                            import re as _re
                            m = _re.search(r'[\d,]+', item.replace(",", ""))
                            if m:
                                facts.setdefault("hoaFee", float(m.group()))
                    elif header in ("interior area",):
                        import re as _re
                        if "interior livable area" in item_lower or "living area" in item_lower:
                            m = _re.search(r'[\d,]+', item.replace(",", ""))
                            if m:
                                facts.setdefault("livingArea", int(m.group()))

                    # Parse "Key: Value" format for unmatched headers
                    if ": " in item:
                        key_part, val_part = item.split(": ", 1)
                        key_lower = key_part.lower().strip()
                        import re as _re
                        if "total interior livable area" in key_lower or "living area" in key_lower:
                            m = _re.search(r'[\d,]+', val_part.replace(",", ""))
                            if m:
                                facts.setdefault("livingArea", int(m.group()))
                        elif key_lower == "year built":
                            m = _re.search(r'\d{4}', val_part)
                            if m:
                                facts.setdefault("yearBuilt", int(m.group()))
                        elif "home type" in key_lower:
                            facts.setdefault("homeType", val_part.strip())
                        elif "lot size" in key_lower or (key_lower == "size" and header == "lot"):
                            facts.setdefault("lotSizeText", val_part.strip())
                        elif "hoa fee" in key_lower or "hoa monthly" in key_lower:
                            m = _re.search(r'[\d,]+', val_part.replace(",", ""))
                            if m:
                                facts.setdefault("hoaFee", float(m.group()))
                        elif "parking" in key_lower or "parking features" in key_lower:
                            facts.setdefault("parkingFeatures", []).append(item)
                            if "garage" in item_lower:
                                facts["hasGarage"] = True
                        elif "flooring" in key_lower:
                            facts.setdefault("flooring", []).append(val_part.strip())
                        elif "included" in key_lower and "appliance" not in key_lower:
                            # "Included: Dryer, Washer"
                            facts.setdefault("appliances", []).append(val_part.strip())
                        elif key_lower == "laundry":
                            facts.setdefault("laundryFeatures", []).append(val_part.strip())

                    # Keyword matching for items without structured format
                    if "heat" in item_lower and header not in ("heating", "heat"):
                        facts.setdefault("heating", []).append(item)
                    if ("cool" in item_lower or "a/c" in item_lower) and header not in ("cooling",):
                        facts.setdefault("cooling", []).append(item)
                    if any(k in item_lower for k in ("dishwasher", "refrigerator", "microwave", "oven", "stove")) and header not in ("appliances",):
                        facts.setdefault("appliances", []).append(item)
                    if "pool" in item_lower:
                        facts["hasPool"] = True
                    if "laundry" in item_lower and header not in ("laundry", "laundry room"):
                        facts.setdefault("laundryFeatures", []).append(item)
                    if any(k in item_lower for k in ("corner lot", "landscap", "waterfront", "cul-de-sac")):
                        facts.setdefault("lotFeatures", []).append(item)
                    if any(k in item_lower for k in ("gym", "fitness", "club", "tennis", "basketball", "playground", "sauna", "bbq")):
                        facts.setdefault("communityFeatures", []).append(item)

    except Exception as e:
        logger.warning(f"[details] DOM facts extraction failed: {e}")

    # Also try a simpler flat list approach as fallback
    if not any(k for k in facts if not k.startswith("_section_")):
        try:
            all_items_text = driver.execute_script("""
                var items = document.querySelectorAll(
                    '.ds-home-fact-list li, [data-testid="fact-item"], [class*="fact-item"]'
                );
                return Array.from(items).map(function(el) { return el.innerText.trim(); });
            """)
            if all_items_text:
                for item in all_items_text:
                    item_lower = item.lower()
                    if "heat" in item_lower:
                        facts.setdefault("heating", []).append(item)
                    if "cool" in item_lower or "air" in item_lower:
                        facts.setdefault("cooling", []).append(item)
                    if "pool" in item_lower:
                        facts["hasPool"] = True
                    if "garage" in item_lower:
                        facts["hasGarage"] = True
                    if any(k in item_lower for k in ("dishwasher", "washer", "dryer", "refrigerator")):
                        facts.setdefault("appliances", []).append(item)
        except Exception:
            pass

    return facts


def fetch_homedetails(driver, zpid: str, detail_url: str | None = None) -> dict | None:
    """
    Navigate to the Zillow homedetails page for the given zpid.
    Clicks 'Show more' buttons to load full description and facts before extracting.
    Returns a dict with enriched fields, or None if the page could not be parsed.
    """
    if detail_url:
        url = detail_url if detail_url.startswith("http") else ZILLOW_BASE + detail_url
    else:
        url = ZILLOW_DETAIL_URL.format(zpid=zpid)
    logger.info(f"[details] Fetching zpid={zpid}: {url}")

    driver.get(url)
    time.sleep(8)

    # Handle challenge
    if _is_challenge_present(driver):
        logger.warning(f"[details] Challenge on detail page zpid={zpid}")
        if not solve_press_hold_challenge(driver):
            logger.error(f"[details] Could not solve challenge for zpid={zpid}")
            return None
        driver.get(url)
        time.sleep(8)

    # Detect redirect to "not-found"
    current_url = driver.current_url
    if "not-found" in current_url or "404" in current_url:
        logger.warning(f"[details] Redirected to not-found for zpid={zpid}: {current_url}")
        return None

    page_source = driver.page_source

    title_match = re.search(r'<title[^>]*>(.*?)</title>', page_source, re.IGNORECASE | re.DOTALL)
    page_title = title_match.group(1).lower() if title_match else ""

    if "not found" in page_title or "404" in page_title or not page_title:
        logger.warning(f"[details] 404 for zpid={zpid} at {current_url} | title: {page_title!r}")
        return None

    lower_source = page_source.lower()
    if 'id="px-captcha"' in lower_source or 'px-captcha-container' in lower_source:
        logger.warning(f"[details] PerimeterX captcha for zpid={zpid}")
        return None

    # ── Scroll through the page to trigger lazy-loading before clicking ─────────
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight * 0.3);")
    time.sleep(1)
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight * 0.6);")
    time.sleep(1)
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(2)
    driver.execute_script("window.scrollTo(0, 0);")
    time.sleep(0.5)

    # ── Click 'Show more' buttons: 1st=description, 2nd=facts & features, 3rd=price history ──
    try:
        clicked_js = driver.execute_script("""
            var clicked = 0;
            var mainContent = document.querySelector('main') || document.querySelector('[class*="home-detail"]') || document.body;
            var buttons = mainContent.querySelectorAll('button');
            buttons.forEach(function(btn) {
                var text = (btn.innerText || btn.textContent || '').trim().toLowerCase();
                if ((text === 'show more' || text === 'see more' || text === 'read more' || text === 'see all' || text.includes('show more') || text.includes('see more')) &&
                    !btn.closest('nav') && !btn.closest('header') && !btn.closest('[class*="search"]') && !btn.closest('[class*="gallery"]')) {
                    try {
                        btn.scrollIntoView({block: 'center'});
                        btn.click();
                        clicked++;
                    } catch(e) {}
                }
            });
            return clicked;
        """)
        if clicked_js:
            logger.info(f"[details] JS-clicked {clicked_js} 'show more' button(s)")
            time.sleep(2)
    except Exception as e:
        logger.debug(f"[details] JS show-more click failed: {e}")

    _click_show_more_buttons(driver)

    # ── Extract description from DOM (more complete than __NEXT_DATA__) ────────
    dom_description = _extract_description_from_dom(driver)

    # ── Extract detailed facts from DOM ────────────────────────────────────────
    dom_facts = _extract_facts_from_dom(driver)
    if dom_facts:
        known_keys = [k for k in dom_facts if not k.startswith("_section_")]
        logger.info(f"[details] DOM facts extracted: {known_keys}")

    # ── Re-read page source after clicks (some data may be in updated DOM) ─────
    page_source = driver.page_source

    next_data = _parse_next_data(page_source)
    if not next_data:
        logger.warning(f"[details] No __NEXT_DATA__ found for zpid={zpid}")
        return None

    try:
        props = next_data.get("props", {}).get("pageProps", {})
        component_props = props.get("componentProps", {})

        gdp_raw = component_props.get("gdpClientCache")
        if not gdp_raw:
            logger.warning(f"[details] No gdpClientCache for zpid={zpid}")
            return None

        gdp_cache = json.loads(gdp_raw) if isinstance(gdp_raw, str) else gdp_raw
        property_data = _find_property_in_gdp(gdp_cache, zpid)

        if not property_data:
            logger.warning(f"[details] Property data not found in gdpClientCache for zpid={zpid}")
            return None

        photos = _extract_photos(property_data)
        reso = property_data.get("resoFacts", {}) or {}

        # Merge DOM-extracted facts into reso (DOM is more complete for sold listings)
        for key, val in dom_facts.items():
            if key.startswith("_section_"):
                continue
            if key not in reso or not reso[key]:
                reso[key] = val

        # Use DOM description if __NEXT_DATA__ description is empty
        description = property_data.get("description") or dom_description or ""
        if description:
            logger.info(f"[details] Description preview: {description[:120]!r}")

        enriched = {
            "photos": photos,
            "resoFacts": reso,
            "description": description,
            "yearBuilt": property_data.get("yearBuilt") or dom_facts.get("yearBuilt"),
            "lotAreaValue": property_data.get("lotAreaValue"),
            "lotAreaUnit": property_data.get("lotAreaUnit"),
            "hoaFee": property_data.get("monthlyHoaFee") or property_data.get("hoaFee") or dom_facts.get("hoaFee"),
            "livingArea": property_data.get("livingArea") or dom_facts.get("livingArea"),
            "bedrooms": property_data.get("bedrooms"),
            "bathrooms": property_data.get("bathrooms"),
            "price": property_data.get("price"),
            "homeType": property_data.get("homeType"),
        }

        logger.info(
            f"[details] zpid={zpid}: {len(photos)} photos, "
            f"desc={len(description)}chars, "
            f"resoFacts_keys={list(reso.keys())[:10]}"
        )
        return enriched

    except Exception as e:
        logger.error(f"[details] Failed to parse detail data for zpid={zpid}: {e}")
        return None

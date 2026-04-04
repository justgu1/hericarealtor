# Zillow Listings Updater

Scrapes the Zillow agent profile API endpoints and stores listings in PostgreSQL.

## How it works

1. **Browser session** — Opens Chrome (via `undetected-chromedriver`) and navigates to the agent's Zillow profile page to obtain valid cookies and the `zguid` session token required for the API.
2. **Anti-bot challenge** — If Zillow presents a PerimeterX *Press & Hold* button, Selenium's `ActionChains.click_and_hold` simulates a human holding it until the challenge passes.
3. **API scraping** — Navigates to three API endpoints inside the same browser session (cookies already set):
   - `active-listings` → `for_sale` category
   - `rental-listings` → `for_rent` category
   - `past-sales` → `sold` category
4. **Incremental updates** — Paginates each endpoint newest-first, stopping as soon as a listing `zpid` already present in the database is found. First run fetches everything; subsequent runs are fast.
5. **Storage** — Upserts new listings into PostgreSQL (`zillow_listings` table).

## Setup

```bash
cp .env.example .env
# fill in ZILLOW_ENCODED_ZUID, ZILLOW_PROFILE_SLUG, DATABASE_URL
```

## Run locally

```bash
pip install -r requirements.txt
USE_VIRTUAL_DISPLAY=false python -m app.main
```

## Run in Docker

```bash
docker build -t listings-updater .
docker run --env-file .env listings-updater
```

## Database schema

```sql
CREATE TABLE zillow_listings (
    zpid       TEXT        PRIMARY KEY,
    category   TEXT        NOT NULL,   -- for_sale | for_rent | sold
    data       JSONB       NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Adding a cron schedule (later)

Uncomment or add the following to the Dockerfile to run daily at 06:00 UTC:

```cron
0 6 * * * root cd /app && python -m app.main >> /var/log/listing-updater.log 2>&1
```

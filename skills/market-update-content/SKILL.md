---
name: market-update-content
description: Every Monday morning, research Utah CRE market conditions, draft a 300-word investor email update, create social versions, and feature an active listing from the RealNex portfolio.
homepage: https://www.realnex.com
metadata:
  {
    "openclaw":
      {
        "emoji": "📊",
        "requires":
          {
            "env":
              [
                "REALNEX_API_KEY",
                "REALNEX_BASE_URL",
                "N8N_WEBHOOK_SOCIAL_QUEUE",
                "STOCKTON_PHONE",
                "STOCKTON_MAILING_ADDRESS",
              ],
          },
        "primaryEnv": "REALNEX_API_KEY",
      },
  }
---

# Market Update Content

Weekly Monday market update: research Utah CRE conditions, draft the investor email, and create all social versions — automatically.

## Purpose

Stockton stays top-of-mind with his investor list with a consistent weekly market update. This skill handles all research, writing, and content distribution so the update goes out without manual effort.

## Trigger

- Scheduled: every Monday at 7:00 AM MT (set via n8n cron)
- Manual override: "Run the weekly market update"

## Inputs Required

- Current date (auto)
- Active listings from RealNex (auto-pulled for featured listing selection)
- Market data sources (see Utah/Stockton RE Notes)

## Steps

1. **Research current Utah CRE market conditions** using public web sources:
   - Search for recent Utah CRE news, transactions, and market reports
   - Sources to check: Utah CCIM chapter updates, LoopNet market reports, CoStar Utah market summaries, Utah DWS employment data (indicator for industrial demand), news.google.com searches for "Utah commercial real estate [current month/year]"
   - Pull 3-5 data points: cap rate trends, vacancy rates by property type, notable recent transactions, demand/supply indicators

2. **Select the featured listing** from RealNex:

   ```bash
   curl "$REALNEX_BASE_URL/properties?status=active&sort=created_at:desc&limit=5" \
     -H "Authorization: Bearer $REALNEX_API_KEY"
   ```

   Select the listing that best matches current market conditions or has been on market longest without a featured mention.

3. **Draft the INVESTOR EMAIL UPDATE** (300 words, market-focused):

   Subject: Utah CRE Market Update — [Month] [Year]

   Structure:
   - Opening (50 words): State the single most important market insight this week
   - Market Conditions (100 words): 2-3 data points on cap rates, vacancy, demand in key submarkets (Salt Lake, Utah County, Weber)
   - What It Means for Investors (75 words): Translate the data — buy signal, hold, watch a specific submarket?
   - Featured Listing (75 words): One active listing from the portfolio, tied to the market narrative
   - CTA: "Reply with questions or to schedule a call. | [Stockton phone]"
   - Footer (required — this is a list send): brokerage mailing address (`STOCKTON_MAILING_ADDRESS`) and one plain line: "You're getting this weekly update because you're on my Utah CRE list. Reply 'unsubscribe' anytime and I'll take you off."

4. **Create social versions** using the content-repurposing skill output structure:
   - LinkedIn: professional market analysis tone, 150-200 words
   - Facebook: conversational local angle
   - Instagram: key stats in visual-friendly format + hashtags
   - X/Twitter: sharpest single insight under 280 chars

5. **Queue everything** into the n8n social posting schedule:

   ```bash
   curl -X POST "$N8N_WEBHOOK_SOCIAL_QUEUE" \
     -H "Content-Type: application/json" \
     -d '{
       "source_type": "weekly_market_update",
       "week_of": "[monday_date_iso]",
       "email": { "subject": "...", "body": "..." },
       "linkedin": "...",
       "facebook": "...",
       "instagram": { "caption": "...", "hashtags": "..." },
       "twitter": "...",
       "featured_listing_id": "...",
       "scheduled_send": "[Monday 9:00 AM converted with the America/Denver time zone to ISO 8601]"
     }'
   ```

6. **Confirm to Stockton** via Telegram at 8:00 AM MT:
   ```
   Weekly market update ready ✓
   Email subject: [subject line]
   Featured listing: [address]
   Key stat used: [main data point]
   All content queued for 9am send.
   ```

## Output

- 300-word investor email (subject + body)
- LinkedIn post
- Facebook post
- Instagram caption + hashtags
- X/Twitter post
- All queued in n8n for Monday 9am MT send

## Definition of Done

All content written, queued in n8n, and Telegram confirmation sent to Stockton by 8:00 AM MT on Monday.

Use the `America/Denver` time zone when calculating both deadlines. Do not hard-code a UTC
offset: Utah is `-07:00` during standard time and `-06:00` during daylight saving time.

## Error Handling

- No market data found for current week → Use the most recent available data and note the date. Flag to Stockton: "Couldn't find fresh data this week. Using [date] figures — want me to hold or proceed?"
- No active listings in RealNex → Skip the featured listing section and note: "No active listings to feature. Adding a past success story instead."
- n8n queue failure → Deliver the full email draft and social content to Stockton via Telegram.

## Utah/Stockton RE Notes

- Target submarkets: Salt Lake County (industrial corridor), Utah County (American Fork, Lehi, Provo), Weber County (Ogden)
- Key metrics to track: Industrial vacancy (target: report if below 5% or above 8%), retail vacancy, land pricing per acre in growth areas
- Cap rate benchmarks: Industrial 5.0-6.5%, Retail 5.5-7.0% — note if trending up or down
- Investor list send time: Monday 9:00 AM MT performs best for CRE audience
- Email list segment: `investor_list` in RealNex
- CTA phone from env var `STOCKTON_PHONE`; footer mailing address from `STOCKTON_MAILING_ADDRESS` (CAN-SPAM requires the address + an opt-out on every list email)
- "Unsubscribe" replies: set `do_not_contact: true` in RealNex and remove from `investor_list` before next Monday's send
- QTS/geothermal deals and Elko County matters are human-only — do not reference these in the public market update

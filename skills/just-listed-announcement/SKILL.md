---
name: just-listed-announcement
description: Generate just-listed email, social captions (Facebook/Instagram/X), and SMS blast for a new CRE listing. SEO-optimized with key investment metrics.
homepage: https://www.realnex.com
metadata:
  {
    "openclaw":
      {
        "emoji": "📣",
        "requires": { "env": ["REALNEX_API_KEY", "REALNEX_BASE_URL", "N8N_WEBHOOK_SOCIAL_QUEUE"] },
        "primaryEnv": "REALNEX_API_KEY",
      },
  }
---

# Just-Listed Announcement

Write and queue all just-listed marketing content when a new property comes to market.

## Purpose

The moment a new listing is confirmed, generate ready-to-send email copy and social captions across all platforms. All content is SEO-optimized and metric-driven for a CRE investor audience.

## Trigger

- n8n automation: fires when a new RealNex property record is created (chained from crexi-sync)
- Telegram: "Write just-listed content for [address]"
- Manual: triggered as part of the listing-marketing-plan Day 1 workflow

## Inputs Required

- Property address (full)
- Property type (industrial / retail / office / land / flex)
- Asking price
- Size (sq ft)
- Cap rate (if available)
- NOI (if available)
- Price per sq ft (calculated or provided)
- One-line property highlight (e.g., "32-foot clear heights", "hard corner retail", "shovel-ready pad site")
- Listing URL on Crexi or LoopNet (for links)

## Steps

1. **Calculate price per sq ft** if not provided: `price / sqft`.

2. **Write the just-listed EMAIL** (for Stockton's investor/prospect list):

   Subject line options (generate 3, agent picks one):
   - "New Listing: [Property Type] in [City] | $[Price] | [Cap Rate]% Cap"
   - "Just Listed: [Size] SF [Property Type] — [City], Utah"
   - "[Address] — [Property Type] Now Available | [Key Metric]"

   Body (300-400 words):
   - Opening: lead with the strongest investment metric
   - Property overview: address, type, size, key physical features
   - Investment summary: price, cap rate, NOI, price/sq ft
   - Market context: 1-2 sentences on why this submarket is strong right now
   - CTA: "Reply to this email or call/text Stockton Farnsworth directly at [phone]"
   - Listing link

3. **Write FACEBOOK caption** (conversational, Utah local business/investor audience, 100-200 words):
   - Conversational tone ("Just listed a great one...")
   - Highlight the human angle (opportunity, location, market timing)
   - End with a question to drive engagement
   - Include listing link

4. **Write INSTAGRAM caption** (visual-first, 80-150 words + hashtags):
   - Lead with the visual hook (what makes the property photogenic or unique)
   - Key metrics in a clean format (use line breaks for scanability)
   - 5-10 hashtags: mix of specific (`#UtahCRE #SaltLakeIndustrial`) and broad (`#CommercialRealEstate #CREInvesting`)

5. **Write X/TWITTER post** (under 280 characters, punchy):
   - Format: "[Property type] just hit the market in [city]. [Key metric]. [1-line hook]. Link: [url]"

6. **Write SMS BLAST** (160 characters max):
   - Format: "New listing: [type], [city], [size]SF, $[price]. [Cap rate]% cap. Details: [short url] -Stockton RE"

7. **Queue all content** into the n8n social posting schedule:
   ```bash
   curl -X POST "$N8N_WEBHOOK_SOCIAL_QUEUE" \
     -H "Content-Type: application/json" \
     -d '{
       "property_address": "...",
       "email": { "subject": "...", "body": "..." },
       "facebook": "...",
       "instagram": { "caption": "...", "hashtags": "..." },
       "twitter": "...",
       "sms": "...",
       "scheduled_send": "[today_iso8601]"
     }'
   ```

8. **Confirm to Stockton** via Telegram with a preview of the X post and email subject line.

## Output

- 1 email (subject + body, 3 subject line options)
- 1 Facebook caption
- 1 Instagram caption + hashtag set
- 1 X/Twitter post
- 1 SMS blast (160 chars)
- All queued in n8n social schedule

## Definition of Done

All 5 content pieces are written, formatted, and confirmed-queued in the n8n workflow. Stockton has received a Telegram preview.

## Error Handling

- Missing cap rate/NOI → Generate content with "financials available upon request" language. Flag to Stockton: "Cap rate/NOI not in the record — I used placeholder language. Send metrics to update."
- n8n queue failure → Save all content to the RealNex property record as a note. Alert Stockton with the raw content in Telegram.
- Listing URL missing → Use the RealNex property ID as a reference and note: "Add Crexi/LoopNet URL to complete the posts."

## Utah/Stockton RE Notes

- SEO keywords to work in naturally: Utah commercial real estate, Salt Lake CRE, Utah industrial, Utah County commercial, [city] commercial property for sale
- Stockton's phone for CTAs: include in email and SMS — pull from env var `STOCKTON_PHONE`
- Investor list in RealNex segments: `investor_list` (primary), `prospect_industrial`, `prospect_retail`, `prospect_land`
- Cap rate benchmarks for context language: Industrial 5.0-6.5%, Retail 5.5-7.0%, Land (varies)

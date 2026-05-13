---
name: crexi-sync
description: Pull a Crexi listing by URL or address, format it for RealNex, and push it via the n8n workflow. Confirms sync to Stockton via Telegram.
homepage: https://www.crexi.com
metadata:
  {
    "openclaw":
      {
        "emoji": "🔄",
        "requires": { "env": ["REALNEX_API_KEY", "REALNEX_BASE_URL", "N8N_WEBHOOK_CREXI_SYNC"] },
        "primaryEnv": "N8N_WEBHOOK_CREXI_SYNC",
      },
  }
---

# Crexi → RealNex Sync

Pull listing data from Crexi and push it into RealNex via the existing n8n automation workflow.

## Purpose

When Stockton shares a Crexi URL or property address, automatically import the listing data into RealNex as a property record — no manual data entry.

## Trigger

- Telegram message containing a Crexi URL (e.g., `https://www.crexi.com/properties/...`)
- Telegram message: "Sync this Crexi listing: [URL or address]"
- n8n trigger from Crexi saved search / new listing alert

## Inputs Required

- Crexi listing URL **or** property address + city
- (Optional) Override fields: asking price, notes, assigned pipeline stage

## Steps

1. **Extract the Crexi listing ID** from the URL or search Crexi by address.

2. **Fetch listing data** from the Crexi public listing page (scrape or Crexi API if available):
   - Property address
   - Property type (industrial, retail, office, land, flex)
   - Size (sq ft)
   - Asking price
   - Cap rate / NOI (if listed)
   - Listing broker name and contact
   - Days on market
   - Property description

3. **Format the data for RealNex** property import schema:
   ```json
   {
     "address": "...",
     "city": "...",
     "state": "UT",
     "zip": "...",
     "property_type": "...",
     "size_sqft": 0,
     "asking_price": 0,
     "cap_rate": 0.0,
     "noi": 0,
     "source": "Crexi",
     "source_url": "https://www.crexi.com/properties/...",
     "listing_broker": "...",
     "notes": "Synced by OpenClaw on [date]"
   }
   ```

4. **Trigger the n8n webhook** to push the record into RealNex:
   ```bash
   curl -X POST "$N8N_WEBHOOK_CREXI_SYNC" \
     -H "Content-Type: application/json" \
     -d '[formatted_json_payload]'
   ```

5. **Wait for n8n confirmation** (webhook response or polling the n8n execution status).

6. **Confirm to Stockton via Telegram**:
   ```
   Crexi sync complete ✓
   [Property Address]
   Type: [property type] | Size: [sq ft] | Ask: $[price]
   Cap Rate: [X]% | NOI: $[Y]
   RealNex record created. ID: [realnex_id]
   ```

## Output

- New property record in RealNex with all Crexi data populated
- Telegram confirmation with property summary

## Definition of Done

RealNex property record exists and is visible in the correct pipeline/portfolio view. Stockton has received the Telegram confirmation with the RealNex record ID.

## Error Handling

- Crexi URL not accessible (private/off-market) → Reply: "Can't pull this listing — it may be off-market or require login. Send me the key details and I'll create the record manually."
- n8n webhook failure → Retry once after 30 seconds. If second attempt fails, alert Stockton: "RealNex sync failed for [address]. n8n error. Manual entry may be needed."
- Duplicate detected (same address already in RealNex) → Reply: "This property is already in RealNex as record [ID]. Want me to update it with the Crexi data?"

## Utah/Stockton RE Notes

- Primary Crexi search areas: Salt Lake County, Utah County, Weber County, Davis County, Utah
- Property types to track: industrial, flex industrial, retail (strip centers), commercial land
- The n8n webhook URL is stored in env var `N8N_WEBHOOK_CREXI_SYNC`
- After sync, the listing-marketing-plan and just-listed-announcement skills can be chained automatically (Phase 4)

---
name: property-analysis
description: Pull all available property data for a given address or Crexi/LoopNet URL, run comparable sales, calculate investment metrics, and output a structured deal summary attached to the RealNex property record.
homepage: https://www.realnex.com
metadata:
  {
    "openclaw":
      {
        "emoji": "🏗️",
        "requires": { "env": ["REALNEX_API_KEY", "REALNEX_BASE_URL"] },
        "primaryEnv": "REALNEX_API_KEY",
      },
  }
---

# Property Analysis

Pull comprehensive property data, run comps, calculate investment metrics, and deliver a structured deal summary — in minutes, not hours.

## Purpose

When evaluating a potential listing, acquisition, or client inquiry, Stockton can send an address and receive a full preliminary underwriting summary before he ever picks up the phone. Saves hours per deal and ensures he walks into every conversation as the most informed person in the room.

## Trigger

- Telegram: "Analyze [property address]"
- Telegram: "Pull comps for [address] — [property type]"
- Telegram: "What's [Crexi URL] worth?"
- Chained from crexi-sync skill after a new listing is imported

## Inputs Required

- Property address (full) OR Crexi/LoopNet listing URL
- Property type (industrial / retail / office / land / flex) — will auto-detect if not provided
- (Optional) Known asking price — for instant cap rate calculation

## Steps

1. **Identify the property** using the address or listing URL.
   - If a Crexi/LoopNet URL is provided, extract the property address from the listing.

2. **Pull all available property data** from public sources:

   a. **County Assessor record** (Salt Lake, Utah, or Weber county based on address):
      - Owner of record
      - Legal description
      - Property class / zoning
      - Year built
      - Building size (sq ft)
      - Lot size (acres or sq ft)
      - Current assessed value
      - Last sale date and price

   b. **Listing data** (if on Crexi/LoopNet):
      - Asking price
      - Cap rate (if listed)
      - NOI (if listed)
      - Days on market
      - Listing broker

   c. **Zoning information**: check county zoning maps for allowed uses, overlay districts, development potential.

3. **Pull comparable sales** (within 1 mile, last 24 months, same property type):
   - Search public records and LoopNet/Crexi for recent comparable transactions
   - Collect: address, sale date, sale price, size (sq ft), price per sq ft, cap rate if available
   - Target: 3-5 comps minimum
   - If insufficient comps within 1 mile, expand to 3 miles and note the adjustment

4. **Pull current market rents** for the submarket:
   - Search LoopNet lease listings for same property type in same zip code or submarket
   - Calculate average asking rent per sq ft (NNN basis for industrial/retail)
   - Note vacancy rate trend if data is available

5. **Calculate investment metrics**:
   ```
   Price Per Sq Ft = Asking Price / Building Size
   Market Rent (annual) = Avg Market Rent/SF × Building Size
   Estimated NOI = Market Rent × (1 - Vacancy Rate) - Est. Operating Expenses
   Estimated Cap Rate = Estimated NOI / Asking Price × 100
   GRM (if residential component) = Price / Gross Annual Rent
   ```
   - Flag if the listed cap rate differs significantly from the estimated cap rate (>0.5% variance).

6. **Produce the deal summary** in plain English:

   ```
   🏗️ PROPERTY ANALYSIS — [full address]

   Type: [property type] | Zoning: [zone code + allowed uses]
   Size: [sq ft] | Lot: [acres] | Year built: [year]
   Owner: [name]

   PRICING
   Asking: $[price] ($[price/sqft]/SF)
   Listed cap rate: [X]% | Listed NOI: $[Y]
   Est. cap rate (market basis): [X]%
   Days on market: [N]

   COMPARABLES — last 24 months, [radius]
   • [Address] — $[price] ($[$/SF]) — [date]
   • [Address] — $[price] ($[$/SF]) — [date]
   • [Address] — $[price] ($[$/SF]) — [date]
   Avg comp: $[$/SF]

   MARKET RENTS — [submarket]
   Avg asking rent: $[X]/SF NNN | Vacancy trend: [improving / stable / increasing]

   QUICK TAKE
   [2-3 sentences: Is this priced at, above, or below market? What's the opportunity or concern?
    Example: "Priced at $142/SF against comps averaging $128/SF — a 10% premium. Listed cap rate of 5.2% 
    looks tight vs. market basis of ~5.8%. Seller may have room to move, or this deal may sit."]
   ```

7. **Attach the deal summary to the RealNex property record**:
   ```bash
   curl -X POST "$REALNEX_BASE_URL/properties/[property_id]/notes" \
     -H "Authorization: Bearer $REALNEX_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Property Analysis — [date]",
       "body": "[full deal summary text]",
       "created_by": "OpenClaw"
     }'
   ```

8. **Send the deal summary to Stockton** via Telegram (full text).

## Output

- Full structured deal summary (property data, comps, metrics, quick take)
- Summary attached to RealNex property record
- Telegram delivery of the full summary

## Definition of Done

Deal summary is written, attached to RealNex, and delivered to Stockton. All three metric sections (pricing, comps, market rents) are present — even if some use estimates.

## Error Handling

- Assessor record not found → Note "assessor data unavailable" and proceed with available listing data. Flag the gap.
- Fewer than 3 comps found → Use what's available, note the limited comp pool, expand the search radius and note the adjustment.
- Property type unclear → Ask Stockton: "Is this industrial, retail, or land? The analysis approach is different for each."
- Asking price not available → Calculate metrics on assessed value with a note: "Using assessed value ($X) — confirm asking price for accurate analysis."

## Utah/Stockton RE Notes

- **Primary focus areas**: Industrial (Salt Lake, Utah, Weber counties), Retail strip centers, Commercial-zoned land
- **County assessor sites**:
  - Salt Lake: `https://slco.org/assessor/`
  - Utah County: `https://www.utahcounty.gov/dept/assessor/`
  - Weber County: `https://www.webercountyutah.gov/assessor/`
- Cap rate benchmarks: Industrial 5.0-6.5%, Retail 5.5-7.0%, Land (no cap rate — use price/acre vs. comps)
- For land: swap cap rate/NOI metrics with price per acre and zoning/development potential analysis
- Quick take should always end with a clear recommendation: buy signal, watch, or pass — Stockton makes the call but this framing saves him 20 minutes of analysis per deal

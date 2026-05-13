---
name: listing-marketing-plan
description: Generate a 30-day structured marketing plan for a CRE listing, formatted for Utah commercial properties and saveable to the RealNex property record.
homepage: https://www.realnex.com
metadata:
  {
    "openclaw":
      {
        "emoji": "📅",
        "requires": { "env": ["REALNEX_API_KEY", "REALNEX_BASE_URL"] },
        "primaryEnv": "REALNEX_API_KEY",
      },
  }
---

# Listing Marketing Plan

Generate a full 30-day marketing plan when a new commercial property is listed, tailored for the Utah CRE market.

## Purpose

When a new listing goes live, automatically build a comprehensive marketing plan covering social media, email, Crexi/LoopNet optimization, and investor outreach. Output is saved to the RealNex property record.

## Trigger

- Telegram: "Build a marketing plan for [address]"
- n8n automation: fires when a new property record is created in RealNex (chained from crexi-sync)
- Manual: "New listing at [address] — [property type], [price], [sq ft]"

## Inputs Required

- Property address
- Property type (industrial / retail / office / land / flex)
- Asking price
- Size (sq ft)
- Key investment metrics (cap rate, NOI, price per sq ft — as available)
- Target buyer/investor profile (optional, defaults to Utah CRE investor list)

## Steps

1. **Identify the property type** and load the appropriate plan template (see Utah/Stockton RE Notes).

2. **Generate the 30-day plan** with the following structure:

### Week 1 — Launch
- Day 1: Publish listing to Crexi with optimized description (trigger just-listed-announcement skill)
- Day 1: Verify LoopNet syndication is active
- Day 1: Email just-listed blast to investor/prospect list (from just-listed-announcement skill)
- Day 1: Post to all social channels (from just-listed-announcement skill)
- Day 2: LinkedIn direct outreach to 10 target investors matching the property profile
- Day 3: Follow up with any immediate email inquiries

### Week 2 — Amplification
- Day 8: Re-share social posts with new angle (investment metric focus)
- Day 9: Send targeted email to prospect segment most likely to buy this property type
- Day 10: Check Crexi listing performance (views, saves, inquiries) — adjust description if under-performing
- Day 12: LinkedIn post: market context article referencing the listing

### Week 3 — Engagement
- Day 15: Mid-month market update email featuring this listing
- Day 16: Instagram Reel / short video walkthrough (if photos/video available)
- Day 17: Follow up with all inquiry leads from weeks 1-2
- Day 19: Check LoopNet ad performance

### Week 4 — Review & Refresh
- Day 22: Price reduction or highlight adjustment if no LOI received
- Day 24: Re-blast to cold prospect list with updated angle
- Day 26: Facebook post targeting local business owners (retail/office) or investors (industrial/land)
- Day 28: Review all platform analytics and compile performance report
- Day 30: Decision point — continue plan, adjust price, or escalate to off-market outreach

3. **Output the plan** as a structured markdown document.

4. **Save to RealNex** by attaching the plan to the property record's notes/documents:
   ```bash
   curl -X POST "$REALNEX_BASE_URL/properties/[property_id]/notes" \
     -H "Authorization: Bearer $REALNEX_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"title": "30-Day Marketing Plan", "body": "[plan_content]", "created_by": "OpenClaw"}'
   ```

5. **Confirm to Stockton** via Telegram: "Marketing plan built for [address]. Saved to RealNex. Week 1 actions are ready to execute."

## Output

- Full 30-day marketing plan document
- Plan attached to RealNex property record
- Telegram summary with Week 1 action items

## Definition of Done

Plan is saved in RealNex. All Week 1 deliverables are queued or triggered. Stockton has received the Telegram confirmation.

## Error Handling

- Missing key metrics → Generate plan with placeholder fields and flag: "Cap rate/NOI missing — add them to the RealNex record for accurate email content."
- RealNex save failure → Save plan as a local file and alert Stockton with the content.

## Utah/Stockton RE Notes

**Plan adaptations by property type:**

- **Industrial** (Salt Lake, Utah, Weber counties): Emphasize logistics access, clear heights, dock doors, power. Target logistics companies, owner-users, 1031 exchange buyers.
- **Retail / Strip Centers**: Emphasize traffic counts, anchor tenant, lease terms. Target local investors, family offices.
- **Commercial Land**: Emphasize zoning, utilities stubbed, proximity to growth corridors. Target developers, builders.
- **Office**: Emphasize occupancy rate, WALT, NOI stability. Target passive income investors.

Social platforms in use: Facebook (local Utah CRE audience), Instagram (visual-first), LinkedIn (investor/professional), X/Twitter (punchy market takes).

Email list segments in RealNex: `investor_list`, `prospect_industrial`, `prospect_retail`, `prospect_land`.

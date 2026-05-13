---
name: prospect-research
description: Research and build prospect lists targeting off-market commercial property owners and active Utah CRE investors. Output structured lists logged to RealNex prospecting campaign records.
homepage: https://www.realnex.com
metadata:
  {
    "openclaw":
      {
        "emoji": "🔍",
        "requires": { "env": ["REALNEX_API_KEY", "REALNEX_BASE_URL", "APOLLO_API_KEY"] },
        "primaryEnv": "REALNEX_API_KEY",
      },
  }
---

# Prospect Research

Build targeted prospect lists for Stockton RE — off-market commercial property owners and active Utah CRE investors — and log them in RealNex.

## Purpose

Proactive pipeline development. This skill identifies prospects before they're ready to list or transact, giving Stockton a warm relationship before any competitor gets there.

## Trigger

- Telegram: "Research prospects for [property type] in [zip code or city]"
- Telegram: "Build a list of [target type] investors in Utah County"
- Scheduled: runs once a week (Friday morning) to refresh the prospecting pipeline
- Manual: "Start a prospecting campaign for industrial owners in Weber County"

## Inputs Required

- Target type: "off-market owners" OR "active investors" (or both)
- Property type filter (industrial / retail / office / land / flex)
- Geographic area: zip codes, city, or county in Utah
- Campaign name (for RealNex logging)

## Target Type 1 — Off-Market Commercial Property Owners

### Steps

1. **Search Utah county assessor public records** for commercial properties in target zip codes:
   - Salt Lake County Assessor: `https://slco.org/assessor/` (use public parcel search)
   - Utah County Assessor: `https://www.utahcounty.gov/dept/assessor/`
   - Weber County Assessor: `https://www.webercountyutah.gov/assessor/`
   - Filter by: property class = commercial, last sale date = more than 10 years ago

2. **Identify long-hold properties** (10+ years since last sale) as likely disposition candidates:
   - Cross-reference with LoopNet / Crexi to confirm property is NOT currently listed
   - Properties not listed + long hold time = highest probability of seller motivation

3. **For each qualifying property**, compile:
   ```
   Owner Name: [from assessor record]
   Property Address: [full address]
   Property Type: [from assessor classification]
   Size: [sq ft or acres]
   Assessed Value: [from assessor]
   Last Sale Date: [from assessor]
   Years Held: [calculated]
   Currently Listed: No (verified Crexi/LoopNet)
   Contact Info: [if available in public records]
   ```

4. **Output a structured prospect list** with all fields above.

---

## Target Type 2 — Active Investors in Utah CRE

### Steps

1. **Search LinkedIn** for individuals with CRE investment activity in Utah:
   - Titles to target: "Real Estate Investor", "CRE Investor", "Commercial Real Estate", "Investment Properties", "Real Estate Limited Partner", "Family Office"
   - Location filter: Utah, Salt Lake City area
   - Use LinkedIn search URL construction (manual or via LinkedIn Sales Navigator if available)

2. **Cross-reference with Apollo.io** for email addresses:
   ```bash
   curl -X POST "https://api.apollo.io/v1/people/match" \
     -H "Content-Type: application/json" \
     -H "Cache-Control: no-cache" \
     -d '{
       "api_key": "$APOLLO_API_KEY",
       "first_name": "[first]",
       "last_name": "[last]",
       "organization_name": "[company]",
       "domain": "[company_domain_if_known]"
     }'
   ```

3. **For each qualifying investor**, compile:
   ```
   Name: [full name]
   Title: [job title]
   Company: [company name]
   Email: [from Apollo]
   LinkedIn URL: [profile URL]
   Utah Connection: [city/county noted in profile]
   Property Type Interest: [if determinable from profile]
   ```

---

## After Building Either List

5. **Deduplicate against existing RealNex contacts** — don't prospect someone already in the CRM:
   ```bash
   curl "$REALNEX_BASE_URL/contacts?search=[name]&email=[email]" \
     -H "Authorization: Bearer $REALNEX_API_KEY"
   ```

6. **Create a RealNex prospecting campaign record** and log all new contacts:
   ```bash
   curl -X POST "$REALNEX_BASE_URL/campaigns" \
     -H "Authorization: Bearer $REALNEX_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "[campaign_name]",
       "type": "prospecting",
       "target_type": "[off_market_owners or active_investors]",
       "property_type": "[type]",
       "market": "[area]",
       "created_by": "OpenClaw",
       "created_at": "[date_iso]"
     }'
   ```
   Then add each prospect as a contact linked to the campaign.

7. **Confirm to Stockton** via Telegram:
   ```
   Prospect research complete ✓
   Campaign: [name]
   Found: [N] new prospects ([off-market owners: N] / [active investors: N])
   Logged to RealNex campaign: [campaign name]
   Ready to trigger cold-outreach skill? Reply YES to start.
   ```

## Output

- Structured prospect list (owner/investor profiles)
- All prospects logged in RealNex under the campaign record
- Telegram summary with counts and campaign ID

## Definition of Done

All qualifying prospects are added to RealNex. Campaign record exists. Duplicates have been removed. Stockton has received the Telegram summary.

## Error Handling

- County assessor site unavailable → Note the county, skip it, and flag: "[County] assessor site was unavailable. Prospects from that county are missing from this run."
- Apollo returns no email → Log the prospect without email, mark `email_status: not_found`. Can be retried with Hunter.io as a backup.
- LinkedIn rate-limited → Pause research, note how many were processed, resume next day.

## Utah/Stockton RE Notes

- Target counties: Salt Lake, Utah, Weber, Davis
- Long-hold threshold: 10+ years since last recorded sale
- Do NOT prospect anyone who has an existing broker relationship with a competitor (check the "Do Not Contact" list in RealNex)
- Apollo API key stored in env var `APOLLO_API_KEY`
- Hunter.io is a backup for email lookup: use `HUNTER_API_KEY` env var if Apollo fails
- QTS/geothermal deal owners and Elko County owners are human-only — do not add them to prospecting campaigns without Stockton's explicit direction

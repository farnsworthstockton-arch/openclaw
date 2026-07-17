---
name: underwriting-intake
description: When a new buyer or tenant inquiry comes in, send an intake form, structure the responses into a standardized profile, create the RealNex contact record, and brief Stockton via Telegram before he ever speaks to them.
homepage: https://www.realnex.com
metadata:
  {
    "openclaw":
      {
        "emoji": "📋",
        "requires": { "env": ["REALNEX_API_KEY", "REALNEX_BASE_URL", "STOCKTON_TELEGRAM_CHAT_ID", "STOCKTON_EMAIL", "STOCKTON_PHONE"] },
        "primaryEnv": "REALNEX_API_KEY",
      },
  }
---

# Buyer / Tenant Underwriting Intake

Qualify incoming buyers and tenants before Stockton talks to them. Structured profile in RealNex, Telegram briefing ready — so he walks into every call already knowing the deal.

## Purpose

Every inquiry gets a structured intake before it reaches Stockton. He never starts a call cold. The briefing format tells him the budget, property type, timeline, and financing status in one glance while he's driving to the next showing.

## Trigger

- New inquiry via website contact form (n8n webhook)
- New inquiry via Telegram referral: "New buyer inquiry from [name] — [contact info]"
- New Crexi/LoopNet inquiry notification (n8n email parser)
- Manual: "Start intake for [name]"

## Inputs Required

- Prospect name
- Contact info (email and/or phone)
- Inquiry type: buyer or tenant
- Property of interest (if they specified one)

## Steps

1. **Detect the inquiry type** (buyer or tenant) from the trigger source or Stockton's Telegram message.

2. **Send the intake form** via email (or SMS if only phone available):

### BUYER Intake Form:

   ```
   Subject: Quick questions before we connect — [Your Name]

   Hi [First Name],

   Thank you for your interest in [property address / Utah CRE in general].

   Before we connect, I'd like to make sure I find you exactly what you're looking for. A few quick questions:

   1. What is your target purchase price range? (e.g., $500K–$2M)
   2. Are you pre-approved for financing, or will you be paying cash?
      If financed: what lender and loan amount are you working with?
      If cash: are you able to provide proof of funds?
   3. What property type are you looking for? (industrial / retail / office / land / flex / other)
   4. What is your ideal timeline to close?
   5. Which areas of Utah are you focused on?
   6. Anything else I should know about your situation or requirements?

   Please reply directly to this email or text me at [Stockton phone].

   Looking forward to connecting.

   Stockton Farnsworth | Stockton Real Estate
   ```

### TENANT Intake Form:

   ```
   Subject: Quick questions before we connect — [Your Name]

   Hi [First Name],

   Thank you for your interest in [property address / space at ...].

   A few quick questions so I can point you to the right options:

   1. What is your monthly lease budget per square foot, or total monthly budget?
   2. What type of business will be operating in the space?
   3. How much square footage do you need?
   4. Do you have any special use requirements? (dock doors, drive-in access, heavy power, cold storage, specific zoning, etc.)
   5. What is your target move-in timeline?
   6. Which areas of Utah are you focused on?

   Please reply directly to this email or text me at [Stockton phone].

   Looking forward to connecting.

   Stockton Farnsworth | Stockton Real Estate
   ```

3. **Log that the intake form was sent** in RealNex:
   ```bash
   curl -X POST "$REALNEX_BASE_URL/contacts/[contact_id]/activities" \
     -H "Authorization: Bearer $REALNEX_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "email",
       "subtype": "intake_form_sent",
       "date": "[date_iso]",
       "notes": "Intake form sent by OpenClaw.",
       "created_by": "OpenClaw"
     }'
   ```

4. **When the intake response is received** (via email reply, parsed by n8n):

   **Structure the buyer/tenant profile**:
   ```json
   {
     "name": "[name]",
     "contact": { "email": "...", "phone": "..." },
     "inquiry_type": "buyer | tenant",
     "budget": {
       "min": 0,
       "max": 0,
       "currency": "USD"
     },
     "financing": {
       "status": "pre_approved | cash | unknown",
       "lender": "...",
       "proof_of_funds_submitted": false
     },
     "property_type": "[type]",
     "size_requirement_sqft": 0,
     "special_requirements": "...",
     "timeline": "...",
     "geography": "...",
     "notes": "...",
     "intake_date": "[date_iso]"
   }
   ```

5. **Create or update the RealNex contact record** with the structured profile:
   ```bash
   curl -X PATCH "$REALNEX_BASE_URL/contacts/[contact_id]" \
     -H "Authorization: Bearer $REALNEX_API_KEY" \
     -H "Content-Type: application/json" \
     -d '[structured_profile_json]'
   ```

6. **Set pipeline stage** to `active_buyer` or `active_tenant` in RealNex.

7. **Brief Stockton immediately via Telegram**:
   ```
   New [buyer/tenant] intake completed ✓

   [Name] | [Company if provided]
   Budget: $[min]–$[max]
   Looking for: [property type], [size] SF, [geography]
   Timeline: [timeline]
   Pre-approved: [Yes / No / Cash / Unknown]
   Special requirements: [notes or "None"]

   RealNex contact ID: [id]
   Ready to match to active listings? Reply YES.
   ```

8. **(Optional, if Stockton replies YES)**: Search RealNex active listings for matches based on property type, size, geography, and budget. Return top 3 matches with addresses and asking prices.

## Output

- Intake form sent to prospect
- Structured buyer/tenant profile created in RealNex
- Contact record updated with all intake data
- Telegram briefing to Stockton with one-glance summary

## Definition of Done

Prospect has received the intake form. Upon response: RealNex contact record is populated with the structured profile. Stockton has received the Telegram briefing before any direct conversation occurs.

## Error Handling

- Prospect does not respond to intake form within 48 hours → Send one gentle follow-up: "Just checking if my questions came through — happy to answer by phone instead. [Stockton phone]"
- Incomplete intake (some questions unanswered) → Structure the profile with the available data. Mark incomplete fields as `unknown`. Brief Stockton anyway and flag: "Partial intake — [list missing fields]. Ask during your first call."
- No email on file (phone only) → Send intake as SMS (condensed to fit message limits). Flag to Stockton that the response will come by text.

## Utah/Stockton RE Notes

- This skill ensures Stockton is never unprepared for a prospect call — every buyer/tenant has a profile before he dials
- Proof of funds / pre-approval letter: flag if not submitted. Stockton can decide whether to request it before showing properties.
- For high-value buyers (budget >$5M): flag immediately with a higher-priority Telegram message: "HIGH VALUE BUYER — [Name], budget $[X]. Intake complete. Recommend personal call today."
- QTS/geothermal deal inquiries and Elko County land buyer inquiries: flag to Stockton immediately, do NOT run automated intake. These are human-only.
- Stockton phone in env var `STOCKTON_PHONE`

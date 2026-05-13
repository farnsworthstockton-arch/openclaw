---
name: showing-management
description: Accept showing requests via text, check Stockton's calendar, confirm a time slot, create the invite, notify the prospect, log in RealNex, and send 24-hour reminders.
homepage: https://www.realnex.com
metadata:
  {
    "openclaw":
      {
        "emoji": "🗓️",
        "requires": { "env": ["REALNEX_API_KEY", "REALNEX_BASE_URL", "GOOGLE_CALENDAR_CREDENTIALS", "STOCKTON_EMAIL", "STOCKTON_PHONE"] },
        "primaryEnv": "GOOGLE_CALENDAR_CREDENTIALS",
      },
  }
---

# Showing Management

Handle the full showing lifecycle from booking request to 24-hour reminder — all triggered by a text from the field.

## Purpose

Stockton texts a showing request while driving. This skill handles: calendar check, time confirmation, invite creation, prospect notification, RealNex log, and reminder scheduling. Phase 1 uses calendar-based booking. Voice layer (for 2FA broker portals) is Phase 2.

## Trigger

Telegram message pattern: "Book a showing at [address] for [prospect name] — they're available [time options]"

Examples:
- "Book showing at 450 W 200 N American Fork for Dave Hansen — available Thursday 2pm or Friday 10am"
- "Schedule a tour at the 1800 S State St property for Pinnacle Capital — anytime next week works"

## Inputs Required

- Property address
- Prospect name (must exist in RealNex or will be created)
- Available time slots (1 or more options from the prospect)
- Any special notes (first showing, re-visit, specific areas to highlight)

## Steps

1. **Look up the property** in RealNex by address.

2. **Look up the prospect** in RealNex by name. If not found, create a basic contact record and flag to Stockton.

3. **Check Stockton's Google Calendar** for conflicts on the requested dates/times:
   ```bash
   # Use Google Calendar API with service account credentials
   curl "https://www.googleapis.com/calendar/v3/calendars/primary/events" \
     -H "Authorization: Bearer [access_token]" \
     -G \
     --data-urlencode "timeMin=[slot1_start_iso]" \
     --data-urlencode "timeMax=[slot1_end_iso]"
   ```

4. **Select the best available slot** (first conflict-free option). If all slots conflict, reply to Stockton: "Both times are blocked. What other times can work?"

5. **Create a Google Calendar event**:
   - Title: "Showing — [Property Address] w/ [Prospect Name]"
   - Location: property address
   - Description: prospect name, company, phone, RealNex contact ID, property RealNex ID
   - Duration: 1 hour default (adjust if Stockton specifies)
   - Invite Stockton's email

6. **Log the showing in RealNex** under the property record:
   ```bash
   curl -X POST "$REALNEX_BASE_URL/properties/[property_id]/activities" \
     -H "Authorization: Bearer $REALNEX_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "showing",
       "contact_id": "[prospect_contact_id]",
       "date": "[showing_date_iso]",
       "notes": "Showing booked via OpenClaw. Contact: [prospect name]",
       "created_by": "OpenClaw"
     }'
   ```

7. **Send confirmation to prospect** via email (or SMS if phone on file):
   ```
   Subject: Showing Confirmed — [Property Address]

   Hi [Prospect First Name],

   Your showing is confirmed:
   Property: [Address]
   Date/Time: [Day, Date at Time]
   Contact: Stockton Farnsworth | [phone]

   Please reply to confirm or reschedule if needed.

   Stockton Farnsworth | Stockton Real Estate
   ```

8. **Confirm to Stockton** via Telegram: "Showing booked ✓ — [Prospect Name] at [Address] on [Day] at [Time]. Calendar invite sent."

9. **Schedule 24-hour reminder**: Create an n8n delayed trigger (or a second calendar event 24 hours prior labeled "REMINDER: Showing tomorrow — [address] w/ [prospect]").

   Reminder messages to send at T-24h:
   - To Stockton (Telegram): "Reminder: Showing tomorrow — [Address] with [Prospect Name] at [Time]."
   - To prospect (email/SMS): "Just a reminder — your showing at [Address] is tomorrow at [Time] with Stockton Farnsworth. See you then!"

## Output

- Google Calendar event created
- RealNex activity log entry
- Prospect confirmation message sent
- 24-hour reminders scheduled
- Telegram confirmation to Stockton

## Definition of Done

Calendar event exists. RealNex activity log entry exists. Prospect has received confirmation. Reminders are scheduled.

## Error Handling

- All time slots conflict → Reply to Stockton: "Both requested times are blocked on your calendar. What alternative can you offer [Prospect Name]?"
- Prospect not found in RealNex → Create a stub record with name only. Flag: "[Prospect Name] wasn't in RealNex — I created a basic record. Add their contact details when you can."
- Calendar API failure → Log the showing in RealNex anyway, alert Stockton: "Calendar booking failed (API error). I've logged the showing in RealNex but you'll need to add it to your calendar manually."
- Prospect has no contact info on file → Skip prospect notification and flag to Stockton.

## Utah/Stockton RE Notes

- Phase 1 only: calendar-based booking. No headless browser or voice layer for 2FA broker portals yet (Phase 2).
- Google Calendar is the primary calendar. Use service account credentials stored in `GOOGLE_CALENDAR_CREDENTIALS`.
- Default showing duration: 60 minutes for industrial/land, 45 minutes for retail/office.
- For properties with access codes or gate locks, pull any notes from the RealNex property record and include in the calendar event description.

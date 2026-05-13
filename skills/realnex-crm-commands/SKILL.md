---
name: realnex-crm-commands
description: Accept natural language SMS/text commands and translate them into RealNex CRM actions — screenless CRM management for field agents.
homepage: https://www.realnex.com/api
metadata:
  {
    "openclaw":
      {
        "emoji": "🏢",
        "requires": { "env": ["REALNEX_API_KEY", "REALNEX_BASE_URL"] },
        "primaryEnv": "REALNEX_API_KEY",
      },
  }
---

# RealNex CRM Commands

Accept natural language text commands from Stockton Farnsworth (via Telegram) and execute them as RealNex CRM actions — no screen required.

## Purpose

Enables screenless CRM management. Stockton texts from the field; this skill parses the command and fires the appropriate RealNex API call.

## Trigger

Any inbound Telegram message that matches one of the command patterns below.

## Setup

```bash
export REALNEX_API_KEY="your-api-key"
export REALNEX_BASE_URL="https://api.realnex.com/v1"  # confirm with RealNex account
```

All requests use:

```bash
curl -X POST "$REALNEX_BASE_URL/..." \
  -H "Authorization: Bearer $REALNEX_API_KEY" \
  -H "Content-Type: application/json"
```

## Inputs Required

- Contact name (for lookup or creation)
- Action verb (log, move, set follow-up, add, pull up)
- Notes or details (for activity logs)
- Pipeline stage name (for moves)
- Date or day (for follow-up tasks)
- Property type and market (for new prospects)

## Command Patterns & Steps

---

### "Log call with [contact name] — [notes]"

1. Search RealNex for contact by name:
   ```bash
   curl "$REALNEX_BASE_URL/contacts?search=[contact_name]" \
     -H "Authorization: Bearer $REALNEX_API_KEY"
   ```
2. Extract `contact_id` from the response.
3. Create an activity log entry:
   ```bash
   curl -X POST "$REALNEX_BASE_URL/contacts/[contact_id]/activities" \
     -H "Authorization: Bearer $REALNEX_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "call",
       "notes": "[notes]",
       "date": "[today_iso8601]",
       "created_by": "OpenClaw"
     }'
   ```
4. Confirm to Stockton via Telegram: "Call logged with [contact name]. ✓"

---

### "Move [contact] to [pipeline stage]"

1. Search for contact by name (same as above).
2. Look up stage ID by name:
   ```bash
   curl "$REALNEX_BASE_URL/pipeline-stages" \
     -H "Authorization: Bearer $REALNEX_API_KEY"
   ```
3. Update the contact's pipeline stage:
   ```bash
   curl -X PATCH "$REALNEX_BASE_URL/contacts/[contact_id]" \
     -H "Authorization: Bearer $REALNEX_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"pipeline_stage_id": "[stage_id]"}'
   ```
4. Confirm: "[contact name] moved to [stage]. ✓"

---

### "Set follow-up with [contact] for [day/date]"

1. Search for contact.
2. Parse the date/day into ISO 8601 format (e.g., "Friday" → next Friday's date).
3. Create a task:
   ```bash
   curl -X POST "$REALNEX_BASE_URL/tasks" \
     -H "Authorization: Bearer $REALNEX_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "contact_id": "[contact_id]",
       "type": "follow_up",
       "due_date": "[iso_date]",
       "title": "Follow up with [contact name]",
       "created_by": "OpenClaw"
     }'
   ```
4. Confirm: "Follow-up with [contact name] set for [date]. ✓"

---

### "Add [company name] as a new prospect — [property type], [market]"

1. Create a new contact record:
   ```bash
   curl -X POST "$REALNEX_BASE_URL/contacts" \
     -H "Authorization: Bearer $REALNEX_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "company": "[company_name]",
       "type": "prospect",
       "property_type_interest": "[property_type]",
       "market": "[market]",
       "source": "OpenClaw",
       "pipeline_stage": "new_lead"
     }'
   ```
2. Confirm: "[company name] added as prospect. Type: [property type], Market: [market]. ✓"

---

### "Pull up [contact name]'s record"

1. Search for contact.
2. Fetch full record:
   ```bash
   curl "$REALNEX_BASE_URL/contacts/[contact_id]" \
     -H "Authorization: Bearer $REALNEX_API_KEY"
   ```
3. Return a plain-English summary to Telegram:
   ```
   [Contact Name] | [Company]
   Stage: [pipeline stage]
   Last Activity: [date] — [notes]
   Next Task: [due date] — [task title]
   Properties Interested In: [types]
   ```

---

## Output

Telegram confirmation message after each action. No screen needed on Stockton's end.

## Definition of Done

RealNex confirms the write (HTTP 200/201). Stockton receives a Telegram confirmation. If the action involved a task, the task appears in RealNex.

## Error Handling

- Contact not found → Reply: "Couldn't find [name] in RealNex. Want me to create a new record?"
- API failure → Reply: "RealNex API error: [status code]. I'll retry in 60 seconds. Flagging for review."
- Ambiguous name (multiple matches) → Reply: "Found [N] contacts named [name]. Which one? [list names + companies]"

## Utah/Stockton RE Notes

- Target pipeline stages (confirm exact names in RealNex): `new_lead`, `active_follow_up`, `nurture`, `under_contract`, `closed`
- Property types used: industrial, retail, office, land, flex
- Target markets: Salt Lake County, Utah County, Weber County, Davis County, Elko NV
- This skill connects to the existing n8n + RealNex integration. The n8n webhook can be used as an alternative to direct API calls for complex multi-step actions.
- Elko County matters are flagged human-only — do not auto-log or move without Stockton's explicit text command.

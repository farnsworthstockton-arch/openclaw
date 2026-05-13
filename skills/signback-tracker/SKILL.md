---
name: signback-tracker
description: Track outstanding signature items across active transactions, send 24-hour overdue reminders to the appropriate party, and alert Stockton via Telegram when all documents are fully executed.
homepage: https://www.realnex.com
metadata:
  {
    "openclaw":
      {
        "emoji": "✍️",
        "requires": { "env": ["REALNEX_API_KEY", "REALNEX_BASE_URL", "STOCKTON_TELEGRAM_CHAT_ID"] },
        "primaryEnv": "REALNEX_API_KEY",
      },
  }
---

# Transaction Signback Tracker

Monitor all active transactions for outstanding signature items and automatically send reminders until every document is fully executed.

## Purpose

Eliminate dropped balls on signbacks. The agent tracks every outstanding signature, sends reminders at the 24-hour mark without Stockton having to follow up manually, and alerts him the moment a deal is fully executed.

## Trigger

- Runs on a recurring schedule: every 4 hours during business hours (8am–8pm MT)
- Manual: "Check signbacks on [property address or deal ID]"
- Triggered by pdf-document-processing skill after new documents are filed

## Inputs Required

- Active transaction list from RealNex
- For each transaction: list of required documents and current signature status
- Contact information for each party requiring signature (buyer, seller, agents, attorneys)

## Steps

1. **Pull all active transactions** from RealNex:
   ```bash
   curl "$REALNEX_BASE_URL/transactions?status=active" \
     -H "Authorization: Bearer $REALNEX_API_KEY"
   ```

2. **For each transaction**, pull the document checklist and signature status:
   ```bash
   curl "$REALNEX_BASE_URL/transactions/[deal_id]/documents" \
     -H "Authorization: Bearer $REALNEX_API_KEY"
   ```

3. **Identify outstanding items**: any document with status `pending_signature` where `sent_at` timestamp is more than 24 hours ago.

4. **For each overdue item**:
   a. Identify the party responsible for signing (buyer, seller, buyer's agent, seller's agent)
   b. Look up their contact info in RealNex
   c. Send a reminder message:

   **Email reminder:**
   ```
   Subject: Action Required: [Document Name] — [Property Address]

   Hi [Name],

   A gentle reminder that we're still waiting on your signature for:

   Document: [Document Name]
   Transaction: [Property Address]
   Originally Sent: [date]

   Please sign at your earliest convenience to keep this transaction on track.

   Questions? Contact Stockton Farnsworth at [phone].
   ```

   **SMS reminder (if phone on file, 160 chars max):**
   ```
   Reminder: [Doc Name] needs your signature for [short address]. Sent [N] days ago. Questions? Call Stockton: [phone]
   ```

5. **Log the reminder** in the RealNex transaction record:
   ```bash
   curl -X POST "$REALNEX_BASE_URL/transactions/[deal_id]/notes" \
     -H "Authorization: Bearer $REALNEX_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Signback Reminder Sent",
       "body": "Reminder sent to [party name] for [document name] on [date/time]. Sent via [email/SMS].",
       "created_by": "OpenClaw"
     }'
   ```

6. **Check for fully-executed transactions**: any deal where all required documents now have `status: executed`.

7. **For fully-executed deals**, alert Stockton via Telegram:
   ```
   All docs executed ✓ — [Property Address]
   Transaction is fully signed. Deal: [deal_id]
   Buyer: [name] | Seller: [name]
   Closing date: [date]
   ```

8. **Compile a signback status report** and send to Stockton each morning at 8am MT:
   ```
   Good morning. Signback status:
   • [Address 1]: Waiting on buyer signature (PSA) — 2 days overdue. Reminder sent.
   • [Address 2]: All docs executed ✓
   • [Address 3]: Counter offer sent to seller — 6 hours, within window.
   ```

## Output

- Reminder messages sent to parties with overdue signatures
- RealNex transaction log entries for each reminder
- Telegram alert to Stockton when a deal is fully executed
- Daily morning Telegram summary of all active signback statuses

## Definition of Done

No overdue signature items exist without a reminder having been sent within the last 24 hours. Stockton has been notified of all fully-executed transactions.

## Error Handling

- Contact has no email or phone → Flag to Stockton: "Can't send reminder to [party] — no contact info on file for [deal]. Who should I contact?"
- RealNex API unavailable → Cache the last known status and retry every 30 minutes. Alert Stockton if outage exceeds 2 hours.
- Document already signed but status not updated in RealNex → After 2 reminders with no update, alert Stockton: "[Document] is still showing unsigned in RealNex after 2 reminders to [party]. Please verify and update the status manually."

## Utah/Stockton RE Notes

- Standard signback window for Utah CRE: 24 hours (send reminder), 48 hours (escalate to Stockton)
- Overdue defined as: `sent_at` timestamp > 24 hours ago with `status != executed`
- Key document types to track: PSA, Counter Offers, Addenda, Seller Disclosures, Assignment Agreements, Title Approval
- Do NOT send reminders on Elko County matters without Stockton's explicit approval — flag those to him instead

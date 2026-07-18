# TODO: openclaw

**Last updated:** 2026-07-18
**Status:** Working fork of OpenClaw with CRE skill modules added; not yet running always-on.
**Path:** openclaw

## Done
- [x] **Outreach/marketing copy compliance pass** (2026-07-18) — the automated marketing
  emails (cold-outreach 3-touch, just-listed blast, Monday market update) had **no opt-out
  language and no mailing address** — both are required on commercial email by CAN-SPAM, and
  the just-listed SMS blast lacked "Reply STOP to opt out" (carriers filter marketing texts
  without it, so the blast would silently die). Added in-voice opt-out lines ("just say so —
  I'll close the file, no hard feelings"), mailing-address footers, and STOP language; wired a
  new `STOCKTON_MAILING_ADDRESS` env var into the 3 skills' `requires.env` + `.env.example`.
  Also: declared `STOCKTON_PHONE` in market-update-content (a 4th instance of the 2026-07-17
  audit bug — its email CTA uses the phone but never declared it); documented the previously
  undocumented `DEAL_DOCS_BASE_PATH` (pdf-document-processing) in `.env.example`; added
  content-repurposing + pdf-document-processing to the ELI5 verification checklist (both are
  fork-added CRE skills that were missing from it); cut one salesy line from the Day 5
  follow-up ("Happy to make it worth your time" — violated the skill's own no-sales-language
  rule). Deliberately KEPT the existing copy everywhere else (Day 1 "Quiet Question" subject,
  Day 12 "closing the loop" email, intake forms, showing confirmations) — it is already at the
  bar and rewriting it would be churn. Transactional messages (showing confirmations, signback
  reminders, intake forms) deliberately got NO unsubscribe footer — they respond to the
  recipient's own request/transaction, and a footer there would read as spam.
- [x] **CRE skill env-requirement audit + fix** (2026-07-17) — swept all 11 CRE skills for
  env vars used in the skill body but missing from `requires.env` (the gateway's readiness
  check only reads `requires.env`, so a missing var makes the skill report "ready" and then
  fail silently). Found **3** with the bug — `cold-outreach`, `just-listed-announcement`,
  `underwriting-intake` all insert `STOCKTON_PHONE` into messages sent to real prospects but
  never declared it; without it, outreach/SMS/intake forms go out with a blank callback
  number. Added `STOCKTON_PHONE` to all three. Other **8** skills clean; `HUNTER_API_KEY`
  (prospect-research) left undeclared on purpose — it is a genuine optional Apollo fallback.
  Verified: every `$VAR` used in a bash/curl block across all CRE skills is now declared.
- [x] **Documented all CRE env vars in `.env.example`** (2026-07-17) — the template had **zero**
  CRE vars, so the owner had no list of what to configure. Added a realtor-friendly section
  covering all 10 (RealNex, Stockton contact details, n8n webhooks, Apollo/Hunter, Google
  Calendar) with where to get each value.
- [x] **`ELI5.md` created** (2026-07-09 health sweep) — plain-English overview + a tick-list of the CRE skills for Stockton to verify.
- [x] Added CRE skill modules (crexi-sync, cold-outreach, prospect-research, property-analysis, underwriting-intake, listing-marketing-plan, just-listed-announcement, market-update-content, showing-management, signback-tracker, realnex-crm-commands).
- [x] Defaulted Anthropic provider to Opus.
- [x] Fork wired to Stockton's own remote (`farnsworthstockton-arch/openclaw`) with `upstream` tracking the public project.

## Next
- [ ] Stockton: read `ELI5.md` and tick off each CRE skill to confirm it actually works.
- [ ] Try each CRE skill end-to-end against a real listing/prospect once the gateway is running somewhere.

## 🧑 Human / Blockers
<!-- Auto-managed by CrewDeck (https://crew.146-190-119-77.sslip.io). These boxes stay in sync with the project's board: approve a task in CrewDeck and its box is ticked here; tick a box here and CrewDeck shows it done. Only these exact lines are auto-managed — edit anything else freely. -->
- [ ] After ELI5.md is written, read it and check off each feature to confirm it actually works.
- [ ] Decide where to run the customized OpenClaw gateway always-on (the machine Stockton actually uses it from).
- [ ] Approve a recurring routine to pull upstream OpenClaw + reapply the CRE skill customizations so the fork stays current.


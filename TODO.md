# TODO: openclaw

**Last updated:** 2026-07-18
**Status:** Working fork of OpenClaw with CRE skill modules added; not yet running always-on.
**Path:** openclaw

## Done

- [x] **signback-tracker missing STOCKTON_PHONE — 5th (and final) instance of the blank-callback
      bug + permanent guard** (2026-07-18) — `signback-tracker` sends signature-reminder **emails and
      SMS to real third parties** (buyers, sellers, agents, attorneys): "Contact Stockton Farnsworth at
      [phone]" and "Call Stockton: [phone]". It declared `REALNEX_API_KEY`, `REALNEX_BASE_URL`,
      `STOCKTON_TELEGRAM_CHAT_ID` — but **not `STOCKTON_PHONE`**. Same silent failure the 07-17/07-18
      audits chased: the gateway readiness gate only reads `requires.env`, so the skill reports "ready"
      and every reminder goes out with a blank callback number. The prior audits missed this one because
      they grepped for `$VAR` shell refs, and this skill references the number as a **`[phone]` prose
      placeholder** the LLM fills from env — a different surface the `$VAR` sweep is structurally blind
      to. Fixed: added `STOCKTON_PHONE` to `requires.env` and added the "pull from env var
      `STOCKTON_PHONE`" pointer to its RE Notes (matching cold-outreach / just-listed / underwriting-
      intake). **Swept the whole class**: every `[phone]` across all 13 CRE skills is Stockton's own
      callback; the other 3 callers (cold-outreach, showing-management, just-listed) all already declared
      it — signback was the lone gap. Then **made it permanent**: extended
      `src/agents/skills.cre-skills-frontmatter.test.ts` with a placeholder→env-var check (any body using
      `[phone]` must declare `STOCKTON_PHONE`). Proved the guard fails on the pre-fix frontmatter and
      passes after. Suite: 65 tests green (was 52). `[email]` deliberately NOT guarded — it also appears
      as a prospect-lookup query param (`&email=[email]`), so it isn't reliably Stockton's address.
- [x] **CRE frontmatter guard test committed** (2026-07-18) — a prior session left
      `src/agents/skills.cre-skills-frontmatter.test.ts` in the working tree uncommitted; verified it
      passes and committed it (turns the manual `requires.env` audits into a permanent regression guard).
- [x] **Property-analysis deal-summary formatting fix** (2026-07-18) — the deal summary
      Stockton reads on Telegram before every call (`property-analysis` skill, step 6) used a
      fixed-width `================` ASCII underline under every section header. The underline
      never matched the header text length (e.g. `QUICK TAKE` is 10 characters but got a
      16-character underline; `COMPARABLES (last 24 months, [radius])` is 39 characters and got
      the same 16), so every generated report renders with ragged, mismatched banners — a visible
      formatting bug in a document Stockton reads on every single deal. It was also the only skill
      using this ASCII-banner style: every other CRE skill's Telegram output (crexi-sync,
      underwriting-intake, signback-tracker, market-update-content) uses a short title line,
      optional ✓, blank line, then `Label: value` pairs and `•` bullets for lists — property-analysis
      was the one screen disagreeing with that established house style. Rewrote the template to
      match: `🏗️ PROPERTY ANALYSIS — [address]` title (reusing the skill's own emoji), no ASCII
      banners, `•` bullets for the comps list (also more correct — comps aren't ranked, so numbering
      them implied an ordering that wasn't real). Verified no other code/tests reference the old
      literal strings (`grep` across the repo, zero hits) so nothing else depends on the old format.
      **Could not verify visually** — I'm headless and this repo's gateway isn't running always-on
      yet (see Human/Blockers below), so I read the template as text and reasoned about how it
      renders on a phone; I did not see it rendered in an actual Telegram message. Once the gateway
      is live, run property-analysis once for real and eyeball the message.
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

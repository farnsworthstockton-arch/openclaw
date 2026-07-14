# TODO: openclaw

**Last updated:** 2026-07-09
**Status:** Working fork of OpenClaw with CRE skill modules added; not yet running always-on.
**Path:** openclaw

## Done
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


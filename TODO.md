# TODO: openclaw

**Last updated:** 2026-07-29 (daily-improve)
**Status:** Working fork of OpenClaw with CRE skill modules added; not yet running always-on.
**Path:** openclaw

## Done

- [x] **`openclaw skills info` misreported "any of" binary requirements as all-installed**
      (2026-07-29 daily-improve) — the prior automated passes were all UI a11y/CSS-token
      sweeps in `ui/src/ui/views/*.ts`; this pass looked in non-UI `src/` instead and found a
      real wrong-data-output bug. `resolveMissingAnyBins` (`src/shared/requirements.ts`)
      correctly treats `anyBins` as "any one of these satisfies the requirement" and reports
      `missing.anyBins` as empty as soon as one candidate binary is present. But
      `formatSkillInfo` (`src/cli/skills-cli.format.ts`) took that single aggregate
      satisfied/missing boolean and stamped it onto _every_ candidate binary's name
      individually. So a skill like `coding-agent` (`requires.anyBins: ["claude", "codex",
    "opencode", "pi"]`) with only `claude` installed printed `✓ claude, ✓ codex, ✓ opencode,
    ✓ pi` — falsely claiming three uninstalled CLIs were present. `src/cli/hooks-cli.ts`
      already renders the equivalent "any of" hook requirement correctly (one combined
      ✓/✗ line naming the whole group, e.g. `✓ (any of: a, b, c)`), so brought
      `skills-cli.format.ts` in line with that existing correct pattern instead of inventing
      a new one. Added a regression test in `src/cli/skills-cli.formatting.test.ts`
      constructing a `SkillStatusEntry` with a satisfied `anyBins` requirement and asserting
      the output no longer contains a bogus `✓` for the unsatisfied candidates. Verified with
      `npx vitest run src/cli/skills-cli.formatting.test.ts` (3 passed); a full-repo `tsc
    --noEmit` run OOMs on this box regardless of this change (pre-existing environment
      limit, unrelated).
- [x] **Command palette: no ARIA combobox/listbox semantics for screen readers** (2026-07-24
      visual pass) — swept `ui/src/ui/views/*.ts` for the mouse-only-clickable-div bug class
      fixed in prior passes and found the remaining `@click` handlers are all real `<button>`s or
      already-keyboard-handled patterns (e.g. `command-palette.ts`'s arrow-key/Enter/Escape
      navigation, `dreaming.ts`'s modal Escape handling). That palette, though, is a classic
      combobox-over-listbox widget — arrow keys move a visually-highlighted "active" item, but
      the markup had no `role="combobox"`/`listbox`/`option` or `aria-selected`/
      `aria-activedescendant`, so a screen reader user got no indication which item was active or
      that the list was navigable at all. Added `role="combobox"` + `aria-expanded` +
      `aria-controls` + `aria-activedescendant` on the input, `role="listbox"` on the results
      container, and `role="option"` + `aria-selected` + a stable `id` on each item. Verified
      `pnpm --filter ./ui build` still succeeds.
- [x] **Overview log-tail refresh icon: keyboard-inaccessible, no aria-label** (2026-07-24
      visual pass) — swept remaining `@click`-only elements across `ui/src/ui/views/*.ts` for the
      same bug class fixed in prior passes (usage bars, sessions/skills/cron rows, wiki modal) and
      found one more: `overview-log-tail.ts`'s refresh icon is a bare `<span @click>` nested inside
      a `<summary>` (the "Gateway Logs" details toggle), so it was mouse-only and, worse, clicking
      it without the `stopPropagation` guard would also fire the parent's expand/collapse. Added
      `role="button"`, `tabindex="0"`, `aria-label`, and an Enter/Space `@keydown` handler
      (mirroring the click handler's `preventDefault`/`stopPropagation`), a new
      `overview.logTail.refresh` i18n string, and a `:focus-visible` outline in
      `ui/src/styles/components.css`. Verified `pnpm --filter ./ui build` still succeeds.

- [x] **Dreams diary wiki-preview modal: no Escape-to-close, missing dialog semantics**
      (2026-07-24) — visual/a11y pass swept `ui/src/ui/views/*.ts` for `<div @click>` handlers
      lacking keyboard equivalents (the same bug class fixed in prior passes for usage bars,
      session rows, skills/cron rows) and found the remaining ones are either real `<button>`s or
      modal backdrops that close-on-click. Of the backdrops, `dreaming.ts`'s
      `renderWikiPreviewOverlay` (the "Dreams Diary" wiki page preview) was the one outlier: every
      other modal in the app (command palette, chat side panel) handles `Escape` to close, but
      this one didn't, and its panel had no `role="dialog"`/`aria-modal` for screen readers.
      Added an `Escape` keydown handler on the backdrop (bubbles up from whatever control has
      focus inside, e.g. the Close button) and `role="dialog"`, `aria-modal="true"`,
      `aria-label` on the panel. Verified `pnpm --filter ./ui build` still succeeds.
- [x] **`.code-block-copy__done` checkmark: undefined `--success` CSS var** (2026-07-23) —
      visual pass swept `ui/src/ui/views/*.ts` for the mouse-only clickable-`<div>` a11y bug
      fixed in prior passes (usage bars, skills/cron rows, heatmap cells) and found no new
      instances — the remaining `@click` divs (command palette items, chip-input focus wrapper,
      modal backdrops) are either already keyboard-navigable via their own `@keydown` handler or
      wrap a real focusable control. Did find one more instance of the undefined-CSS-token bug
      class (previously found with `--warning`): `ui/src/styles/components.css`'s
      `.code-block-copy.copied .code-block-copy__done` referenced `var(--success, #22c55e)`, but
      `--success` is never defined in `ui/src/styles/base.css` (the real token is `--ok`, which
      is theme-aware: `#22c55e` dark / `#15803d` light), so the copy-confirmation checkmark
      always showed the dark-mode green even in light mode. Switched to `var(--ok)`. Verified
      `pnpm --filter ./ui build` still succeeds.
- [x] **Usage overview daily/session bars, sessions sort headers: keyboard-inaccessible;
      `.btn--icon` light theme + chat unpin button: remaining polish** (2026-07-23) — follow-up
      visual/a11y pass found the same "clickable div with no keyboard access" bug in
      `ui/src/ui/views/usage-render-overview.ts`'s daily bar chart (`daily-bar-wrapper`) and
      session list rows (`session-bar-row`) — both `@click`-only, mirroring the hourly heatmap
      cells fixed previously. Added `role="button"`, `tabindex="0"`, `aria-pressed`, `aria-label`,
      and an Enter/Space `@keydown` handler to both, plus matching `:focus-visible` outlines in
      `ui/src/styles/usage.css`. Also found `ui/src/ui/views/sessions.ts`'s sortable `<th>` column
      headers were `@click`-only; added `tabindex="0"`, `aria-sort`, and a keydown handler.
      Separately, `ui/src/styles/components.css`'s `:root[data-theme-mode="light"] .btn--icon`
      and its `:hover` state hardcoded `background: #ffffff` instead of the theme's `--card` token
      (which is `#ffffff` in every light palette already) — same bug class as the earlier
      `--warn`/`--warning` token fixes. Switched both to `var(--card)`. Lastly,
      `ui/src/ui/views/chat.ts`'s pinned-message unpin button was icon-only with only a `title`,
      no `aria-label` — added one. Verified `pnpm --filter ./ui build` still succeeds.
- [x] **Skills/ClawHub list rows + cron job rows: keyboard-inaccessible; compaction fallback
      indicator: hardcoded hex color** (2026-07-23) — visual/a11y pass found three more instances
      of the `list-item-clickable` pattern where a plain `<div @click>` row (not a `<button>`) had
      no `role="button"`, `tabindex="0"`, or keydown handler, unlike the usage-view hourly heatmap
      cells fixed in a prior pass: `ui/src/ui/views/skills.ts`'s per-skill row (`renderSkill`) and
      its ClawHub search-result row (`renderClawHubResults`), and `ui/src/ui/views/cron.ts`'s
      per-job row (`renderJob`) — all three were mouse-only despite every action inside them
      already being reachable by keyboard. Added `role="button"`, `tabindex="0"`, and an
      Enter/Space `@keydown` handler mirroring each row's click handler to all three. Also found
      `ui/src/styles/components.css`'s `.compaction-indicator--fallback` hardcoded `color:
#d97706` / `border-color: rgba(217, 119, 6, ...)` instead of the theme's `--warn` token
      (used by every sibling status color in the same block, and the same class of bug as the
      `--warning` token issue below) — it wouldn't repaint correctly in light mode. Switched to
      `var(--warn)` with a `color-mix()` border. Verified `pnpm --filter ./ui build` still
      succeeds.
- [x] **Nostr profile form + overview attention item: undefined `--warning` CSS var** (2026-07-23) —
      visual pass found `ui/src/ui/views/channels.nostr-profile-form.ts`'s unsaved-changes notice
      and `ui/src/styles/components.css`'s `.ov-attention-item.warn` border referenced
      `var(--warning, ...)` / `var(--warning-subtle, ...)`, tokens never defined in
      `ui/src/styles/base.css`, so both always fell back to a hardcoded amber that ignored the
      active theme instead of using the real `--warn` / `--warn-subtle` tokens already used by
      `chat.ts`, `skills.ts`, and elsewhere in `components.css`. Switched both to the real tokens.
      Verified `pnpm --filter ./ui build` still succeeds.
- [x] **Usage view: hourly heatmap cells were mouse-only** (2026-07-23) — visual/a11y pass found
      `ui/src/ui/views/usage-metrics.ts`'s 24-cell hourly usage mosaic (`.usage-hour-cell`) was a
      plain `<div @click>` with only a `title` tooltip — not focusable, no accessible name, and
      unusable from the keyboard, unlike every button-driven filter elsewhere in the same view.
      Added `role="button"`, `tabindex="0"`, `aria-pressed`, `aria-label` (reusing the existing
      tooltip text), and an Enter/Space `@keydown` handler mirroring the click handler (including
      shift-click multi-select via `shiftKey`). Added a matching `:focus-visible` outline in
      `ui/src/styles/usage.css` since the cell had no prior focus style. Verified
      `pnpm --filter ./ui build` still succeeds.
- [x] **Error callouts repo-wide: not announced to screen readers** (2026-07-23) — visual/a11y
      pass found that only `cron.ts`'s refresh-error strip had `role="alert" aria-live="assertive"`
      on its `callout danger` block (fixed in a prior pass); every other `.callout.danger` error
      message across the UI (channels, agents, sessions, chat, skills, config, login-gate, logs,
      nodes, debug, instances, markdown-sidebar, gateway URL confirmation, etc. — 29 call sites in
      24 files) rendered as plain text with no live-region semantics, so a screen-reader user got
      no announcement when a save/connect/probe/checkpoint action failed silently in the
      background. Added `role="alert" aria-live="assertive"` to all of them to match the
      established pattern. Verified `pnpm --filter ./ui build` still succeeds.
- [x] **Usage view: query-chip remove button missing `aria-label`** (2026-07-23) — visual/a11y
      pass found `ui/src/ui/views/usage.ts`'s query-term chip remove button (`×`, line ~690)
      had only a `title` attribute, unlike every sibling remove button in the same view family
      (`usage-render-overview.ts` filter chips) and the repo-wide icon-only-button convention.
      Added `aria-label="Remove ${label}"` matching that pattern. Verified `pnpm build` (ui)
      still succeeds.
- [x] **Config form: array/map "remove" buttons missing `aria-label`** (2026-07-23) — visual/a11y
      pass found `ui/src/ui/views/config-form.node.ts`'s dynamically-repeated array-item and
      map-entry remove buttons (lines ~1132 and ~1282) rendered only a trash icon with a `title`
      attribute, no `aria-label`, unlike the sensitive-value reveal toggle earlier in the same
      file and the repo-wide icon-only-button convention (chat.ts, agents-panels-overview.ts).
      Screen-reader users navigating by role got an unlabeled "button" for a destructive delete
      action, worse than usual since a list can contain many identical trash icons with no
      distinguishing name. Added matching `aria-label="Remove item"` / `aria-label="Remove entry"`.
      Verified `pnpm --filter ./ui build` still succeeds.
- [x] **Channels view: missing loading cue; markdown sidebar close button: no accessible name**
      (2026-07-23) — with the undefined-CSS-custom-property bug class fully closed, this pass
      looked for other visual gaps by diffing dominant patterns against outlier views.
      `ui/src/ui/views/channels.ts` declared `props.loading` in its props type but never read
      it, so the channel health card gave no cue while data was fetching (every other view with
      a refresh action shows a loading label, e.g. `sessions.ts`, `debug.ts`, `nodes.ts`) —
      added a `t("common.loading")` cue in the health card's timestamp slot. Separately,
      `ui/src/ui/views/markdown-sidebar.ts`'s icon-only sidebar-close button only had a `title`
      attribute (not reliably read by screen readers), unlike the equivalent close button in
      `chat.ts` which has `aria-label="Close search"` — added `aria-label="Close sidebar"`.
      Verified `pnpm build` (vite) still succeeds. Ruled out (verified by reading, not just
      grep): dreaming.ts wiki-preview error handling, channel-provider `callout` styling
      differences (deliberate shared pattern, not an outlier), missing `alt` text (all present),
      "no items yet" empty states elsewhere (already consistent), and non-focusable clickable
      `<div @click>` in skills.ts/cron.ts/command-palette.ts (repo-wide dominant pattern, a
      systemic redesign concern rather than a small surgical fix, out of scope for this pass).
- [x] **Accessibility fixes: unlabeled remove button, unannounced cron error** (2026-07-23) —
      visual/a11y pass confirmed the CSS-custom-property sweep below is fully closed (every
      remaining `var(--x)` with no matching token already carries an inline fallback, so
      nothing renders broken). Found two new issues: the fallback-model chip's remove button
      in `ui/src/ui/views/agents-panels-overview.ts` rendered only `×` with no accessible name
      (every other remove button in the codebase has one), so screen readers announced it as
      unlabeled — added `aria-label="Remove ${chip}"`. The cron summary strip's refresh error
      in `ui/src/ui/views/cron.ts` rendered as plain gray `.muted` text with no `aria-live`,
      unlike the `callout danger` + `aria-live` pattern used for errors elsewhere in the app —
      switched it to `callout danger` with `role="alert" aria-live="assertive"`. Left the
      hardcoded hex colors in the `dreaming.ts` sleeping-lobster SVG illustration alone since
      that's likely intentional brand art, not a themed UI element. Verified `vite build`
      still succeeds.
- [x] **Full repo-wide sweep for undefined CSS custom properties (same bug class, now closed)**
      (2026-07-23) — the last three passes fixed instances of this bug one file/component at a
      time; this pass instead diffed every `var(--x)` used anywhere in `ui/src` against every
      token actually defined in `ui/src/styles/*.css` to find every remaining instance at once.
      Found 8 more usages with no fallback value (meaning the whole CSS property goes invalid,
      not just falls back to a default): `--fg` (should be `--text`) in
      `.login-gate__help-title`, `.login-gate__steps code`, and `.login-gate__command` in
      `components.css` — the auth login-gate screen, i.e. the first thing a new user sees;
      `--foreground` (should be `--text`) in the welcome-screen `h2`, the suggestion chips, and
      `.chat-side-result__question`/`:hover` across `layout.css` and `components.css`;
      `--font-mono` (should be `--mono`) in the login-gate code block and the chat hint `kbd`;
      `--shadow-card` (should be `--shadow-md`) on the cron filter dropdown; and `--surface`
      (should be `--panel`) on the dreams sort toggle background. Left the several other
      undefined-token usages alone since they already carry an inline fallback (e.g.
      `var(--warning, #d97706)`, `var(--surface-2, rgba(127,127,127,0.05))`) and so render
      correctly today. Verified `pnpm build` (vite) still succeeds.
- [x] **Three more undefined-CSS-custom-property regressions (same bug class)** (2026-07-23) —
      follow-up visual pass after the nostr channel fix below, this time auditing every
      `var(--x)` in `ui/src` against tokens actually defined in `ui/src/styles/*.css`.
      Found `.cron-error` and `.cron-required-marker` in `ui/src/styles/components.css`
      (the cron form's validation-error text and required-field asterisk) both used
      `var(--danger-color)`, which is not a real token (`--danger` is) — no fallback, so
      both rendered invisible/default-color in both themes. Also
      `ui/src/ui/views/channels.nostr-profile-form.ts:280`'s "unsaved changes" notice used
      `var(--warning-color)`, and the design system has no `--warning` color token at all
      (only `--warning-subtle`, always used with a fallback). Fixed the cron selectors to
      use `--danger`, and gave the unsaved-changes notice an inline fallback
      (`var(--warning, #d97706)`) matching the amber tone used elsewhere for warning states
      (e.g. `chat.ts`'s context-usage banner). Verified `vite build` still succeeds.

- [x] **Nostr channel UI referenced undefined CSS custom properties** (2026-07-23) —
      visual pass over `ui/src/ui/views/channels.nostr.ts` and
      `channels.nostr-profile-form.ts`. Both files styled inputs, textareas, avatar
      previews, and section dividers with `var(--border-color)`, `var(--text-muted)`,
      `var(--danger-color)`, and `var(--bg-secondary)` — none of which are defined
      anywhere in `ui/src/styles/*.css` (the real tokens are `--border`, `--muted`,
      `--danger`, `--bg-elevated`). An unresolved custom property with no fallback
      makes the whole CSS property invalid, so these elements silently rendered with
      no border, default (black) text color, and no background in both light and dark
      themes — a regression invisible in code review since the var() _looks_ like a
      normal themed value. Replaced all 9 occurrences across both files with the
      actual design-system tokens. Verified `pnpm build` (vite) still succeeds.

- [x] **Two dynamic status banners missing `aria-live="polite"`** (2026-07-23) — visual/
      accessibility pass over `ui/src/ui/views/`. Every other `role="status"` region in
      `chat.ts` (compaction indicator, connection status, queue banner) and `cron.ts` pairs
      `role="status"` with `aria-live="polite"` so screen readers announce it without a focus
      change. Two were missing the pairing: the context-usage warning banner in
      `chat.ts:559` (fires purely from rising token usage, no user action) and the dream-diary
      save/error callout in `dreaming.ts:818`. Added `aria-live="polite"` to both. Verified
      `vite build` still succeeds.

- [x] **Contact-placeholder guard missed the `[Stockton phone]` spelling variant** (2026-07-23) —
      `src/agents/skills.cre-skills-frontmatter.test.ts`'s regression guard (added to permanently
      close the "env var used only as a prose placeholder → gateway reports skill ready → message
      goes out blank" bug class, hit 5 times per the entries below) only matched the literal
      `[phone]` placeholder. `underwriting-intake` and `market-update-content` spell it
      `[Stockton phone]` instead, so the guard's regex (`/\[phone\]/i`) never matched their bodies
      at all — both skills currently declare `STOCKTON_PHONE` correctly, so nothing is broken
      today, but the guard built specifically to prevent this class from recurring had a blind
      spot: a future edit dropping `STOCKTON_PHONE` from either skill would stay green. Widened
      the regex to `/\[(?:stockton )?phone\]/i` to match both spellings. Verified the guard now
      fails when `STOCKTON_PHONE` is stripped from `requires.env` (4 tests fail) and passes again
      once restored — proving the fix actually closes the gap rather than just adding a
      no-op case. Suite: 66 tests green (was 65).
- [x] **Config number-stepper input missing focus indicator** (2026-07-22) — follow-up
      visual/accessibility pass over `ui/src/styles/config.css`. `.cfg-number__input` (the
      numeric text field inside the increment/decrement stepper used for numeric config
      fields) set `outline: none` with no focus replacement, unlike every sibling `.cfg-*`
      input (`.cfg-input`, `.cfg-textarea`, `.cfg-select`) which all pair `outline: none`
      with a focus rule using `--focus-ring`. Because the input itself has `border: none`
      (only its container draws borders), there was zero visual indication of focus at all —
      mouse or keyboard. Added `.cfg-number:focus-within` on the container (border-color:
      var(--accent) + box-shadow: var(--focus-ring)), matching the pattern used by sibling
      inputs. Verified `vite build` still succeeds.
- [x] **Control UI keyboard focus indicators restored on skill toggle and command palette**
      (2026-07-22) — visual/accessibility pass over `ui/`. `.skill-toggle` (the on/off switch
      in the skills list) and `.cmd-palette__input` (the ⌘K search box) both set
      `outline: none` with no replacement, unlike every other interactive control in
      `components.css`, which pairs `outline: none` with a `:focus-visible` box-shadow using
      the `--focus-ring` token. Keyboard users tabbing to either control got no visible focus
      state. Added matching `:focus-visible` rules (`--focus-ring` for the toggle, an inset
      ring for the palette input). Verified `vite build` still succeeds. Surveyed the rest of
      `components.css`'s `outline: none` usages — the others already have a focus-visible
      replacement, so this closes out the gap.
- [x] **Weekly market update daylight-saving scheduling fix** (2026-07-22) — the Monday
      market update encoded 9:00 AM as `09:00:00-07:00`. Utah switches to `-06:00` during
      daylight saving time, so the workflow would send at 10:00 AM local for most of the year.
      The skill now requires conversion from `America/Denver` to ISO 8601 and explicitly covers
      both MST and MDT. Added a regression test that requires the IANA time zone and rejects a
      hard-coded 9:00 AM Mountain offset.

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
- [x] **Checked the reverse over-gating class, left as-is** (2026-07-18) — also audited whether any
      skill declares a genuinely _optional_ var as required (which would make the gateway report the skill
      "not ready" and refuse to run even when its core path works). `prospect-research` requires
      `APOLLO_API_KEY`, and Apollo is only an email-enrichment step (the skill still builds and logs the
      prospect list without it, per its own Error Handling). Deliberately NOT changed: this over-gating
      fails _loudly and safely_ (owner sees the missing key) — the opposite of the silent-failure class —
      and a prior session made the required/optional split on purpose (Apollo required, Hunter optional).
      Loosening it could instead let the skill silently ship emailless lists. Conservative call: leave it.
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

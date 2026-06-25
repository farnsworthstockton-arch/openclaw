AGENTS.md

<!-- CREWDECK-RULE -->
## 🧰 CrewDeck rule — route human work to the master hub

Going forward, **every human task or blocker for this project goes to CrewDeck**, the master hub
at https://crew.146-190-119-77.sslip.io. Add it as a `- [ ]` line under the
`## 🧑 Human / Blockers` section of this project's `TODO.md` (prefix hard blockers with ⛔). The
CrewDeck sync (`infra/crewdeck/sync`) picks it up automatically (~every 45 min) and shows it on this
project's board under the right tab and in the global ⛔ BLOCKERS view; approving it in CrewDeck ticks
the box back here. Don't leave human/blocker work only in chat or in your head — put it on the board so
Stockton and the assistants can see and action it.
<!-- /CREWDECK-RULE -->

# ELI5 — openclaw (Stockton's CRE fork)

## What this is

This is Stockton's own copy ("fork") of **OpenClaw**, an open-source **personal AI
assistant you run on your own devices**. Think of it as a friendly robot receptionist that
lives on a computer you control and talks to you through the chat apps you already use —
WhatsApp, Telegram, Slack, Discord, iMessage, and many more. It can also speak and listen,
and show a live "Canvas" (a screen it draws on). The core program is called the **Gateway**;
the actual product is the assistant that runs on top of it.

Stockton's version is the standard OpenClaw with a set of **commercial-real-estate (CRE)
skill modules** bolted on, so the assistant can do broker work, not just general chores.

## Why it exists

Stockton is a CRE broker who wants an always-on AI helper that handles real brokerage tasks
by chat/voice instead of him sitting at a dashboard. By forking OpenClaw (which already
solves the hard part — connecting one AI to dozens of messaging channels, voice, and a big
library of "skills") and adding his own CRE skills, he gets a private, single-user assistant
tuned for real estate: pulling listings, drafting outreach, researching prospects,
underwriting deals, and managing showings — all runnable on his own hardware so his data
stays with him.

## How it works

OpenClaw's power comes from **skills** — small plug-in modules that each teach the assistant
one job. The base project ships general skills (notes, reminders, GitHub, Slack, Spotify,
weather, PDF processing, transcription, etc.). Stockton's fork adds CRE-specific skills on
top. You install it with `openclaw onboard`, connect the channels you want, turn on the
skills you want, and then just message the assistant like a person.

The fork also sets the default AI model to Anthropic's Opus. It tracks the original open-
source project through a git "upstream" remote, so new OpenClaw features can be pulled in;
Stockton's own copy lives at `farnsworthstockton-arch/openclaw` (his own GitHub), which is
where his customizations are pushed — never back to the public project.

### CRE skills added in this fork (Stockton can tick these off after trying each)

- [ ] `crexi-sync` — sync listings with Crexi
- [ ] `realnex-crm-commands` — drive the RealNex CRM by command
- [ ] `prospect-research` — research prospects
- [ ] `cold-outreach` — draft cold outreach
- [ ] `property-analysis` — analyze a property
- [ ] `underwriting-intake` — take in deal-underwriting details
- [ ] `listing-marketing-plan` — build a marketing plan for a listing
- [ ] `just-listed-announcement` — generate "just listed" announcements
- [ ] `market-update-content` — generate market-update content
- [ ] `showing-management` — manage property showings
- [ ] `signback-tracker` — track sign-backs
- [ ] `content-repurposing` — turn one piece of content (video, notes, voice memo) into posts for every platform
- [ ] `pdf-document-processing` — read and file deal PDFs (feeds the sign-back tracker)

## Current status

- **Working fork, actively maintained.** It stays in sync with the upstream OpenClaw project
  and has the CRE skills added and committed to Stockton's own repo.
- **Not yet running always-on.** The main open decisions are all Stockton's, not coding
  tasks:
  - **Decide which machine runs the customized gateway always-on** (the one he actually uses
    it from). Until then it's not a live, always-available assistant.
  - **Approve a recurring routine** that pulls upstream OpenClaw and re-applies the CRE
    customizations so the fork doesn't drift out of date.
- **Config note:** there is a `.env.example` template at the repo root but no real `.env`
  yet — that's normal, since the gateway is configured per-machine as part of deciding where
  to run it. The template now lists every setting the CRE skills need (RealNex keys, your own
  phone/email, your office mailing address for email footers, n8n webhook URLs, Apollo, Google
  Calendar, a folder for filing deal PDFs) with plain-English notes on where to get each — so
  when you set up the machine, copy `.env.example` to `.env` and fill in the ones for the
  skills you turn on.
- **Scheduling note:** the Monday market update now uses Utah's `America/Denver` clock, so its
  9:00 AM delivery stays at 9:00 AM through both winter and daylight saving time.
- **Reliability fix (2026-07-30):** fixed a bug where some outgoing messages (like transcript
  echoes and gateway event notifications) could silently vanish if the send failed — they now
  correctly get queued for retry instead of being marked "delivered" when they actually weren't.

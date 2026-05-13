---
name: content-repurposing
description: Transform source content (video transcript, podcast notes, property tour, market update) into 6 platform-specific formats: LinkedIn, Facebook, Instagram, X, email newsletter, and CapCut video script.
homepage: https://www.realnex.com
metadata:
  {
    "openclaw":
      {
        "emoji": "♻️",
        "requires": { "env": ["N8N_WEBHOOK_SOCIAL_QUEUE"] },
        "primaryEnv": "N8N_WEBHOOK_SOCIAL_QUEUE",
      },
  }
---

# Content Repurposing

One piece of source content becomes six distribution-ready formats, all queued for publishing.

## Purpose

Stockton creates a piece of content (records a video, takes notes from a market tour, sends a voice memo). This skill transforms it into platform-optimized posts for every channel he uses, then queues them all. One input, maximum reach.

## Trigger

- Telegram: "Repurpose this content: [paste text or transcript]"
- Telegram: File upload (transcript, notes doc)
- n8n: scheduled weekly after market-update-content skill fires

## Inputs Required

- Source content (one of the following):
  - Video/podcast transcript (text)
  - Podcast notes or outline
  - Property tour notes or description
  - Market update writeup
  - Voice memo transcript (processed by openai-whisper skill)
- Content type label (optional but helpful): "market update", "property tour", "investment tip", "deal story"
- Target publish date/time (optional, defaults to next business day morning)

## Steps

1. **Read and analyze the source content**:
   - Identify the core insight or hook (what is the single most interesting/useful thing here?)
   - Identify supporting facts, metrics, or stories
   - Identify the audience angle (investor? local business owner? general public?)

2. **Write the LINKEDIN POST** (professional, CRE investor audience, 150-300 words):
   - Open with a hook that speaks to investors (a number, a contrarian take, a market observation)
   - 3-5 short paragraphs — each should stand alone as a point
   - End with a call-to-action or reflective question
   - Tone: authoritative but approachable. Stockton = market expert, not salesperson.
   - No hashtags in body. 2-3 in first comment if needed.

3. **Write the FACEBOOK POST** (conversational, Utah local business owner and investor audience):
   - Lead with a relatable local observation ("If you've been watching the Utah County industrial market lately...")
   - More personal tone than LinkedIn — share a perspective or story
   - End with a question to drive comments
   - 80-150 words
   - Include listing link if content is property-specific

4. **Write the INSTAGRAM CAPTION** (visual-first format, 80-150 words + hashtag set):
   - First line is the hook — must work without seeing the photo
   - Use line breaks for visual breathing room
   - Key metrics in a clean list format if applicable
   - End with a simple CTA ("Link in bio for full details")
   - Hashtag set (5-10): mix specific Utah CRE tags + broader investing tags
     - Specific: `#UtahCRE #SaltLakeRealEstate #UtahCountyCRE #UtahIndustrial #CommercialUtah`
     - Broad: `#CommercialRealEstate #CREInvesting #RealEstateInvestor #CRE`

5. **Write the X/TWITTER POST** (punchy, under 280 characters):
   - Lead with the sharpest single insight from the content
   - No filler. Every word earns its place.
   - Format options: bold claim + proof, question + answer, counterintuitive take

6. **Write the EMAIL NEWSLETTER SECTION** (2-3 paragraphs, investment-focused angle):
   - This is a section for Stockton's regular investor email, not a standalone blast
   - Paragraph 1: The insight or market observation
   - Paragraph 2: Why it matters to investors right now
   - Paragraph 3 (optional): What Stockton is seeing in his deals that confirms this
   - Keep it under 300 words. No fluff.

7. **Write the SHORT-FORM VIDEO SCRIPT** (CapCut format, 60-90 seconds):
   ```
   HOOK (0-3 sec): [One punchy sentence — the thing that makes you stop scrolling]

   POINT 1 (3-20 sec): [First key point — keep it to one sentence, then expand one line]
   POINT 2 (20-40 sec): [Second key point — same format]
   POINT 3 (40-60 sec): [Third key point or metric]

   CTA (60-90 sec): [Call to action — "Follow for more Utah CRE intel" or "Link in bio for the full breakdown"]
   ```
   Format as bullet points for ad-lib delivery. Stockton improvises from the outline.

8. **Queue all content** into the n8n social posting schedule:
   ```bash
   curl -X POST "$N8N_WEBHOOK_SOCIAL_QUEUE" \
     -H "Content-Type: application/json" \
     -d '{
       "source_type": "repurposed",
       "linkedin": "...",
       "facebook": "...",
       "instagram": { "caption": "...", "hashtags": "..." },
       "twitter": "...",
       "email_section": "...",
       "video_script": "...",
       "scheduled_send": "[publish_date_iso]"
     }'
   ```

9. **Confirm to Stockton** via Telegram with the X post and LinkedIn opening line as a preview.

## Output

- LinkedIn post (150-300 words)
- Facebook post (80-150 words)
- Instagram caption + 5-10 hashtags
- X/Twitter post (<280 chars)
- Email newsletter section (2-3 paragraphs)
- CapCut video script (60-90 sec, bullet format)
- All queued in n8n social schedule

## Definition of Done

All 6 content pieces written. Queued in n8n. Telegram preview sent to Stockton.

## Error Handling

- Source content is too short or vague → Ask: "This is pretty brief — can you add more context? Or tell me what the main point should be and I'll work from that."
- n8n queue failure → Deliver all content directly in Telegram and flag: "Social queue failed. Here's all the content — copy/paste to your scheduler."

## Utah/Stockton RE Notes

- Voice memos should be transcribed first using the openai-whisper skill, then passed here
- Stockton's content angle: Utah CRE market expert, commercial broker serving investors and business owners
- Primary audiences: active Utah CRE investors (LinkedIn/Email), local Utah business owners (Facebook), visual real estate audience (Instagram), broader CRE community (X)
- Avoid political commentary, personal opinions on non-RE topics, and promotional language that sounds pushy

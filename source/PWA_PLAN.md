# RPwD Easy Read — Web App Plan

> Status: BUILT AND LIVE at https://rpwd-easy-read.github.io/. v1 shipped 16 April 2026; accessibility evidence pass and public launch 12 July 2026; v2 teach-first redesign (5-band palette, Map ladder, Training Resources, Using the Act) shipped live 12 July 2026 per the design handoff in design-review\ and tower decision D-P49. Remaining: the v2 second pass (illustration regeneration, decks and handouts), owner-run human checks (NVDA, TalkBack, phone install, offline). This document is the original plan, kept for history; current status lives in the tower card and the git log.
> Drafted: 16 April 2026, after Deepa asked whether a simple app version was feasible alongside the PPTX/PDF booklet.

---

## 1. The goal in one sentence

Make the same content as the RPwD Easy Read booklet — all 102 sections of the Act, plain language, friendly cartoon illustrations, official Section anchors — available as a free, accessible, offline-capable web app that works on any phone, including cheap Android devices, with no app-store gatekeeping.

## 2. Who it is for

- **Primary:** persons with intellectual and learning disabilities in India who want to know their legal rights and cite the right Section number when they raise a complaint
- **Secondary:** support workers, family members, DPO staff, disability rights advocates, and trainers who use Easy Read material with the people they support
- **Tertiary:** practitioners building Easy Read versions of *other* complex documents — they should be able to look at this app as a working model

## 3. Form factor — why a PWA, not a native app

**Recommendation: Progressive Web App (PWA), hosted as a static site.**

| Form factor | Pros | Cons | Verdict |
|---|---|---|---|
| **PWA / static site** | One codebase, no app-store, installs to home screen, offline-capable, works on any phone, screen reader friendly by default, free hosting (GitHub Pages), minutes to update | Less discoverability than app stores | **YES — start here** |
| Native Android | Best device integration, Play Store discoverability | Per-platform code, store review, harder to update, harder for screen readers if not done well | Defer — PWA covers 95% of needs |
| Native iOS | Same as Android | Same, plus higher cost (Mac, Apple Developer fee) | Defer |
| WhatsApp bot | Massive India install base, no install friction | Conversational UI is wrong for a reference document, hard to make Easy Read | Skip — wrong shape |
| Telegram bot | Lower friction than native | Same as WhatsApp + smaller India base | Skip |
| Standalone PDF download | Already exists (the booklet) | Not searchable, not interactive, not offline-installable as an "app" | Keep as a complement, not as the app |

The PWA is the sweet spot: installable, offline, accessible, free to host, fast to iterate, and reuses every piece of content we already have.

## 4. Best practices to learn from (concrete takeaways)

### Council for Intellectual Disability NSW — `cid.org.au`
The closest existing model anywhere. An Australian Easy Read web library for NDIS, voting, healthcare, COVID, etc.
**Steal these patterns:**
- One topic per page, with a "What this page is about" summary at the top
- Big illustrations (not stock photos) directly above the matching paragraph
- Optional audio playback on every page (browser TTS is enough for v1)
- Persistent breadcrumb so you always know where you are
- "Easy Read" badge on every page, visible at all times

### Inclusion Europe — `inclusion-europe.eu/easy-to-read`
The European Easy-to-Read format **standard**. Twelve guidelines we should treat as hard rules:
- One idea per sentence, max ~15 words
- One important idea per page
- A picture for every important idea
- Sans-serif, minimum 14 pt body text
- Never put text on a background pattern or photo
- Always give the title in plain words alongside any technical title (this is exactly what we already do with "Section 3 — Equality and non-discrimination" + plain caption)
- Use bullet points, not flowing paragraphs, when listing
- Glossary at the back for hard words

### CHANGE — `changepeople.org`
UK pioneer of **co-produced** Easy Read. Their core insight is that Easy Read materials should be designed *with* people with learning disabilities, not just *for* them.
**Apply this:** before launching v1, test the app with at least 3–5 ID readers (Vidyasagar can help recruit). Don't ship blind. Their picture bank `Photosymbols` is the de facto standard image library for UK Easy Read; we are doing our own equivalent with the comic-strip illustrations.

### Mencap Easy Read — `mencap.org.uk/advice-and-support/easy-read`
UK Easy Read versions of NHS, council, and benefits documents. **Steal these:**
- A picture-icon-led table of contents (we already have a Map of your rights — easy to translate to web)
- A glossary at the back of every document
- Print-friendly version of every page

### EasyHub — `easy-to-read.eu`
Inclusion Europe's distributed library of Easy Read documents across many EU languages. **Distribution lesson:** make it easy for other DPOs and accessibility organisations to *embed* or *link* to specific section pages, not just the homepage. Each section needs its own stable URL.

### Self Advocacy Online — `selfadvocacyonline.org` (US)
Model for online learning for adults with intellectual disability. Use as a reference for navigation/UX patterns aimed at ID readers — short menus, picture buttons, large hit targets.

### India-specific context to draw on
- **DEPwD India** (`depwd.gov.in`) — official source for State Commissioner contact details, schemes, and rules. The app should link out to this for live information that changes.
- **Vidyasagar** (`vidyasagar.co.in`) — partner, possible co-design venue and user-testing recruitment.
- **NCPEDP**, **Sense International India**, **NCEDL** — distribution partners and possible reviewers.

## 5. MVP scope — read-only reference (v1)

Ship a v1 that does only this, and nothing more:

- Home page: title, illustration, two big buttons → "Find a section" / "Map of all rights"
- Map page: list of 17 chapters, each in its chapter colour, click → chapter page
- Chapter page: list of sections in that chapter with a one-line plain caption per section, click → section page
- **Section page** (the heart of the app): chapter colour band · section number badge · official section title (the legal anchor) · big illustration · plain language caption · "Use this when…" card · prev/next section buttons
- Search: text box at the top of every page, searches across plain captions and use-when text. Returns a list of matching section pages.
- About this guide page (mirrors the PPTX About slide)
- How to file a complaint page (mirrors the PPTX backmatter slide)
- Who can help you page (with State Commissioner contact link out to DEPwD India)
- Glossary page: hard legal words explained simply
- **Browser TTS playback button** on every section page ("Read this page out loud") — uses the SpeechSynthesis Web API, no server, no API keys
- **Installable to home screen** (PWA manifest + icon)
- **Offline support** (Service Worker caches all content + illustrations on first load)

That is the entire MVP. Anything else is v2.

## 6. Future features (v2 and beyond — explicit scope gates)

Each of these is a separate decision after v1 is in users' hands. Don't bundle.

| Feature | Value | Cost | Decision gate |
|---|---|---|---|
| **Multi-language** (Hindi, Tamil, Bengali, Marathi, Telugu, Kannada, Malayalam, Gujarati, Punjabi, Urdu) | High — most ID readers in India read in their mother tongue | High — translation must be done by Easy-Read trained translators per language, not machine | Only after v1 has confirmed reader interest. Do one language at a time. Hindi first. |
| **Complaint-letter generator** — pick a section, fill a short form, print/export a draft complaint letter to your State Commissioner | Very high — turns the app from a reference into a tool | Medium — needs templates per section type, careful disclaimer, possibly per-state addresses | After v1, when we know what kinds of complaints people actually want to file |
| **Find your State Commissioner** — pick your state from a list, see the address, phone, email | High | Low — just a static lookup table | Could be in v1 if data is available; defer if not |
| **Real audio narration** (human voice, recorded) instead of browser TTS | Medium — better quality than TTS, especially in regional languages | Medium — needs a recorded audio file per section per language | After v1 + after multi-language. Pair recording with translation. |
| **Video Easy Read** — short signed/captioned videos per chapter | Medium-high for Deaf-blind and ISL users | High — production cost | Long-term. Partner with an ISL organisation. |
| **Bookmarks / favourites** — save sections to a personal list | Low-medium | Low | Add when users ask for it |
| **Quiz / "do you know your rights?" mode** | Medium — engagement, learning | Medium | After v1, only if user testing shows demand |
| **Dark mode / high-contrast mode** | Medium for low-vision overlap users | Low | Probably v1.1 |
| **Larger text toggle** | High for low-vision overlap users | Very low (CSS variable) | Include in v1 |
| **Print-friendly stylesheet** so any page prints as a clean A4 handout | Medium | Low | Include in v1 |

## 7. Content reuse — what we already have

This is the big advantage. Almost every piece of content the PWA needs already exists in this project:

| Asset | Where | How to reuse |
|---|---|---|
| 102 official section titles | `_build/section_titles.json` | Read directly |
| 102 plain-language captions | `SECTIONS` list in `_build/build_rpwd_easy_read.py` | Extract to a JSON content file |
| 102 "Use this when…" examples | Same | Same |
| Section → illustration mapping | Same (`il=` field) | Same |
| 32 cartoon PNG illustrations | `assets/illustrations/` | Copy directly into the web app's image folder |
| 17 chapter palettes | `CHAPTER_COLOR` dict in the builder | Translate to CSS custom properties |
| Vidyasagar logo | `assets/vidyasagar_logo.png` | Use directly |
| Map of chapters with section ranges | `s_map()` in the builder | Translate to HTML |
| How to file a complaint, Who can help you, Your rights in one page | The respective slide builders | Translate to HTML pages |
| Speaker notes (extra plain-language explanation per slide) | `notes()` calls in the builder | Optional: surface as "more about this section" expandable paragraph |

**Single source of truth recommendation:** build a small Python script in `_build/` that exports a `content.json` from the same `SECTIONS` data the PPTX builder uses. The web app reads `content.json`. When we update a caption, we update one place and both the PPTX and the web app pick it up after a rebuild.

## 8. Tech stack

Following the EquitableDocs project convention (project guide, section 6.1: "Semantic HTML5 + minimal CSS + vanilla JS. No React. No Next.js. No frameworks."):

- **HTML5 + CSS3 + vanilla JS** — no framework, no build pipeline, no npm install
- **Single content JSON** generated by a Python export script in `_build/`
- **Service Worker** for offline caching (~200 lines of plain JS)
- **Web App Manifest** for the install-to-home-screen behaviour
- **CSS custom properties** for the 17 chapter colours so each section page tints itself with one variable
- **SpeechSynthesis Web API** for the "read out loud" button — built into every modern browser, no server, no API key
- **Hosting:** GitHub Pages on `equitabledocs.github.io` or a new repo `rpwd-easy-read.github.io`. Free. Already part of Deepa's GitHub setup.
- **Custom domain** (optional): `rpwd.equitabledocs.org` or similar, pointed at GitHub Pages.

## 9. Accessibility baseline (non-negotiable)

This is the test the app must pass before going public. Same rules as the EquitableDocs project guide.

**WCAG 2.1 AA, plus COGA principles:**
- Semantic HTML — `<main>`, `<nav>`, `<article>`, `<h1>`–`<h3>`, never `<div>` soup
- Visible focus indicators (`:focus-visible`) on every interactive element
- Skip-to-content link at the top of every page
- All illustrations have meaningful `alt` text — not "image of equality" but "Two people standing side by side, one in a wheelchair, with an equals sign between them"
- Colour contrast ≥ 4.5:1 for normal text, ≥ 3:1 for large text — the 17 chapter colours are already chosen to be dark enough for white text but verify on each page
- Never colour alone — every chapter chip has its label, not just its colour
- Min body text 18 pt (1.125 rem), `rem` units throughout, never fixed `px`
- Tested with NVDA and TalkBack at minimum, ideally JAWS and VoiceOver too
- Fully keyboard navigable, in logical reading order
- Plain language, Grade 6–8 reading level, sentences ≤ 15 words

## 10. Open questions to decide before building

These need answers before sprint 1.

1. **Domain.** New repo or part of `equitabledocs.github.io`? Custom subdomain? My recommendation: new repo `rpwd-easy-read.github.io` so it can be co-branded with Vidyasagar later if they want.
2. **Co-branding.** Is this an EquitableDocs product, a Vidyasagar product, or jointly branded? Affects logo placement and colour weighting on the homepage.
3. **State Commissioner contact data.** Do we have a reliable list of all state commissioners' addresses/emails, and are we willing to maintain it? If yes, "Find your State Commissioner" goes into v1. If no, defer to v2.
4. **User testing recruitment.** Can Vidyasagar host a 2-hour session with 4–6 ID readers + their support workers to test a v1 prototype before public launch?
5. **Disclaimer language.** "Not legal advice" disclaimer wording — should it be reviewed by a lawyer before going public?
6. **Update cadence.** Who maintains the content over time? If the Act is amended, who notices and updates the JSON?
7. **Analytics.** Privacy-respecting (e.g. Plausible) or none at all? My recommendation: none in v1, add Plausible later only if we need to make a case to funders.
8. **Multi-language priority.** Hindi clearly first. After Hindi, which? Probably Tamil (Vidyasagar's home state) or whichever language has the largest ID-reader population we have a contact for.

## 11. Suggested first sprint (estimate: ~1 week of focused build time)

**Sprint goal:** a working v1 PWA with all 102 sections, deployed to GitHub Pages, ready to put in front of test users.

1. **Day 1 — content extraction.** Write `_build/export_content.py` that reads the `SECTIONS` data from `build_rpwd_easy_read.py` and writes `web/content.json`. Verify all 102 sections present.
2. **Day 1 — copy assets.** Copy `assets/illustrations/*.png` and `assets/vidyasagar_logo.png` into `web/img/`.
3. **Day 2 — HTML skeleton.** Build the page templates: home, map, chapter, section, about, how-to-file-complaint, who-can-help, glossary. Plain semantic HTML5, no JS yet.
4. **Day 2 — CSS.** Style with the Vidyasagar palette + 17 chapter custom properties. Verdana fallback stack. Mobile-first responsive layout. Print stylesheet.
5. **Day 3 — JS routing & search.** A small router (`location.hash` based) that loads section content from `content.json` into the section template. Search box that filters across plain captions.
6. **Day 3 — TTS button.** SpeechSynthesis Web API, ~30 lines.
7. **Day 4 — PWA manifest + Service Worker.** Cache all content + illustrations on first load. Installable.
8. **Day 4 — accessibility audit.** axe DevTools, NVDA, TalkBack, keyboard-only run-through. Fix.
9. **Day 5 — content polish.** Glossary entries, alt text for all illustrations, "Find your State Commissioner" lookup if data is ready.
10. **Day 5 — deploy.** Push to a new GitHub repo, enable GitHub Pages, point a domain if decided.
11. **Day 6 — internal review.** Walk Deepa through every page, fix anything that looks wrong.
12. **Day 7 — buffer / unblock testing logistics.** Coordinate with Vidyasagar for the user-testing session.

**Definition of done for v1:**
- All 102 sections accessible via direct URL
- Search works
- Offline works (turn off WiFi after first load, app still works)
- Installs to home screen on Android
- TTS reads any section out loud
- Passes axe DevTools with zero violations
- Tested with NVDA on Windows and TalkBack on Android
- Lighthouse PWA score 100, Accessibility score 100

## 12. What we are explicitly NOT building in v1

- Multi-language. English only.
- Complaint-letter generator.
- Any account / login / profile.
- Any analytics or tracking.
- Any backend server. The whole app is static.
- Any AI features. No chatbot, no LLM, no "ask the Act a question" — that is a separate scope decision and adds liability.
- Native mobile app.
- Any feature that requires content that changes frequently (the Act is stable; State Commissioner addresses are the only thing that drifts, and those can be a static lookup updated yearly).

---

## When we resume

Read this file first. Then decide on the **open questions in section 10**. Then start with section 11, day 1. The whole content pipeline already exists in this project — sprint 1 is mostly translating the PPTX assets into HTML/CSS, not creating new content.

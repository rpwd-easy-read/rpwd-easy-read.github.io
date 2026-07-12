# Leak audit: internal instructions and process reveals on the public site

**Date:** 2026-07-13
**Scope:** everything a member of the public can see or download.
**Auditor stance:** flag only, do not rewrite; propose a rewrite per
finding and hand to Deepa. CBM and funders will read this site closely.
**Verdict:** not a clean sweep. Two known leaks are still live, four
adjacent live leaks were found in the same training module, one hidden
segment ships in the downloadable JSON, and the raw markdown source in
the repo carries a full author-facing sign-off block, an implementation
notes section, and DRAFT status headers.

## Method

1. Read every shipped file the service worker precaches (per `sw.js`
   line 8 to 23): `index.html`, `css/main.css`, `js/app.js`,
   `content.json`, `manifest.webmanifest`, `content/training/ch-02.json`,
   the two illustration webps named in the shell, plus all illustration
   webps derived from `content.json` at install time.
2. Ran a case-insensitive pattern grep across all `.html`, `.css`,
   `.js`, `.json`, `.webmanifest` files in the repo root and
   `content/`. Pattern list below.
3. Read the two known-leak passages verbatim to check whether they had
   been reworded since 2026-07-13.
4. Read every unique rendered UI string in `js/app.js` (all `render*`
   template literals) and every slide body in `content/training/ch-02.json`
   for spec, builder, or process voice that no keyword hit.
5. Read the raw markdown at
   `content/training/ch-02-rights-and-entitlements.md` in full,
   because the repo is public on GitHub (`rpwd-easy-read/rpwd-easy-read.github.io`)
   and the file is visible in the repo browser and via raw.githubusercontent.
6. Read `README.md` because GitHub renders it as the repo landing page.

## Pattern list used

`localStorage`, `sessionStorage`, `precache`, `service worker`,
`renderer`, `build script`, `viewport`, `breakpoint`, `media query`,
`axe`, `Lighthouse`, `COGA`, `WCAG` (outside About legitimate uses),
`sign-off`, `signed off`, `DRAFT`, `awaiting review`, `paper review`,
`staff note`, `alt-form note`, `implementation note`, `trainer note`
(judge each: some pedagogy is legitimate), `D-P<digits>`, `tower`,
`CLAUDE`, `Claude`, `AI-generated`, `prompt`, `session`, `commit`,
`git`, `repo`, `deploy`, `GitHub Pages`, `TODO`, `FIXME`, `placeholder`,
`lorem`, `Deepa` (outside About credits and copyright), `decision <n>`,
`per D-`, `spec`, `pipeline`.

Then a judgement pass no grep can do: read each unique UI string and
slide body asking, "is this speaking TO the reader, or ABOUT the
system?" Spec, builder, and process voice count as leaks even with no
keyword hit.

## Per-surface results

### `index.html`, `manifest.webmanifest`, `css/main.css` (rendered surfaces)

Clean at the rendered level. Only hits are:
- `index.html:5`: legitimate `viewport` meta.
- `index.html:50`: legitimate copyright line naming Deepa.
- `css/main.css` code comments carry D-P references and mention Deepa,
  see P3 below.

### `js/app.js` (rendered strings)

Clean at the visible-string level except for one mild builder voice
string, and the About page working as designed:
- Line 528, 568: About page names Deepa (legitimate credits).
- Line 861: mark-complete note in the training player, mild leak, see
  finding L07.
- Line 917: "Complete on this device" pill, legitimate expectation
  setting.
- Line 1013: SR announcement "Module marked complete on this device",
  legitimate.

Code comments in `js/app.js` carry many D-P references, Deepa notes,
and a `docs\LMS-PLAYER-SPEC.md` reference. Handled as P3 (code
comments in scope only as P3 per audit brief).

### `content.json` (main data file, browser-downloadable)

Clean against the pattern list once false positives on `committee`,
`committed`, `reports` were discarded. No spec, builder, or process
voice. The 102 sections read as content, not as authoring notes.

### `content/training/ch-02.json` (downloadable training data)

Multiple leaks, four rendered, one hidden but downloadable. See
findings L01 to L05 and L07.

### `content/training/ch-02-rights-and-entitlements.md` (raw markdown source)

Repo is public. The file is visible in the GitHub repo browser at
`github.com/rpwd-easy-read/rpwd-easy-read.github.io/blob/main/content/training/ch-02-rights-and-entitlements.md`,
and served raw over `raw.githubusercontent.com`. It also lands under
the Pages domain path unless the site config excludes it. The whole
file reads in author voice: DRAFT status header, register meta, an
"Implementation notes for the app renderer" section, a sign-off block
naming Deepa and internal decisions D-P50a. See finding L06.

### `README.md` (rendered by GitHub on the repo landing page)

Two mild reveals worth Deepa's judgement. See finding L08.

## Findings

Priority scale:
- **P1**: rendered on the live site, a member of the public sees it
  without View Source.
- **P2**: downloadable or discoverable (raw JSON, raw markdown, hidden
  slide inside a shipped JSON), one View Source or repo browse away.
- **P3**: code comment or mild register bleed, no public voice cost
  unless someone opens dev tools.

### P1: rendered, public sees this today

#### L01. Segment 7 slide 2, "Alt-form note for the app" (KNOWN, NOT FIXED)

**File / route:** `content/training/ch-02.json` line 119 and line 122;
rendered at `#/training/ch-02/7/2`.

**Current text:**
> *Alt-form note for the app:* the online version renders this table
> with band-tint row backgrounds so a screen-reader user hears
> "Section 13, Autonomy family" as row context, and a low-vision user
> can scan by colour and Section number together. Colour is never the
> only signal.

**Why it reads as internal:** builder voice ("the online version
renders this table with", "colour is never the only signal") aimed at
another author or reviewer, not the trainer sitting with the picking
table.

**Proposed rewrite:**
> The table above is colour-coded by family so you can scan by
> Section number and colour together. If you are using a screen
> reader, the family is announced as row context (Section 13, Autonomy
> family). Colour alone is never the only cue on the picking table.

#### L02. Segment 14 slide 1, "The tick is stored in localStorage..." (KNOWN, NOT FIXED)

**File / route:** `content/training/ch-02.json` line 230 and line 233;
rendered at `#/training/ch-02/14`.

**Current text:**
> When the learner reaches this point in the app, they can tick "I
> have finished this module." The tick is stored in `localStorage`
> under a per-module key. Clearing browser storage clears the tick
> and only the tick. No account, no email, no server call.

**Why it reads as internal:** spec voice throughout. "When the
learner reaches this point in the app" is a stage direction to the
implementer, not a message to the trainer. `localStorage`,
"per-module key", "no server call" are implementation vocabulary.

**Proposed rewrite:**
> You have finished the module. Press the button below to mark it
> complete. Your tick is saved on this device only. No account, no
> email, no server. Clearing your browser data clears the tick.

#### L03. Segment 14 slide 1, "Trainer note: mark-complete is a personal marker..."

**File / route:** `content/training/ch-02.json` line 230 (second
paragraph of the same slide) and line 233.

**Current text:**
> Trainer note: mark-complete is a personal marker for the trainer's
> own use. It helps them see, at the top of the Training Resources
> page, which of the 17 chapters they have already worked through.

**Why it reads as internal:** the "Trainer note:" register break and
the third-person "the trainer's own use" both speak about the trainer
rather than to them. The 17-chapters roadmap belongs behind the
scenes.

**Proposed rewrite:**
> The tick is only for you. It helps you see, at the top of Training
> Resources, which chapters you have already worked through.

#### L04. `takeaway_html`, "this is the handout the app renders as a PDF"

**File / route:** `content/training/ch-02.json` line 238; rendered as
the take-away kit above the mark-complete button on segment 14.

**Current text:**
> **One-page summary for printing** (this is the handout the app
> renders as a PDF; the deck is generated from the same source).

**Why it reads as internal:** the parenthetical is pure builder voice
explaining the render pipeline to a reader who does not need to know
it exists.

**Proposed rewrite:**
> **One-page summary for printing.**

(Drop the parenthetical altogether; the bullets that follow are the
handout.)

#### L05. Segment 13 slide 1, "Endnotes are at the bottom of this file..."

**File / route:** `content/training/ch-02.json` line 217 and 220;
rendered at `#/training/ch-02/13`.

**Current text:**
> Endnotes are at the bottom of this file. Every claim from outside
> the Act sits behind a numbered endnote. If a source cannot be
> verified and dated, cut it. Do not cite from memory.

**Why it reads as internal:** "this file" is the author's phrase for
the markdown source, not a phrase a learner or trainer would use
about the slide they are looking at. "Cut it" is editorial imperative
aimed at whoever is writing citations, not at the trainer reading
them.

**Proposed rewrite:**
> The endnotes are below the further reading list. Every claim in
> this module that comes from outside the Act carries a numbered
> endnote. When you pick your own further reading for a case, drop
> any source you cannot verify and date, and do not cite from memory.

### P2: downloadable or discoverable, one View Source or repo browse away

#### L06. Raw markdown source `ch-02-rights-and-entitlements.md`

**File:** `content/training/ch-02-rights-and-entitlements.md` in the
repo `rpwd-easy-read/rpwd-easy-read.github.io`. Visible in the GitHub
repo browser (rendered), on raw.githubusercontent.com (plain text),
and, unless Jekyll strips it, at
`rpwd-easy-read.github.io/content/training/ch-02-rights-and-entitlements.md`.
The repo is public.

The file carries seven distinct author-voice bleeds. Listing them
together because they are one artefact: whatever Deepa decides for
the file, decides for all seven.

- **Line 9**: register meta line (`plain professional Indian English
  for trainer notes; Easy Read for the fragments a learner sees on
  screen`).
- **Line 10**: sign-off status line (`Sign-off status: **DRAFT,
  awaiting Deepa's paper review**. Nothing renders in the app until
  she signs off.`). This is the loudest single reveal in the whole
  audit: it names Deepa, the DRAFT state, the paper-review workflow,
  and the gating rule, all above the fold to any GitHub visitor.
- **Line 171**: the same alt-form note as L01.
- **Line 273 to 277**: segment 12 hidden meta (`Only shown in the
  app when learners have opted into the trainer network. Held for
  v2.2 in this pilot.` and `Reason for holding: the trainer network
  channel goes live later. Once it does, this segment lights up.`).
- **Line 290**: same "cut it. Do not cite from memory" line as L05.
- **Line 296 to 298**: same segment 14 leak as L02 and L03.
- **Line 304**: same takeaway builder voice as L04.
- **Lines 315 to 326**: an entire section headed
  **`## Implementation notes for the app renderer`**. Enumerates
  route paths, `aria-current="step"` behaviour, band tokens, hidden
  segment guard (`data-segment-live="false"`), the `localStorage`
  key, the D-P50a decision that the deck and handout are generated
  from this markdown by a small build script, and Deepa's sign-off
  gate on the source.
- **Lines 342 to 346**: an entire
  **`## Sign-off block`** section:
  - `**Draft complete:** 2026-07-12. Pilot module for Ch II, per
    Deepa's four session-start answers: pilot chapter Ch II, full
    14 segments, mark-complete stored in localStorage, per-chapter
    deck and handout generated from this markdown source.`
  - `**Voice check:** no em dashes, no en dashes, no rhetorical
    antithesis, no banned vocabulary in this draft. Run the
    antithesis-check skill before Deepa's review to confirm.`
  - `**Citations check:** every operative claim about the Act
    cites a Section number inline. Four endnotes for the
    outside-the-Act references.`

**Why it reads as internal:** these are author-facing artefacts
verbatim: DRAFT status, house voice rules (antithesis-check skill,
em-dash ban), the D-P50a build decision, and internal render
mechanics that no reader of the module needs.

**Proposed rewrites:** two choices for Deepa.

Option A (small edit, keeps source in repo): strip the sign-off
block, implementation notes section, register meta line, sign-off
status line, and the two builder-voice paragraphs in segments 12 and
14 from the markdown source; move that content to a private
`AUTHORING-NOTES.md` in a gitignored folder or under the tower
program repo. Result: the .md still lives here but reads as
learner-facing content only.

Option B (larger, cleaner): move the entire markdown source
`content/training/ch-02-rights-and-entitlements.md` out of the repo
and into the source content pipeline in
`equitabledocs-program\training-source\`. The JSON in
`content/training/ch-02.json` is what the app fetches. Keeping the
markdown in the same repo has no runtime purpose and this audit is
the reason to stop.

Recommend B: source-of-truth belongs behind the sign-off gate, not
in the deployed static site's own repo.

#### L07. Segment 12 hidden slide body

**File / route:** `content/training/ch-02.json` line 204 and 207.
Segment is `"hidden": true` (line 208), so `app.js` `flattenSlides()`
line 757 skips it and it does not render. But the JSON is precached
and downloadable at `[site]/content/training/ch-02.json`, one fetch
from any browser.

**Current text:**
> *Only shown in the app when learners have opted into the trainer
> network. Held for v2.2 in this pilot.*
> **In one sentence:** which Chapter II Section do most of your
> clients not know they have? Post one sentence. Read three others
> before you leave.
> Reason for holding: the trainer network channel goes live later.
> Once it does, this segment lights up.

**Why it reads as internal:** the meta lines around the segment body
are pure roadmap voice. "Held for v2.2", "trainer network channel
goes live later", "this segment lights up" belong in a project log,
not in the shipped JSON.

**Proposed rewrite:** strip the two meta paragraphs (the italic line
at the top and the "Reason for holding" line at the bottom). Keep
just the segment body ("In one sentence:..."). The `hidden: true`
flag already keeps it off the rendered site; removing the meta lines
means anyone who does open the JSON sees only pedagogical content
matched to the segment title.

### P3: code comments and mild register bleeds

Per the audit brief, "pure code comments are in scope only as P3
notes." Listing for completeness.

- **P3a. `js/app.js` D-P and Deepa references in comments**: lines
  13, 89, 111, 438, 464, 810 to 811, 897, 1047, 1064 all reference
  the tower (D-P49), specific decisions (D-P51 decision 1, 4, 6;
  D-P52 decision 1), Deepa's dated decisions, and
  `docs\LMS-PLAYER-SPEC.md`. Reads as internal to anyone who opens
  the file in a browser's View Source, harmless otherwise. Suggest a
  one-pass scrub before the next feature commit: strip D-P
  references, keep only what the code needs to explain itself.
- **P3b. `css/main.css` same pattern**: line 695 (D-P52 decision 1),
  line 1033 (D-P51 decision 6), line 1420 (references
  `docs/LMS-PLAYER-SPEC.md`), line 1425 (Deepa's pick candidate
  variants). Same suggestion.
- **P3c. `sw.js` file header**: describes the service worker's
  behaviour ("caches the app shell", "cache-first for images"). Read
  as a legitimate file header for a service worker. No change
  needed.
- **P3d. `js/app.js` line 861, mark-complete note**: rendered text
  reads `The tick is stored on this device only. Clearing browser
  storage clears the tick.` "Browser storage" is mild builder voice
  but sets user expectations correctly. Optional swap: `Clearing
  your browser data clears the tick.` This is register only, not a
  process reveal.

### L08. `README.md`, "AI-generated by the author" and "build pipeline"

**File:** `README.md` at repo root, rendered on the GitHub landing
page for the repo.

**Current text:** line 11 to 12:
> The Easy Read adaptation, illustrations (AI-generated by the
> author), code, and build pipeline are her original work, begun
> April 2026.

Line 44:
> `source/`: the content pipeline (Act text, section titles, Easy
> Read booklet PPTX and PDF, generator scripts) and the original PWA
> plan

**Why it reads as internal:** `AI-generated` and `build pipeline`
are on the pattern list. Judgement call: for a CBM or funder reader,
open disclosure that the illustrations are AI-generated by a CPACC
professional is likely a strength, not a leak. The "build pipeline"
and "content pipeline" phrases in the README are honest and
architectural rather than authoring-process reveals.

Recommend keeping both. Flagging for Deepa's explicit call. If she
wants softer language:
> The Easy Read adaptation, illustrations (produced by the author
> with generative-AI assistance and reviewed by her), code, and
> build steps are her original work, begun April 2026.

## Summary counts

- P1 rendered leaks: **5** (L01 to L05). Two were already known;
  three (L03, L04, L05) are new finds in the same training module.
- P2 downloadable or repo-visible leaks: **2** (L06, L07). L06 is
  a large single artefact carrying eight distinct author-voice
  bleeds; L07 is one hidden segment inside a shipped JSON.
- P3 code-comment and mild register notes: **4** groups (P3a to
  P3d).
- README judgement call: **1** (L08).

## Next steps

1. Deepa rewrites L01 through L05 in her voice (Easy Read for
   learner surfaces, plain professional for trainer surfaces), then
   the fold follows the signed-markdown flow: axe 0, SW bump.
2. Deepa decides between Option A (edit in place) and Option B
   (move the .md out of the deployed repo) for L06. Recommend
   Option B.
3. Deepa rules on L07 (strip meta lines from the hidden segment) and
   L08 (README register).
4. On the next `js/app.js` and `css/main.css` feature commit, do a
   one-pass scrub of the P3 D-P references.

## Pattern that let these through

Every P1 leak lived inside HTML content strings inside JSON. The
antithesis-check and axe passes ran on those strings and both stayed
green, because the checks look at pedagogy and accessibility, not
authorial voice. The judgement pass, added to this audit, is what
catches spec, builder, and process voice with no keyword hit. Fold
this same voice pass into future module builds before markdown
lands.

The raw-markdown P2 finding is a different pattern: source of truth
sitting in the deployed repo. Whatever build script generates
`ch-02.json` from the markdown, that script should live outside this
repo and check its output back in as JSON only. The sign-off block
and implementation notes never had a reason to be next to the
deployed static site's own git tree.

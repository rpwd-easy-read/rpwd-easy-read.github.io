# COGA calm spec: the v2.2 calm pass

**SIGNED OFF by Deepa, 2026-07-12 (tower D-P51).** Decision 1: variant A
(a one-chapter band skips its band page, data-driven on chapter count;
the chapter rows page keeps band context, breadcrumb and band colour
stripe). Decision 2: approved, plain titles authored on paper first;
map layers wait for the signed titles. Decision 3: approved as
proposed. Decision 4: approved, the build session curates the 17 chapter thumbs and
lists them here before shipping. Decision 5: approved. Decision 6:
approved with sub-slides kept and a global counter; the Contents
overlay groups the 22 slides under their 14 segment headings, structure
for the trainer, simplicity for the learner. All three accept-or-trim
proposals accepted (home picture cards, search on home and map only,
slim Using-the-Act panel).

One page. Grounded in W3C Making Content Usable (COGA): clear page
purpose (4.2.1), easy hierarchy (4.3.2), clear words (4.4.1), avoid too
much content (4.6.3), fewer choices (4.9.3), icons and images that help
(4.2.7). Rollback point: git tag design-v2, pushed. No code until Deepa
signs off the five decisions below.

## Decision 1: layered navigation, accordion retires

All sections (#/map) becomes five picture cards, nothing else on them
but the band illustration and the band name. Tap a band, get its
chapters as picture cards (#/map/<band>). Tap a chapter, get its
sections as short plain rows (#/chapter/<id>). One decision per screen,
big back link at the top of every layer.

```
ALL SECTIONS            BAND: SERVICES           CHAPTER III
[img] Foundations       < All sections           < Services and Support
[img] Rights            [img] Education          Education
[img] Services          [img] Skill and Work     S16  Schools must take you
[img] Systems           [img] Social Security    S17  Help to learn
[img] Enforcement       [img] Health             S18  ...
 (search field)         [img] Culture and Sport
```

Wrinkle: Rights and Entitlements holds one chapter. A band page with a
single card is a wasted tap, so its band card links straight to the
chapter page. Chapter rows drop the current two-line description
snippet; row = Section number plus plain title only.

## Decision 2: plain words on every navigation element

Section rows, search results, and chapter rows show a plain-language
title, never the official legal title. The official title stays on the
section page under the number badge, where citing happens.

**Gap found:** no plain titles exist anywhere in the repo; content.json
`title` is just "Section N: official title". So this decision needs 102
plain titles authored first, paper first per standing rule 4: a
docs\PLAIN-TITLES.md table (number, official title, proposed plain
title), Deepa reviews it, then a script adds `plain_title` to
content.json. Easy Read body text stays untouched. Each chapter also
gets a short plain card caption where its official name is legalese
("Skill Development and Employment" reads fine; "Preliminary" does not,
it becomes something like "The basics").

## Decision 3: kill the meta noise

No "N chapters, M sections" counts anywhere in navigation: home tiles,
map cards, band pages. Training rows drop the "Sections X to Y" range
and the subtitle line; the range stays on the module page header where
it serves the trainer. Section numbers stay everywhere they serve
citing.

## Decision 4: illustrations become the wayfinding

Band and chapter cards lead with the image at generous size; the name
is a caption under it, not the surface. Chapters get a curated
CHAPTER_THUMBS map (17 picks from the 32-image set), same pattern as
the existing BAND_THUMBS. Images stay aria-hidden; the link text is the
caption.

The 17 picks, all unique so no screen repeats an image: I book_simple,
II equality, III school, IV briefcase, V heart, VI chair_reserved
(reserved seats read), VII high_support_hands, VIII building_ramp,
IX clipboard_check, X certificate_star, XI committee_people,
XII commissioner_badge, XIII courthouse, XIV money_jar,
XV house_family (support closer to home; weakest pick, swap on
request), XVI warning, XVII document.

## Decision 5: footer diet

Two lines everywhere: "Nothing about us without us." and the verbatim
copyright line. Creator credit, "All 102 Sections" line, and the
Disability Rights Repository link move to About.

## Decision 6: training module goes slide-deck mode (added to the brief 2026-07-12)

The module page becomes a calm slide surface, the interaction model of
the CBM LMS: content fills the slide with generous padding, the band
header slims to one thin strip, the breadcrumb becomes one short line.
Two big fixed Next and Back buttons (full width side by side at the
bottom on phones), arrow keys stay, plain "Slide N of M" counter. The
horizontal stepper rail retires; a single Contents button opens a plain
list of segments with the current one marked. In-slide interactions
(knowledge-check reveal, mark-complete on the final slide) stay in the
slide; focus keeps moving to the slide heading; the live region keeps
announcing.

**Interpretation to confirm:** the brief says one segment = one slide,
but the live module already splits long segments into 22 sub-slides
(the `---` splits Deepa asked for, so segment 5 is four short slides,
not one wall). Proposal: keep the sub-slide splits, give every slide
the same calm surface, and make the counter global ("Slide 7 of 22").
Deep links keep working; routes do not change shape.

## Proposed, for Deepa to accept or trim

- **Home:** band tiles become the same picture cards as the map (no
  counts). Hero, on-ramp card, and home search stay; each is one clear
  action and they are the teach-first spine.
- **Search:** field stays on home and on the map top layer plus the
  header link. Band and chapter pages do not repeat it; consistent
  placement beats repetition.
- **Using-the-Act panel** on enforcement sections slims to one sentence
  plus the link, no heading box.
- **Training landing:** 17 rows become picture cards (chapter thumb,
  chapter plain name, one status line or Open module button). Filter
  chips stay; they are the one control that earns its place.

## Gates and sequence

Per green gate, pushed passes: (1) plain-titles paper doc and sign-off,
(2) map layers, (3) home, (4) footer and meta sweep, (5) training
landing. SW cache bump on every asset-changing commit. Ship gate per
commit: axe 0 on every route including #/map/<band>, Lighthouse
Accessibility 100, keyboard walkthrough, 320px reflow, and the
five-second "what do I do here" glance test on every navigation screen.

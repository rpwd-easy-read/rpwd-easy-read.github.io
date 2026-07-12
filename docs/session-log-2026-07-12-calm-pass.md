# Session log, 2026-07-12: the v2.2 calm pass

Narrative log for the COGA and neurodivergent-first declutter, run per
the tower's calm-pass brief. State captured in
docs\COGA-CALM-SPEC.md (design decisions) and docs\PLAIN-TITLES.md
(navigation wording); cross-project record in tower D-P51.

## Opening

- Rollback tag design-v2 created on 6b15e14 and pushed, sibling to
  design-v1.
- Gap found before any design work: content.json has no plain-language
  section titles anywhere; the title field is "Section N: official
  title". The brief's decision 2 assumed they existed. This reshaped
  the sequencing: titles became the first deliverable.
- W3C COGA patterns re-read (clear page purpose, easy hierarchy, clear
  words, avoid too much content, fewer choices, helpful images) and
  the spec grounded on them.

## Decisions (all Deepa, this session; full text in D-P51 and the spec)

1. Layered navigation, variant A, chosen after side-by-side phone-width
   mockups (design-review\calm-mock-2026-07-12\): a one-chapter band
   skips its band page, skip is data-driven on chapter count, chapter
   rows page keeps band breadcrumb and colour stripe.
2. Plain words everywhere in navigation; titles authored first so no
   layer ever ships legalese rows.
3. Meta noise goes; citing numbers stay.
4. Illustrations do the wayfinding; the build session curates 17 chapter thumbs.
5. Two-line footer; credits move to About.
6. Training module slide-deck mode with sub-slides kept, global
   counter, Contents overlay grouping 22 slides under 14 segment
   headings (the brief gained this section mid-session; re-read on
   Deepa's prompt).
- Trims all accepted: home picture cards, search on home and map only,
  slim Using-the-Act aside.

## Plain titles

Drafted all 102 plus 17 chapter captions; Deepa reviewed against the
Act text and corrected seven (S2, S8, S10, S25, S26, S31, S85), each
with a recorded reason (see PLAIN-TITLES.md header). File signed off
and now authoritative.

## Build log (appended as passes ship)

- DONE plain_title into content.json (script
  source\_build\apply_plain_titles.py; verified no existing field
  changed, Easy Read text untouched)
- DONE map layers: #/map five picture cards, #/map/<band> chapter
  cards, #/chapter/<id> plain rows with band context; Rights skips its
  band page data-driven; accordion retired. Gate green: axe 0 on 7
  routes (map, map/services, map/foundations, chapter/III, chapter/II,
  section/3, section/16, home with open search results), Lighthouse
  accessibility 100 on #/map, focus-visible outline on cards, 320px
  reflow verified by same-origin iframe probe (headless Chrome clamps
  windows at 500px wide; the probe is
  design-review\calm-verify-2026-07-12\reflow-probe.html), glance test
  passes. SW v14.
- DONE home (pass 2, 01c006f): band tiles are the same picture cards,
  counts gone; hero, on-ramp and home search stay. SW v15.
- DONE footer and meta sweep (pass 3, f0f2a92): two-line footer
  everywhere; credits and repository link moved to About; Using-the-Act
  aside slims to one sentence plus link. SW v16.
- DONE training landing (pass 4, 1cd2111): 17 picture cards with plain
  chapter names; ranges, subtitles and download stub lines out; filter
  chips and progress line stay. SW v17.
- DONE module slide-deck mode (pass 5, 63ea2ae): thin band strip, calm
  slide surface, fixed Back and Next with global Slide N of 22 counter,
  Contents overlay grouping slides under segment headings; stepper rail
  and dots retired; sub-slides kept. SW v18.

Gate evidence for all five passes:
design-review\calm-verify-2026-07-12\AXE-VERIFICATION.md. Note for
future verification: headless Chrome on this machine clamps windows at
500px wide; 320px reflow is tested with the same-origin iframe probe
in that folder, not with direct 320px screenshots.

# Training v2.1 pilot: axe verification, 2026-07-12

Ship gate for the training-module renderer, updated to the slide-deck
pass. Ran axe-core 4.10.0 against every relevant route in the running
app. Adobe Acrobat Reader browser extension injects a
`nested-interactive` shadow-root violation on every page across the
web; that node lives inside `#aiFabShadowRoot .acrobat-button`, is not
part of the app DOM, and was excluded from the report as expected.

## What shipped in this pass

Segments 3, 5, 8, and 9 split into slides via `---` markers in the
signed markdown source; each thematic break becomes one slide. The
build script splits each segment body on those markers and emits a
`slides` array per segment. The renderer walks slide-by-slide inside a
segment (with dot indicators) and prev/next cross segment boundaries at
the edges. Arrow keys and PageUp/PageDown navigate slides. Focus lands
on the slide heading on each render. Mark-complete lives on the last
slide of segment 14; endnotes live on the last slide of segment 13.

## Routes tested (slide-deck pass)

| Route | Description | axe violations (app-only) |
|---|---|---|
| `#/` | Home | 0 |
| `#/section/3` | Section 3 page (regression check) | 0 |
| `#/training` | Training landing | 0 |
| `#/training/ch-02/5/1` | Segment 5 slide 1 of 4 (Family 1 Equality) | 0 |
| `#/training/ch-02/5/2` | Segment 5 slide 2 of 4 (Family 2 Protection) | 0 |
| `#/training/ch-02/8/3` | Segment 8 slide 3 of 4 (email template blockquote) | 0 |
| `#/training/ch-02/9/2` | Segment 9 slide 2 of 3 (decision options + details reveal) | 0 |
| `#/training/ch-02/14` | Segment 14, only slide (takeaway kit + mark-complete) | 0 |

**Total: axe zero across every slide-level route tested, plus existing
routes.**

## Functional verification (DOM inspected, not just axe)

- Slide split from the build script: 22 slides across 13 visible
  segments (1+1+2+1+4+1+1+4+3+1+1+HIDDEN+1+1). Segment 12 discussion
  prompt stays hidden and stays out of prev/next.
- Arrow-key navigation, walked forward from `#/training/ch-02/5/2`:
  produced the sequence `5/3, 5/4, 6, 7`. Arrow-left from `#/7`
  produced `6, 5/4, 5/3, 5/2, 5, 4`. Boundary crossings work; the
  handler correctly emits the short URL form (no `/1`) for segments
  with one slide.
- Slide dot indicator (`.slide-dot`) present only on segments with more
  than one slide. Each dot carries `aria-label="Slide N of M in this
  segment"`; the active dot carries `aria-current="true"`.
- Focus lands on `#segment-heading` on each render. Screen-reader
  users hear the new slide title as they navigate.
- Mark-complete round-trip verified on segment 14: click sets
  `localStorage["rpwd-training-ch-02-complete"] = "1"`, `aria-pressed`
  flips to `true`, button label updates. Clean click clears the key
  and flips back.
- Blockquote (complaint template in segment 8 slide 3) renders as a
  band-tint callout with a band-accent left edge.
- Details reveal (segment 4 answer, segment 9 feedback) still works
  natively; state does not persist by design.

## Ship gate for this pass

- axe 0 across every route: PASS.
- Existing routes not regressed: PASS.
- Reflow at 320px: PASS from the earlier pass. Slide dots wrap and
  the horizontal slide-deck shape adds no new horizontal element.

## Notes on screenshot capture

Headless Chrome screenshots of the module routes captured the
"Loading module..." state instead of the rendered segments, because
the hash-route renderer only runs after the DOM is ready and the
async `content/training/ch-02.json` fetch resolves. Extending
`--virtual-time-budget` did not help across attempts. Visual
verification for this pass ran through the interactive browser
session; this file is the durable ship-gate record.

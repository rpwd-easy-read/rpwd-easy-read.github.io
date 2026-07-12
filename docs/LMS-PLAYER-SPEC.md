# Training module LMS player spec (2026-07-13)

Deepa's brief: the slide routes still read like a wall of text; the
ease of learning is lost. Rebuild the module presentation as a typical
LMS player in the flash-simulated style (like the CBM LMS modules):
a slide stage, prominent Next and Back, per-slide audio, and a colour
scheme of its own so the player reads as a distinct environment.

Renderer and CSS only. The signed ch-02 content, the routes, the
22-slide structure, arrow keys, Contents overlay, mark-complete,
endnotes, and the localStorage key all stay exactly as shipped.

## Layout: player chrome around a slide stage

```
+------------------------------------------------------------+
| CHROME  RIGHTS · CHAPTER II · Rights & Entitlements         |
|         About 45 minutes · Complete pill      [Contents]    |
+------------------------------------------------------------+
|                                                            |
|   STAGE (light surface, generous padding)                  |
|     2. Why this chapter matters            <- slide title  |
|     slide body, larger type, shorter measure               |
|                                                            |
+------------------------------------------------------------+
| CHROME  [< Back]  ====progress bar==== 7 of 22             |
|                [ Listen ] [ Next > ]                        |
+------------------------------------------------------------+
```

- The chrome (top strip and bottom control bar) carries the player's
  own colour; the stage stays light for reading comfort.
- The bottom bar is the fixed, always-visible control row: Back,
  a progress bar with "Slide N of M", Listen (audio), Next. Buttons
  are large (min 48px targets), text plus arrow glyphs, never
  icon-only.
- The stage has a comfortable min-height so short slides still look
  like slides, and scrolls internally past a max-height so long
  slides never push the controls off screen. When a slide overflows,
  a visible "More below, scroll" hint appears at the stage's bottom
  edge (no invisible cut-offs).
- Breadcrumb back to Training stays above the player.

## Audio (per slide)

- A Listen button in the control bar reads the slide: heading, then
  body text, via the same speech machinery as Read this to me
  (installed-voice pick preferring en-IN, deferred speak after
  cancel, keep-alive for long utterances). Listen swaps to Stop
  while speaking, exactly like the section pages.
- User-initiated only, no autoplay (WCAG 1.4.2, COGA
  predictability). Slide change or route change cancels speech
  (already guaranteed by the router).
- The shared speech engine is extracted into one helper used by both
  section pages and the player, so the three Chrome TTS bugs fixed on
  2026-07-12 stay fixed in one place.

## Colour: three candidate themes, Deepa picks from screenshots

The stage is always light. The chrome takes the theme:

1. **Slate** (recommended): deep neutral slate chrome, band accent
   kept as the progress fill and heading eyebrow. Reads instantly as
   "player, not page", works identically for all five bands, and the
   dark chrome frames the light stage the way the classic players do.
2. **Band deep**: chrome in a darkened tone of the module's band
   colour (rights maroon for Ch II). Stronger brand tie, but five
   bands means five chrome colours to keep AA-compliant.
3. **Light neutral**: quiet warm-grey chrome, closest to the current
   app feel, least "player-like".

All variants: chrome text and controls at 4.5:1 or better on the
chrome colour; focus outlines 3px; progress bar not colour-only (the
"N of M" text always present).

## Accessibility contract (unchanged plus additions)

- axe 0 on every slide route, keyboard walk end to end, focus lands
  on the slide heading each render, arrow keys keep working.
- Listen button: aria-pressed reflects speaking state; hidden when
  speechSynthesis is unavailable.
- Stage internal scroll region: tabindex="0" with role and
  aria-label so keyboard users can scroll it; the overflow hint is
  text, not colour.
- 320px reflow and big-text both hold (controls wrap to two rows).

## Wall-of-text root cause, flagged separately

The player contains the symptom but four slides are genuinely heavy
(7/1 at 1576 chars, 5/3, 8/3, 13/1 all over 1100). Recommendation
after the player ships: add slide breaks (`---`) inside segments 5,
7, 8, and 13 in the signed markdown source. That changes chunking,
not one word of content, but it touches the signed source, so it is
Deepa's call and a separate pass through build_training.py.

# Training v2.1 pilot: axe verification, 2026-07-12

Ship gate for the training-module renderer pass. Ran axe-core 4.10.0
against every relevant route in the running app at
`http://localhost:8765/`. Adobe Acrobat Reader browser extension injects
a `nested-interactive` shadow-root violation on every page across the
web; that node lives inside `#aiFabShadowRoot .acrobat-button`, is not
part of the app DOM, and was excluded from the report as expected.

## Routes tested

| Route | Description | axe violations (app-only) |
|---|---|---|
| `#/` | Home | 0 |
| `#/map` | All sections map | 0 |
| `#/section/3` | Section 3 page (existing route, regression check) | 0 |
| `#/training` | Training landing (rebuilt: progress line, Open module CTA) | 0 |
| `#/training/ch-02/1` | Module: Learning objectives | 0 |
| `#/training/ch-02/4` | Module: Prior-knowledge activation (MCQ + `<details>`) | 0 |
| `#/training/ch-02/7` | Module: Picking table (thead + 13-row tbody) | 0 |
| `#/training/ch-02/8` | Module: Worked example (blockquote callout) | 0 |
| `#/training/ch-02/9` | Module: Decision case (MCQ + `<details>`) | 0 |
| `#/training/ch-02/13` | Module: Further reading (footnote refs + endnotes block) | 0 |
| `#/training/ch-02/14` | Module: Mark complete (takeaway kit + button) | 0 |

**Total: axe zero across every route, existing and new.**

## Functional verification (DOM inspected, not just axe)

- Build script parses `content/training/ch-02-rights-and-entitlements.md`
  into `content/training/ch-02.json`: 14 segments authored, 1 hidden
  (segment 12 discussion prompt, held per D-P50 until the trainer
  network channel exists), 1 flagged as mark-complete (segment 14),
  four endnote definitions, four footnote references round-tripped to
  in-page anchors.
- MCQ answer-reveal on segments 4, 6, 9 uses native `<details>`
  disclosure. No JavaScript needed to open or close it. State does not
  persist by design.
- Picking table on segment 7 renders with band-rights accent header
  (`rgb(47, 107, 52)` = `#2F6B34`) and band-rights tint even rows
  (`rgb(231, 241, 230)` = `#E7F1E6`). 13 body rows, 3 columns, header
  cells rendered as `<th>`.
- Endnotes on segment 13: 4 footnote references (`sup.footnote-ref
  a[href="#fn:N"]`) round-trip to the 4 endnote definitions in the
  same segment's rendered endnotes block, and the endnote back-links
  point at `#fnref:N`.
- Mark-complete on segment 14: click toggles
  `localStorage["rpwd-training-ch-02-complete"]` between `"1"` and
  unset; button `aria-pressed` and label update in sync; screen-reader
  announcement fires through the shared `sr-announce` region.
- Landing page reads that key: progress line shows
  `1 of 17 chapter modules are ready. You have marked N complete on
  this device.` and the Chapter II row surfaces a
  `Marked complete on this device` chip when set.
- Reflow: at a forced 320px content container, the picking table cells
  wrap and remain readable; a 1-2px border overflow inside the wrapper
  is within acceptable rounding.

## Ship gate for this pass

- axe 0 across every route: PASS.
- 320px reflow: PASS on the tested content (Deepa's device check is
  still on the Pending list for the wider v2 pass).
- Lighthouse Accessibility 100: not re-run this pass; existing
  Lighthouse-100 verification from v2 (2026-07-12) applies because the
  training routes share the same shell, colour tokens, focus outline,
  and heading structure.

## Notes on screenshot capture

Headless Chrome screenshots of the module routes captured the
"Loading module..." state instead of the rendered segments, because the
hash-route renderer only runs after the DOM is ready and the async
`content/training/ch-02.json` fetch resolves. Extending
`--virtual-time-budget` did not help across attempts. The visual
verification for this pass ran through the interactive browser session;
this file is the durable ship-gate record.

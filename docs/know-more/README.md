# Know more: More in plain words (v2.3b)

Paper-first authoring for the second layer of the Know more panel:
a bullet-point deeper explanation of each section, sitting ABOVE the
verbatim gazette text once a batch is signed off.

## Discipline

Per session brief:

> Drafted in band batches as markdown under docs\know-more\
> (one file per band), Deepa reviews and signs off each batch, a
> script folds signed batches into content.json. Until a section's
> bullets are signed, its panel shows only the actual-words layer:
> complete and honest from day one, no dead buttons, no coming soon.

The v2.3a panel already ships the verbatim law. The plain-words
bullets are additive: they appear ABOVE the quoted block once
signed. If a section has no signed bullets, the panel simply shows
the verbatim law, no placeholder.

## Voice rules (from the brief)

- One idea per sentence
- Everyday words
- "you" for the reader
- No antithesis constructions (X is not Y family)
- No banned vocabulary: delve, leverage, seamless, robust, journey,
  empower, foster, unlock
- Every bullet defensible against the statute it explains
- Where the law qualifies (income tests, benchmark thresholds,
  government-only scopes), the bullet carries the qualifier in plain
  words

The plain-titles review caught five legal drifts. Expect the same
scrutiny here. When in doubt, cite the statute clause the bullet
depends on in a `<!-- staff-note: cf. S3(3) proviso -->` HTML comment
so review can trace the mapping.

## Batch flow

1. Draft `<band>.md` here, one heading per section.
2. Ask Deepa to review.
3. On sign-off, run `python source/_build/fold_know_more_bullets.py
   --band <band>` to fold the bullets into `content.json` as a per-
   section `know_more_bullets` array.
4. Bump SW cache in `sw.js`.
5. Commit.

## Files

- `README.md` — this file.
- `rights.md` — pilot batch, Rights & Entitlements (S3-S15).
  Draft, awaiting Deepa's sign-off.

Subsequent batches (Services & Support, Systems & Authorities,
Enforcement, Foundations & Definitions) will follow the same
template.

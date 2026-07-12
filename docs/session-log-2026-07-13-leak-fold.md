# Session log 2026-07-13 (evening): leak-audit fold

Acting on docs\LEAK-AUDIT-2026-07-13.md with the author's four
decisions, given in session:

1. **L01 to L05 and L07 rewrites applied as proposed.** The training
   module now speaks to the trainer everywhere: the picking-table
   colour note addresses the reader, the endnotes line drops the
   editor imperative, the mark-complete slide says "You have finished
   the module" with the on-device privacy promise in plain words, the
   handout heading loses its pipeline parenthetical, and the hidden
   discussion segment carries only its pedagogical body. Rebuilt JSON
   verified free of all seven leak strings and the new voice verified
   in the rendered DOM.
2. **L06 Option B.** The markdown source and its build script moved
   out of this repo into the programme tower's training-source
   folder. The app repo now ships built JSON only; the tower script
   writes into content\training\ and was verified by building the
   current JSON from its new home. Future modules follow the same
   path: author in the tower, sign off, build, commit JSON here.
3. **L08 README kept as is.** Open AI-assistance disclosure stays.
4. **P3 scrub done now.** Internal decision codes and personal names
   removed from js\app.js and css\main.css comments; technical
   rationale kept. The About page credits are content and stay.

Additionally, per the author's instruction in the same review: model
and assistant references removed from all tracked files (audit and
session docs now cite "the programme tower audit brief" instead of
tool-named prompt files), and commit messages in this repository no
longer carry assistant attribution trailers. Removal of the trailers
already in the public history needs a history rewrite; that is a
separate, explicitly confirmed step recorded in this log when done.

Gate: axe 0 on all 259 routes, console clean, rendered-voice checks
pass on all five rewritten surfaces, deck intact at 24 slides. SW v29.

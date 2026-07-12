# Know more: official_text extraction check

Verification record for v2.3a per the session brief
(`equitabledocs-program/prompts/fable-rpwd-know-more.md`).
Prepared before any app wiring, per Deepa's instruction:
"follow the extraction verification protocol strictly and show me
the check record before wiring."

Second-pass update after Deepa's sign-off:
"apply the shared-consequent paragraph rule generically, not just to
S92; scan all 102 for enumerated lists followed by an unlettered
consequent clause, restore the paragraph break wherever the gazette
has one, and list the sections the rule touched in the check record."

## What was built

- Extraction script: `source/_build/extract_official_text.py`
- Hand-check helper:  `source/_build/hand_check.py`
- Sidecar output:     `source/_build/official_text_extracted.json`
- Consequent-break report: `source/_build/consequent_breaks.json`

The script reads the gazetted source at `source/_build/rpwd_act_text.txt`
(2 105 lines, extracted from the Ministry of Law and Justice PDF) and
returns the verbatim statutory prose for each of the 102 sections.
Marginal notes, page headers, page footers, chapter headings, and
legal citation stamps are removed. Statute punctuation (em-dashes,
curly quotes, colons, semicolons) is preserved character for character,
including the gazetted misspelling "thounsand" in section 89.

## Verification protocol, from the brief

> Extraction is the risk, section boundaries especially. Protocol:
> script extracts all 102, then verify by diffing every extracted
> section's first and last sentence against the source and hand-check
> the ten longest sections plus S45, S89, S91 (the long-titled ones)
> and S102 (last). Record the check in docs\.

## Result summary

- Sections extracted: 102 / 102
- First-sentence auto diff (present in source range): 102 / 102 pass
- Last-sentence auto diff (present in source range): 102 / 102 pass
- Hand-check (14 sections): every "source-only" word token found by
  the diff maps to a known marginal note or a chapter heading. No
  source-only token was a real prose word.
- Zero "extract-only" word tokens across all 14 hand-checked sections.
- Shared-consequent paragraph rule applied to sections: **S52, S92**.
  Both cases verified against the gazette layout, both restore a
  paragraph break where the gazette prints one.

## Extraction algorithm, brief

1. Walk the source; identify the first appearance of each section
   number 1..102 in strict ascending order. The Schedule at the tail
   of the gazette also uses the sequence 1..6 but sits after 102, so
   the strict-ascending walk terminates cleanly at S102.
2. For each section, take the raw line range from its start to the
   next section's start (or to `THE  SCHEDULE` for S102).
3. Split the range by `===== PAGE N =====` markers into page-chunks.
4. For each page-chunk after the first, strip the running page
   header: `SEC. N]`, `THE GAZETTE OF INDIA EXTRAORDINARY`,
   `[PART II—`, and the bare page number.
5. For each page-chunk, strip the marginal-note tail. Walk backward
   through blank lines, legal citations (`\d+ of \d+.`), marginal
   candidates (Capitalised noun phrases under 35 chars), and
   marginal wraps (short lines under 30 chars). Then find the
   earliest marginal candidate or legal citation in the tail region
   and strip from there to the end of the chunk. If no candidate or
   citation exists in the tail, strip nothing.
6. Strip any `CHAPTER X` heading and its uppercase title.
7. Detect shared-consequent break points (see next section).
8. Reconstruct paragraphs: join wrapped lines; start new paragraphs
   at subsection markers `(1)`, subclause markers `(a)` and `(i)`,
   `Provided`, `Explanation`, or any detected consequent-break line.

## Shared-consequent paragraph rule

**The rule.** A line begins a new paragraph if
1. it opens with a consequent verb head, one of
   `shall be`, `shall not`, `shall have`, `shall attract`,
   `may be`, `may not`, `may have`, `will be`, `will not`, `will have`,
   `it shall`, `it may`, `it will`,
   `he shall`, `he may`, `he will`,
   `she shall`, `she may`, `she will`,
   `they shall`, `they may`, `they will`; AND
2. the immediately previous non-blank line ends with a comma; AND
3. walking backward through wraps, the first structural marker we hit
   is a `(letter)` subclause (as opposed to a `(digit)` subsection
   stem, a `Provided`, or an `Explanation`).

Rationale: this is the gazette's shape for shared consequent clauses,
where a series of enumerated items `(a), (b), (c), ...,` is followed
by a common consequent that applies to any of them. In the PDF the
consequent sits at the section-stem indent, not the list indent, and
reads as its own paragraph. Flat text loses the indent signal, so we
recover it from the semantic pattern above.

Why the three conditions together rule out the false positives that a
looser rule would catch:
- Condition (1) alone would catch mid-sentence wraps such as S34(2)
  "such vacancy shall be carried forward ..." (a normal prose wrap
  inside a paragraph). Not a paragraph break.
- Condition (2) alone would catch every wrap continuation in the
  definitions section, including all the definition wraps in S2.
  Not paragraph breaks.
- Condition (3) is what pins the rule to real shared consequents:
  the immediately preceding structure must be a `(letter)` subclause,
  which is the shape of an enumeration, not a numbered subsection.
- Test the rule against the two known cases:
  - S52(1). Walk back from "it may, after making ..." past the wrap
    "subject to which the certificate was granted," and land on
    `(b) committed or has caused ...`. Letter subclause. Break.
  - S92. Walk back from "shall be punishable with imprisonment ..."
    past six wraps and land on `(f) performs, conducts or directs ...`.
    Letter subclause. Break.

**Sections where the rule fired.** After scanning all 102 sections:

| Section | Consequent line preview |
|---:|---|
| S52 | `it may, after making such inquiry, as it deems fit, by order, revoke the certificate:` |
| S92 | `shall be punishable with imprisonment for a term which shall not be less than six months but which may extend to five years and with fine.` |

Only these two. All other candidate patterns in the Act were:
- Mid-sentence prose wraps (e.g., S2 definitions, S17 enumeration
  wraps, S34(2) flowing prose): fail condition (3) or the pattern
  fails condition (1).
- Section stems ending in `,—` before an enumeration (e.g., S7 stem
  `shall—` line 228, S65 `shall perform the following functions,
  namely:—` line 1250, S71 same, S52(2) `such institution shall
  cease to function,—` line 1024): these are already paragraph
  starts in the source and are handled by the existing structural-
  marker rules, not the consequent rule.
- Consequent-shaped lines in sections without letter subclauses
  (e.g., S50 proviso wrap, S93 single-sentence): fail condition (3).

Verified by scanning: `source/_build/consequent_breaks.json`.

## Other rules tuned during the check

- **Legal citations always strip.** Version 1 required a marginal
  candidate (uppercase noun phrase) to anchor the tail strip.
  On page 4 the tail was only two legal citations (`41 of 2006.`,
  `18 of 2013.`) with no accompanying uppercase noun phrase, so the
  script left them merged into the middle of section 2. Fixed by
  allowing a legal citation to anchor the strip.
- **Statutory list items keep trailing `;` or `,`.** Section 60(q)
  contains "Ali Yavar Jung National Institute for the Hearing
  Handicapped, / Mumbai;" wrapped from a wide column. "Mumbai;" is
  seven characters and starts with a capital, so version 1 flagged
  it as a marginal candidate and stripped it. The fix: a marginal
  candidate must not end with `;`, `,`, `:`, `—`, or `-`. Statute
  list items and mid-sentence wraps always do. Marginal notes end
  with `.` or a letter.

Together these two rules brought the hand-check to zero false
positives and zero false negatives across all 14 sections.

## Auto diff, every section

- First sentence present in source range: **102 / 102**
- Last sentence  present in source range: **102 / 102**

The auto diff normalises whitespace and looks for the extracted
first and last sentence inside the whitespace-normalised source
range for that section. Any mismatch would flag either a boundary
error (picked up the wrong section start), a truncation, or an
accidental insertion.

## Hand-check set

Top 10 by extracted character count, plus S45, S89, S91, S102:

| # | Section | Chars | Notes |
|---:|---:|---:|---|
| 1 | S2   | 7 947 | Definitions. 26 sub-clauses (a)..(zc). |
| 2 | S60  | 3 914 | Central Advisory Board composition. Long enumerated list including institute names with commas. |
| 3 | S100 | 3 024 | Central Government rule-making powers. |
| 4 | S101 | 2 938 | State Government rule-making powers. |
| 5 | S7   | 2 848 | Protection from cruelty and inhuman treatment. |
| 6 | S34  | 2 449 | Reservation in employment. |
| 7 | S66  | 2 438 | State Advisory Board composition. |
| 8 | S24  | 2 097 | Social security. |
| 9 | S51  | 1 973 | Registration procedure. |
| 10 | S17 | 1 930 | Specific measures for inclusive education. |
| add | S45 | 730 | Time limit for accessibility (span across page 15 / 16). |
| add | S89 | 331 | Punishment for contravention (short; verbatim gazetted misspelling "thounsand"). |
| add | S91 | 254 | Fraudulent availment (long-titled). |
| add | S102 | 325 | Repeal and savings (last section). |

For each of these 14 the source-normalised range was word-token
diffed against the extraction. Every source-only word token was
verified by eye to be a marginal note or a chapter heading. Every
extract-only word count was 0.

### Per-section detail

- **S2** (7 947 c). Source-only tokens: "Short title commencement.",
  "Definitions.", "CHAPTER II RIGHTS AND ENTITLEMENTS". All marginal
  notes and chapter heading. First: `2. In this Act, unless the
  context otherwise requires,—`. Last: `(zc) "specified disability"
  means the disabilities as specified in the Schedule;`. **Pass.**
- **S7** (2 848 c). Source-only tokens: 0 (perfect match after
  marginal strip). Full text 457 words. **Pass.**
- **S17** (1 930 c). Source-only: "Designation ... support.",
  "Duty ... institutions.", "Specific ... facilitate ... education."
  All marginal. **Pass.**
- **S24** (2 097 c). Source-only: "Equal opportunity policy.",
  "Maintenance of records.", "Appointment of Grievance Redressal
  Officer.", "Social security." All marginal (four sections' notes
  land on the same page). **Pass.**
- **S34** (2 449 c). Source-only: "Free education for children ...",
  "Reservation in higher educational institutions.",
  "Identification of posts for reservation.", "Reservation." All
  marginal. **Pass.**
- **S45** (730 c). Source-only: 18 tokens all belonging to six
  marginal notes at bottom of page 15 ("Accessibility.", "Access to
  transport.", "Access to information and communication technology.",
  "Consumer goods.", "Mandatory observance of accessibility norms.",
  "Time limit for making existing infrastructure and premises
  accessible and action for that purpose."). This section spans page
  15 and 16; extractor rejoined the split proviso and (2)
  correctly. **Pass.**
- **S51** (1 973 c). Source-only tokens: 0. **Pass.**
- **S60** (3 914 c). Source-only tokens: "Constitution",
  "Disability." (parts of marginal "Constitution of Central
  Advisory Board on Disability."). The real prose word "Mumbai;"
  is preserved (was the trigger for the ends-with-`;` rule tune).
  **Pass.**
- **S66** (2 438 c). Source-only: "Vacation of seats by Members.",
  "Meetings of the Central Advisory Board on disability.",
  "Functions of Central Advisory Board on disability.", "State
  Advisory Board on disability." All marginal. **Pass.**
- **S89** (331 c). Source-only tokens: 0. Gazetted misspelling
  "thounsand" preserved verbatim. **Pass.**
- **S91** (254 c). Source-only tokens: 0. **Pass.**
- **S100** (3 024 c). Source-only tokens: 16, all marginal
  ("Application ... barred.", "Protection ... good faith.",
  "Power to remove difficulties.", "Power to amend Schedule.",
  "Power to make rules."). **Pass.**
- **S101** (2 938 c). Source-only: "Power ... rules." Marginal.
  **Pass.**
- **S102** (325 c). Source-only: "Repeal and savings." Marginal.
  Extraction goes cleanly to the `THE  SCHEDULE` boundary and does
  not bleed into the Specified Disability list. **Pass.**
- **S52** (extra, consequent-touched): rule fired once, on
  `it may, after making such inquiry, as it deems fit, by order,
  revoke the certificate:` after subclauses (a) and (b) of (1).
  Rendered output verified.
- **S92** (extra, consequent-touched): rule fired once, on
  `shall be punishable with imprisonment for a term ...` after
  subclauses (a) through (f). Rendered output verified.

## What ships next

1. Fold `official_text_extracted.json` into `content.json` as a new
   per-section field `official_text`. Nothing else in `content.json`
   is touched, matching the plain-titles pass discipline.
2. Wire the "Know more" button at the right end of the section
   controls row (opposite "Read this to me").
3. Open a sub-route `#/section/N/more` (Deepa decision 1) that
   renders a calm quoted block with the section number and the
   verbatim law.
4. Focus goes to the panel heading on open. Escape or a Close
   button returns focus to the trigger button. axe = 0 on the
   panel state, keyboard walk and 320 px reflow clean.
5. "Read this to me" reads the panel content when the panel is
   open (Deepa decision 2).

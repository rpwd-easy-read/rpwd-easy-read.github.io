#!/usr/bin/env python3
"""Extract verbatim official text for each of the 102 sections of the RPwD Act 2016.

Reads:  source/_build/rpwd_act_text.txt   (extracted PDF text)
Writes: content.json                       (adds official_text field per section)
Writes: docs/KNOW-MORE-EXTRACTION-CHECK.md (verification record)

Verification protocol (know-more session-start brief):
  1. Extract all 102 sections.
  2. Auto-diff every section first and last sentence against the source.
  3. Hand-check the 10 longest sections plus S45, S89, S91, S102.
  4. Record the check in docs/.
  5. Show Deepa the check record before wiring anything.
"""

from __future__ import annotations

import json
import re
import pathlib
import sys

REPO = pathlib.Path(__file__).resolve().parents[2]
SOURCE = REPO / 'source' / '_build' / 'rpwd_act_text.txt'
CONTENT = REPO / 'content.json'
CHECK_DOC = REPO / 'docs' / 'KNOW-MORE-EXTRACTION-CHECK.md'

# ---------------------------------------------------------------- patterns

SECTION_START = re.compile(r'^\s?(\d+)\.\s')
PAGE_MARK = re.compile(r'^===== PAGE \d+ =====$')
PAGE_HDR_SEC = re.compile(r'^SEC\. \d+\]$')
PAGE_HDR_GAZETTE = 'THE GAZETTE OF INDIA EXTRAORDINARY'
PAGE_HDR_PART = re.compile(r'^\[PART II.$')
PAGE_NUM_LINE = re.compile(r'^\s*\d{1,3}\s*$')
LEGAL_CITE = re.compile(r'^\d+\s+of\s+\d+\.$')
CHAPTER_HDR = re.compile(r'^CHAPTER\s+[IVXLCDM]+\s*$')

# Structural markers that begin a new paragraph inside a section
NEW_PARA_SUBSECTION = re.compile(r'^\(\d+\)\s')
NEW_PARA_SUBCLAUSE = re.compile(r'^\([a-z]+\)\s')
NEW_PARA_SECTION_NUM = re.compile(r'^\d+\.\s')

# Shared-consequent detection: a lowercase-starting clause with a
# subject-verb head that follows an enumerated (a)..(z) list whose last
# item ended with a comma. In the gazette this is rendered as its own
# paragraph, semantically qualifying the whole enumeration. Two known
# cases in the Act: S52(1) ("it may, after making such inquiry ...")
# and S92 ("shall be punishable with imprisonment ...").
CONSEQUENT_HEAD = re.compile(
    r'^(shall (be|not|have|attract)|may (be|not|have)|will (be|not|have)|'
    r'it (shall|may|will)|he (shall|may|will)|she (shall|may|will)|'
    r'they (shall|may|will))\b')
STRUCTURAL_ANY = re.compile(r'^(\(\d+\)\s|\([a-z]+\)\s|Provided\s|Explanation)')
STRUCTURAL_LETTER = re.compile(r'^\([a-z]+\)\s')

# ---------------------------------------------------------------- helpers

def read_source():
    return SOURCE.read_text(encoding='utf-8').splitlines()

def find_section_starts(lines):
    starts = {}
    next_expected = 1
    for i, line in enumerate(lines):
        m = SECTION_START.match(line)
        if m and int(m.group(1)) == next_expected:
            starts[next_expected] = i
            next_expected += 1
            if next_expected > 102:
                break
    missing = set(range(1, 103)) - set(starts.keys())
    if missing:
        raise RuntimeError(f'Missing section starts: {sorted(missing)}')
    return starts

def find_schedule_line(lines):
    for i, line in enumerate(lines):
        s = line.strip()
        if re.match(r'^THE\s+SCHEDULE$', s):
            return i
    raise RuntimeError('Could not find THE SCHEDULE line')

_STATUTE_TRAILING = (';', ',', ':', '—', '-', '(')  # punctuation that marks statutory continuation

def is_marginal_candidate(line):
    """A line that could be the start of a right-margin note run.

    Starts of a marginal note are Capitalised noun phrases under 35 chars
    that end with '.' or a letter. Statute list items may look short
    and Capitalised too but they end with ';' ',' ':' or '—'.
    """
    s = line.strip()
    if not s:
        return False
    if len(s) >= 35:
        return False
    if s.startswith('('):
        return False
    if s.startswith('Provided'):
        return False
    if s.startswith('Explanation'):
        return False
    if not s[0].isupper():
        return False
    if s.endswith(_STATUTE_TRAILING):
        return False
    return True

def is_marginal_wrap(line):
    """A wrap continuation of a marginal note: short, no subclause marker,
    no statutory trailing punctuation.

    These are tail lines of multi-word marginal notes rendered from a
    narrow right column ('Time limit / for / accessibility / by service /
    providers.'). They start with lowercase because they are wraps.
    """
    s = line.strip()
    if not s:
        return False
    if len(s) >= 30:
        return False
    if s.startswith('('):
        return False
    if s.startswith('Provided'):
        return False
    if s.startswith('Explanation'):
        return False
    if s.endswith(_STATUTE_TRAILING):
        return False
    return True

# ---------------------------------------------------------------- extract

def split_page_chunks(raw):
    """Split a section's raw lines by PAGE markers into a list of chunks."""
    chunks = [[]]
    for line in raw:
        if PAGE_MARK.match(line):
            chunks.append([])
        else:
            chunks[-1].append(line)
    return chunks

def strip_page_header(chunk):
    """Strip the running header at the top of a page-chunk following a marker."""
    i = 0
    while i < len(chunk):
        s = chunk[i].strip()
        if (s == '' or PAGE_HDR_SEC.match(s) or s == PAGE_HDR_GAZETTE
                or PAGE_HDR_PART.match(s) or PAGE_NUM_LINE.match(s)):
            i += 1
        else:
            break
    return chunk[i:]

def strip_marginal_tail(chunk):
    """Walk backwards from the end of a chunk, stripping the marginal-note tail.

    Marginal notes at the tail of a page-chunk are rendered from a narrow
    right column: short lines, possibly wrapped, with legal citations mixed
    in. Statutory prose has line width around 90 chars; marginal notes are
    almost always under 30 chars per line.

    Two-step protocol so we do not eat a genuine short prose wrap that
    happens to sit right before the marginal region:
    1. Walk backward while lines are blank / legal citation / marginal
       candidate / marginal wrap. That defines the tail region [p, end).
    2. Inside [p, end), find the earliest marginal candidate (uppercase
       noun phrase). Strip from there to end. If no candidate exists,
       strip nothing: the short lines were prose, not margin.
    """
    p = len(chunk)
    while p > 0:
        s = chunk[p - 1].strip()
        if (s == '' or LEGAL_CITE.match(s)
                or is_marginal_candidate(chunk[p - 1])
                or is_marginal_wrap(chunk[p - 1])):
            p -= 1
            continue
        break
    boundary = None
    for i in range(p, len(chunk)):
        s = chunk[i].strip()
        if is_marginal_candidate(chunk[i]) or LEGAL_CITE.match(s):
            boundary = i
            break
    if boundary is None:
        return chunk
    return chunk[:boundary]

def strip_chapter_headers(lines):
    """Remove CHAPTER X followed by uppercase title lines."""
    out = []
    i = 0
    while i < len(lines):
        s = lines[i].strip()
        if CHAPTER_HDR.match(s):
            i += 1
            while i < len(lines) and lines[i].strip() != '' and lines[i].strip().isupper():
                i += 1
            continue
        out.append(lines[i])
        i += 1
    return out

def extract_section(lines, start, end):
    raw = lines[start:end]

    # Pass 1: split by page markers, strip page headers and marginal-note tails per chunk.
    chunks = split_page_chunks(raw)
    processed = []
    for idx, chunk in enumerate(chunks):
        if idx > 0:
            chunk = strip_page_header(chunk)
        chunk = strip_marginal_tail(chunk)
        processed.extend(chunk)
        # Restore a blank line between chunks so paragraphs do not re-merge
        # across the page break inside a subsection wrap.
        if idx < len(chunks) - 1:
            processed.append('')

    # Pass 2: remove any chapter headers that appear (usually at range end).
    result = strip_chapter_headers(processed)

    # Trim leading and trailing blanks
    while result and result[0].strip() == '':
        result.pop(0)
    while result and result[-1].strip() == '':
        result.pop()

    # Pass 3: find shared-consequent break points, then reconstruct paragraphs.
    consequent_breaks = find_consequent_breaks(result)

    paras = []
    current = []
    is_first_line = True
    for idx, line in enumerate(result):
        s = line.strip()
        if not s:
            if current:
                paras.append(' '.join(current))
                current = []
            continue
        starts_new = (
            NEW_PARA_SUBSECTION.match(s)
            or NEW_PARA_SUBCLAUSE.match(s)
            or (is_first_line and NEW_PARA_SECTION_NUM.match(s))
            or s.startswith('Provided ')
            or s.startswith('Explanation')
            or idx in consequent_breaks
        )
        if starts_new and current:
            paras.append(' '.join(current))
            current = [s]
        elif starts_new:
            current = [s]
        else:
            current.append(s)
        is_first_line = False
    if current:
        paras.append(' '.join(current))

    return '\n\n'.join(paras)

def find_consequent_breaks(cleaned_lines):
    """Return the set of indices into cleaned_lines that should start a
    new paragraph because the line is a shared-consequent clause after
    a letter-marked enumeration.

    Rule: the line starts with a consequent verb head, its immediately
    preceding non-blank line ends with a comma, and walking backward
    through wraps the first structural marker we hit is a `(letter)`
    subclause (as opposed to a `(digit)` subsection stem or a Proviso).
    """
    breaks = set()
    for i, line in enumerate(cleaned_lines):
        s = line.strip()
        if not s or not CONSEQUENT_HEAD.match(s):
            continue
        j = i - 1
        found_comma = False
        while j >= 0:
            p = cleaned_lines[j].strip()
            if not p:
                j -= 1
                continue
            if STRUCTURAL_ANY.match(p):
                if STRUCTURAL_LETTER.match(p) and found_comma:
                    breaks.add(i)
                break
            if not found_comma:
                if p.rstrip().endswith(','):
                    found_comma = True
                else:
                    break
            j -= 1
    return breaks

# ---------------------------------------------------------------- verify

WS = re.compile(r'\s+')

def collapse(s):
    return WS.sub(' ', s).strip()

def first_sentence(text):
    body = text.strip()
    m = re.search(r'\.[\s\)]', body)
    if not m:
        return body[:120]
    return body[:m.end() - 1]

def last_sentence(text):
    body = text.strip().rstrip()
    # take last chunk after the last paragraph break
    tail = body.split('\n\n')[-1]
    return tail

def source_slice(lines, start, end):
    return collapse(' '.join(lines[start:end]))

# ---------------------------------------------------------------- main

def main():
    lines = read_source()
    starts = find_section_starts(lines)
    schedule_line = find_schedule_line(lines)

    ranges = {}
    for n in range(1, 103):
        e = starts[n + 1] if n + 1 in starts else schedule_line
        ranges[n] = (starts[n], e)

    extracted = {n: extract_section(lines, *ranges[n]) for n in range(1, 103)}

    # ---- auto-verification: first and last sentence appear in source (whitespace-normalized) ----
    src_by_section = {n: source_slice(lines, *ranges[n]) for n in range(1, 103)}
    src_full = collapse(' '.join(lines))

    first_ok, last_ok = [], []
    first_bad, last_bad = [], []
    for n in range(1, 103):
        text = extracted[n]
        f = collapse(first_sentence(text))
        l = collapse(last_sentence(text))
        # Check first sentence exists in source range
        if f in src_by_section[n]:
            first_ok.append(n)
        else:
            first_bad.append(n)
        # For last sentence, use last 160 chars
        tail = l[-160:] if len(l) > 160 else l
        if tail in src_by_section[n]:
            last_ok.append(n)
        else:
            last_bad.append(n)

    # ---- lengths for hand-check pick ----
    lengths = sorted(((n, len(extracted[n])) for n in range(1, 103)),
                     key=lambda x: -x[1])
    top10 = [n for n, _ in lengths[:10]]

    # ---- write extracted texts to a JSON side file ----
    sidecar = REPO / 'source' / '_build' / 'official_text_extracted.json'
    sidecar.write_text(json.dumps(extracted, indent=2, ensure_ascii=False), encoding='utf-8')

    # Report shared-consequent breaks applied per section (for check record).
    consequent_report = REPO / 'source' / '_build' / 'consequent_breaks.json'
    breaks_per_section = {}
    lines_by_section = {n: extract_section(lines, *ranges[n]).count('shall be punishable')
                        + extract_section(lines, *ranges[n]).count('it may, after')
                        for n in range(1, 103)}
    # Simpler: report which sections have the break applied by re-scanning
    for n in range(1, 103):
        raw = lines[ranges[n][0]:ranges[n][1]]
        # Reuse the internal machinery to see which lines were flagged.
        chunks = split_page_chunks(raw)
        processed = []
        for idx, chunk in enumerate(chunks):
            if idx > 0:
                chunk = strip_page_header(chunk)
            chunk = strip_marginal_tail(chunk)
            processed.extend(chunk)
            if idx < len(chunks) - 1:
                processed.append('')
        cleaned = strip_chapter_headers(processed)
        while cleaned and cleaned[0].strip() == '':
            cleaned.pop(0)
        while cleaned and cleaned[-1].strip() == '':
            cleaned.pop()
        br = find_consequent_breaks(cleaned)
        if br:
            hits = []
            for i in sorted(br):
                hits.append({'line_preview': cleaned[i].strip()[:80]})
            breaks_per_section[n] = hits
    consequent_report.write_text(json.dumps(breaks_per_section, indent=2, ensure_ascii=False),
                                 encoding='utf-8')

    print(f'Extracted {len(extracted)} sections.')
    print(f'First-sentence pass: {len(first_ok)} / 102, fail: {first_bad}')
    print(f'Last-sentence pass:  {len(last_ok)} / 102, fail: {last_bad}')
    print(f'Wrote sidecar:            {sidecar.relative_to(REPO)}')
    print(f'Wrote consequent-report:  {consequent_report.relative_to(REPO)}')
    print(f'Shared-consequent break applied in sections: {sorted(breaks_per_section)}')

if __name__ == '__main__':
    main()

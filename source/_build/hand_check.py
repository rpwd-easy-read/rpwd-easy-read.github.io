#!/usr/bin/env python3
"""Hand-check helper: for each hand-check section, print
extracted text vs. whitespace-normalised source range, so the two
can be compared word by word.
"""
import json
import re
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from extract_official_text import (
    read_source, find_section_starts, find_schedule_line
)

REPO = pathlib.Path(__file__).resolve().parents[2]
WS = re.compile(r'\s+')
NOISE_PATTERNS = [
    re.compile(r'^===== PAGE \d+ =====$'),
    re.compile(r'^SEC\. \d+\]$'),
    re.compile(r'^THE GAZETTE OF INDIA EXTRAORDINARY$'),
    re.compile(r'^\[PART II.$'),
    re.compile(r'^\d+\s+of\s+\d+\.$'),
    re.compile(r'^CHAPTER\s+[IVXLCDM]+\s*$'),
]

def is_bare_page_num(s, prev_line):
    """A bare 1-3 digit page number is noise only right after a PAGE marker
    or right before a `THE GAZETTE OF INDIA EXTRAORDINARY` line."""
    return re.match(r'^\d{1,3}$', s) is not None

def source_normalised(lines, start, end):
    """Return whitespace-normalised source text with obvious noise stripped.
    Not a re-extraction: just a comparison view."""
    filtered = []
    prev = ''
    for i in range(start, end):
        s = lines[i].strip()
        if not s:
            continue
        if any(p.match(s) for p in NOISE_PATTERNS):
            continue
        # Bare page numbers (1-3 digits) around page markers
        if re.match(r'^\d{1,3}$', s):
            # only strip if adjacent to marker context
            near_marker = False
            for j in range(max(start, i-2), min(end, i+3)):
                if re.match(r'^===== PAGE \d+ =====$', lines[j].strip()):
                    near_marker = True
                    break
                if lines[j].strip() == 'THE GAZETTE OF INDIA EXTRAORDINARY':
                    near_marker = True
                    break
            if near_marker:
                continue
        filtered.append(s)
        prev = s
    return WS.sub(' ', ' '.join(filtered)).strip()

def main():
    lines = read_source()
    starts = find_section_starts(lines)
    schedule = find_schedule_line(lines)
    ranges = {n: (starts[n], starts[n + 1] if n + 1 in starts else schedule)
              for n in range(1, 103)}

    extracted = json.load(open(REPO / 'source' / '_build' / 'official_text_extracted.json',
                               encoding='utf-8'))

    hand = [2, 7, 17, 24, 34, 45, 51, 60, 66, 89, 91, 100, 101, 102]

    for n in hand:
        text = extracted[str(n)]
        text_norm = WS.sub(' ', text).strip()
        src_norm = source_normalised(lines, *ranges[n])

        # Word-by-word compare
        text_words = text_norm.split(' ')
        src_words = src_norm.split(' ')

        # Words in source that were dropped from extract (excluding marginal words)
        src_set = set(src_words)
        text_set = set(text_words)

        # Any word in source but not in extracted? Show words present in source
        # that are NOT in extracted (should be marginal-note words only).
        only_in_source = [w for w in src_words if w not in text_set]
        only_in_text = [w for w in text_words if w not in src_set]

        # Approximate character-difference metric.
        diff_pct = 100.0 * (len(src_norm) - len(text_norm)) / max(1, len(src_norm))

        print(f'=== S{n} ===')
        print(f'  extracted: {len(text_norm)} chars, {len(text_words)} words')
        print(f'  source:    {len(src_norm)} chars, {len(src_words)} words')
        print(f'  source-only word tokens ({len(only_in_source)}): '
              f'{" ".join(only_in_source[:40])}'
              + (' ...' if len(only_in_source) > 40 else ''))
        print(f'  extract-only word tokens ({len(only_in_text)}): '
              f'{" ".join(only_in_text[:30])}'
              + (' ...' if len(only_in_text) > 30 else ''))
        print()

if __name__ == '__main__':
    main()

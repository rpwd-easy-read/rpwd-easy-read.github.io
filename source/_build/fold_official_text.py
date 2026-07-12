#!/usr/bin/env python3
"""Fold the extracted official_text sidecar into content.json.

Reads:
  content.json
  source/_build/official_text_extracted.json

Writes:
  content.json  (adds `official_text` field to each section, nothing else touched)

Verification:
  Every existing field on every section is byte-for-byte unchanged.
  Only new key `official_text` is added.
"""
import json
import pathlib

REPO = pathlib.Path(__file__).resolve().parents[2]
CONTENT = REPO / 'content.json'
SIDECAR = REPO / 'source' / '_build' / 'official_text_extracted.json'

def main():
    content = json.loads(CONTENT.read_text(encoding='utf-8'))
    sidecar = json.loads(SIDECAR.read_text(encoding='utf-8'))

    sections = content.get('sections', [])
    assert len(sections) == 102, f'Expected 102 sections, got {len(sections)}'

    # Snapshot pre-existing keys for verification.
    pre_snapshot = [dict(s) for s in sections]

    touched = 0
    for s in sections:
        n = str(s['num'])
        if n not in sidecar:
            raise RuntimeError(f'Missing section {n} in sidecar')
        s['official_text'] = sidecar[n]
        touched += 1

    # Verify: every pre-existing key is byte-for-byte identical.
    for pre, post in zip(pre_snapshot, sections):
        for key, val in pre.items():
            if post[key] != val:
                raise RuntimeError(f"Field {key!r} on S{pre['num']} changed during fold")

    # Write back with the same formatting style content.json had.
    CONTENT.write_text(json.dumps(content, indent=2, ensure_ascii=False) + '\n',
                       encoding='utf-8')
    print(f'Folded official_text into {touched} sections. content.json updated.')

if __name__ == '__main__':
    main()

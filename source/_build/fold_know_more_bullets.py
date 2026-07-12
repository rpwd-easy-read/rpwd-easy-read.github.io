#!/usr/bin/env python3
"""Fold a signed batch of "More in plain words" bullets into content.json.

Reads:
  docs/know-more/<band>.md   (author's markdown, with H2 per section)
  content.json               (current app data)

Writes:
  content.json               (adds/updates `know_more_bullets` per section)

Only runs after Deepa signs off on the batch. Idempotent: re-folding
the same file re-writes the same bullets. Sections not present in the
markdown are left unchanged (their panels keep showing only the
verbatim law layer).

Usage:
  python source/_build/fold_know_more_bullets.py --band rights

Markdown format expected:

  ## S{num} — {title, ignored}
  - bullet 1
  - bullet 2
  <!-- staff-note: ... optional trace to statute clauses ... -->

  ## S{num2} — ...
  - ...

Any lines that are not headings, bullets, or comments are ignored.
"""
import argparse
import json
import pathlib
import re
import sys

REPO = pathlib.Path(__file__).resolve().parents[2]
CONTENT = REPO / 'content.json'
KNOW_MORE_DIR = REPO / 'docs' / 'know-more'

SECTION_HDR = re.compile(r'^##\s+S(\d+)\b')
BULLET = re.compile(r'^-\s+(.+)$')

def parse_batch(md_path):
    """Return {section_num: [bullet_text, ...]}.

    Bullets are joined line by line (soft wraps recomposed). Staff-note
    HTML comments are skipped. Non-bullet lines between bullets or
    after the last bullet close the current bullet.
    """
    bullets_by_num = {}
    cur_num = None
    cur_bullets = None
    cur_bullet_lines = None

    def flush_bullet():
        nonlocal cur_bullet_lines
        if cur_bullet_lines:
            cur_bullets.append(' '.join(cur_bullet_lines).strip())
            cur_bullet_lines = None

    for raw in md_path.read_text(encoding='utf-8').splitlines():
        line = raw.rstrip()
        m = SECTION_HDR.match(line)
        if m:
            flush_bullet()
            cur_num = int(m.group(1))
            cur_bullets = []
            bullets_by_num[cur_num] = cur_bullets
            cur_bullet_lines = None
            continue
        if cur_num is None:
            continue
        # HTML comments: skip entirely.
        if line.strip().startswith('<!--'):
            flush_bullet()
            continue
        bm = BULLET.match(line)
        if bm:
            flush_bullet()
            cur_bullet_lines = [bm.group(1).strip()]
        elif cur_bullet_lines is not None:
            stripped = line.strip()
            if stripped and not stripped.startswith('#'):
                cur_bullet_lines.append(stripped)
            else:
                flush_bullet()
        # blank/heading lines outside bullets: no action.
    flush_bullet()
    return {n: b for n, b in bullets_by_num.items() if b}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--band', required=True,
                    help='Band file basename under docs/know-more/ (e.g. rights).')
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    md_path = KNOW_MORE_DIR / f'{args.band}.md'
    if not md_path.exists():
        print(f'Batch file not found: {md_path}', file=sys.stderr)
        sys.exit(1)

    bullets = parse_batch(md_path)
    if not bullets:
        print(f'No section bullets found in {md_path}. Nothing to fold.',
              file=sys.stderr)
        sys.exit(1)

    content = json.loads(CONTENT.read_text(encoding='utf-8'))
    sections = content.get('sections', [])
    by_num = {s['num']: s for s in sections}

    missing = sorted(n for n in bullets if n not in by_num)
    if missing:
        print(f'Batch names sections not in content.json: {missing}',
              file=sys.stderr)
        sys.exit(1)

    changes = []
    for n, bs in bullets.items():
        prev = by_num[n].get('know_more_bullets')
        if prev == bs:
            continue
        by_num[n]['know_more_bullets'] = bs
        changes.append((n, len(bs)))

    if args.dry_run:
        print(f'Dry run. Would fold {len(bullets)} sections '
              f'({sum(len(b) for b in bullets.values())} bullets).')
        for n, cnt in changes:
            print(f'  S{n}: {cnt} bullets')
        return

    CONTENT.write_text(json.dumps(content, indent=2, ensure_ascii=False) + '\n',
                       encoding='utf-8')
    print(f'Folded batch "{args.band}". '
          f'Sections updated: {len(changes)}. '
          f'Total bullets: {sum(len(b) for b in bullets.values())}.')

if __name__ == '__main__':
    main()

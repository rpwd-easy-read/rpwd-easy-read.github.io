"""Write the signed plain-language navigation titles into content.json.

Source of truth: docs/PLAIN-TITLES.md (signed by Deepa 2026-07-12,
tower D-P51 decision 2). This script parses its two tables and adds:

  - ``plain_title``  to every section (navigation rows, search results)
  - ``plain_caption`` to every chapter (chapter cards; captions marked
    "(kept)" fall back to the official chapter title)

Easy Read body text (plain_text, use_when) is never touched.

Re-run after any PLAIN-TITLES.md edit, and after export_content.py if
the pipeline regenerates a content.json without these fields:

    python source/_build/apply_plain_titles.py [path/to/content.json]
"""

import io
import json
import os
import re
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(_HERE))
TITLES_MD = os.path.join(REPO, "docs", "PLAIN-TITLES.md")


def parse_tables(md_text):
    chapters = {}
    sections = {}
    for line in md_text.splitlines():
        m = re.match(r"^\|\s*([IVX]+)\s*\|[^|]+\|\s*([^|]+?)\s*\|$", line)
        if m and m.group(1) != "Ch":
            chapters[m.group(1)] = m.group(2)
            continue
        m = re.match(r"^\|\s*(\d+)\s*\|[^|]+\|\s*([^|]+?)\s*\|$", line)
        if m:
            sections[int(m.group(1))] = m.group(2)
    return chapters, sections


def main():
    content_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(REPO, "content.json")
    md = io.open(TITLES_MD, encoding="utf-8").read()
    chapters, sections = parse_tables(md)
    if len(sections) != 102 or len(chapters) != 17:
        raise SystemExit(
            f"Parse mismatch: {len(sections)} section titles, {len(chapters)} chapter captions"
        )

    with io.open(content_path, encoding="utf-8") as f:
        content = json.load(f)

    for ch in content["chapters"]:
        caption = chapters[ch["id"]]
        ch["plain_caption"] = ch["title"] if caption.endswith("(kept)") else caption
    for s in content["sections"]:
        s["plain_title"] = sections[s["num"]]

    with io.open(content_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(content, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"{content_path}: 102 plain_title, 17 plain_caption written")


if __name__ == "__main__":
    main()

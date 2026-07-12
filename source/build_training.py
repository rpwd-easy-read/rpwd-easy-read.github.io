#!/usr/bin/env python3
"""Build the RPwD training module JSON files from their markdown sources.

Reads:
    content/training/*.md

Writes (one JSON per module):
    content/training/*.json

Each module JSON has this shape:

    {
        "module_id": "ch-02",
        "chapter_id": "II",
        "band_id": "rights",
        "title": "Chapter II: Rights and Entitlements",
        "subtitle": "For trainers and support workers. Full 14 segments. About 20 minutes.",
        "duration_minutes": 20,
        "sections_range": "S3 to S15",
        "segments": [
            {"num": 1, "title": "Learning objectives", "html": "...",
             "hidden": false, "is_mark_complete": false},
            ...
        ],
        "takeaway_html": "...",
        "endnotes_html": "..."
    }

Only Deepa's signed-off content ships. Segments 12 (discussion prompt) is
marked hidden per D-P50 until the trainer network channel goes live.
Segment 14 (mark complete) is flagged so the renderer wires the localStorage
button on it.

Dep: the `markdown` Python package. Install once with `pip install markdown`.
Run this script from the repo root: `python source/build_training.py`.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

try:
    import markdown as md_lib
except ImportError:
    print("ERROR: this build script needs the `markdown` package.")
    print("Install with:  pip install markdown")
    sys.exit(1)


REPO_ROOT = Path(__file__).resolve().parent.parent
TRAINING_DIR = REPO_ROOT / "content" / "training"

# Chapter to band mapping (mirrors js/app.js BANDS)
CHAPTER_TO_BAND = {
    "I": "foundations", "XVII": "foundations",
    "II": "rights",
    "III": "services", "IV": "services", "V": "services",
    "VI": "services", "VII": "services",
    "VIII": "systems", "IX": "systems", "X": "systems",
    "XI": "systems", "XII": "systems", "XIV": "systems", "XV": "systems",
    "XIII": "enforcement", "XVI": "enforcement",
}

# Per module: segments held behind a data-segment-live=false flag.
# Deepa lights these up once the corresponding channel exists.
HIDDEN_SEGMENTS = {
    "ch-02": {12},
}

# Segment 14 is the mark-complete step in every module.
MARK_COMPLETE_SEGMENT = 14

MD_EXTENSIONS = [
    "tables",
    "fenced_code",
    "attr_list",
    "def_list",
    "footnotes",
    "sane_lists",
    "md_in_html",
    "nl2br",
]

MD_EXTENSION_CONFIGS = {
    "footnotes": {
        "PLACE_MARKER": "///Footnotes///",
        "BACKLINK_TEXT": "Back",
    },
}


def parse_module(md_text: str, module_id: str) -> dict:
    """Split a training module markdown file into structured JSON."""

    # First H1 is the module title. Metadata bullets follow it.
    h1_match = re.search(r"^# (.+)$", md_text, flags=re.MULTILINE)
    if not h1_match:
        raise ValueError(f"Module {module_id}: no top-level H1 heading found.")
    title = h1_match.group(1).strip()

    # Extract module metadata bullets from the preamble
    preamble_start = h1_match.end()
    preamble_end_match = re.search(r"^## ", md_text[preamble_start:],
                                    flags=re.MULTILINE)
    preamble = md_text[preamble_start:preamble_start + (
        preamble_end_match.start() if preamble_end_match else 0)]

    chapter_id = None
    sections_range = None
    duration_minutes = 20
    audience = ""
    subtitle = "For trainers and support workers. Full 14 segments. About 20 minutes."

    # Parse the intro paragraph
    intro_match = re.search(
        r"\*\*Training module.*?\*\*(.+?)(?=\n\n|\n-)", preamble,
        flags=re.DOTALL,
    )
    if intro_match:
        subtitle = re.sub(r"\s+", " ", intro_match.group(0).replace("**", "")).strip()

    # Parse metadata bullets: "- Sections covered: S3 to S15"
    for line in preamble.splitlines():
        line = line.strip()
        if line.startswith("- Sections covered:"):
            sections_range = line.split(":", 1)[1].strip()
            sections_range = re.sub(r"\s*\(\d+ sections\)\s*", "", sections_range)
        elif line.startswith("- Audience:"):
            audience = line.split(":", 1)[1].strip()

    # Chapter id from module id (ch-02 -> II)
    roman_by_int = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI",
                    7: "VII", 8: "VIII", 9: "IX", 10: "X", 11: "XI",
                    12: "XII", 13: "XIII", 14: "XIV", 15: "XV", 16: "XVI",
                    17: "XVII"}
    m = re.match(r"ch-(\d+)$", module_id)
    if not m:
        raise ValueError(f"Module id must match 'ch-NN', got {module_id!r}.")
    chapter_id = roman_by_int[int(m.group(1))]
    band_id = CHAPTER_TO_BAND[chapter_id]

    # Split on H2 headings. Each H2 opens either a numbered segment
    # (## 1. ..., ## 2. ..., etc.) or a named section (Trainer's,
    # Implementation notes, Endnotes, Sign-off).
    parts = re.split(r"(?m)^## ", md_text)
    # parts[0] is the preamble. Skip it.
    segments = []
    takeaway_html = ""
    endnotes_md = ""

    hidden_set = HIDDEN_SEGMENTS.get(module_id, set())

    for part in parts[1:]:
        # First line is the heading text
        first_line_end = part.find("\n")
        if first_line_end == -1:
            heading = part.strip()
            body = ""
        else:
            heading = part[:first_line_end].strip()
            body = part[first_line_end + 1:]

        # Strip trailing horizontal-rule separators from segment bodies
        body = re.sub(r"\n---\s*\n?$", "\n", body).rstrip() + "\n"

        seg_num_match = re.match(r"(\d+)\. (.+)$", heading)
        if seg_num_match:
            num = int(seg_num_match.group(1))
            seg_title = seg_num_match.group(2).strip()
            # Split each segment body on mid-body `---` thematic breaks into
            # slides so long segments read as a slide deck instead of a wall
            # of text. If there is no `---` inside the body, the segment
            # renders as one slide (unchanged shape for short segments).
            slide_bodies = re.split(r"\n[ \t]*---[ \t]*\n", body)
            slide_bodies = [sb.strip() for sb in slide_bodies if sb.strip()]
            if not slide_bodies:
                slide_bodies = [""]
            slides = []
            for i, sb in enumerate(slide_bodies, start=1):
                slide_html = md_lib.markdown(
                    sb,
                    extensions=MD_EXTENSIONS,
                    extension_configs=MD_EXTENSION_CONFIGS,
                    output_format="html5",
                )
                slides.append({"num": i, "html": slide_html})
            # Concatenation for printable handout paths; also lets any older
            # caller that reads .html still work while the renderer moves to
            # `slides`.
            full_html = "\n".join(s["html"] for s in slides)
            segments.append({
                "num": num,
                "title": seg_title,
                "slides": slides,
                "html": full_html,
                "hidden": num in hidden_set,
                "is_mark_complete": num == MARK_COMPLETE_SEGMENT,
            })
            continue

        heading_lower = heading.lower()
        if heading_lower.startswith("trainer's take-away kit"):
            takeaway_html = md_lib.markdown(body,
                                            extensions=MD_EXTENSIONS,
                                            extension_configs=MD_EXTENSION_CONFIGS,
                                            output_format="html5")
            continue

        if heading_lower.startswith("endnotes"):
            endnotes_md = body
            continue

        # Implementation notes and Sign-off block are internal only. Skip.
        if heading_lower.startswith("implementation notes"):
            continue
        if heading_lower.startswith("sign-off block"):
            continue

        # Any other H2 (unexpected) becomes a segment-less info section
        print(f"WARNING: {module_id}: skipping unrecognised H2 heading "
              f"{heading!r}")

    # Endnotes rendered separately so the renderer can pin them
    endnotes_html = ""
    if endnotes_md:
        endnotes_html = md_lib.markdown(endnotes_md,
                                        extensions=MD_EXTENSIONS,
                                        extension_configs=MD_EXTENSION_CONFIGS,
                                        output_format="html5")

    # Post-process every segment's HTML: convert any surviving [^N] footnote
    # references to superscript anchor links. The endnotes_html contains
    # `id="fn:N"` targets and back-links to `#fnref:N`, so this closes the
    # loop even though refs and definitions were parsed in separate calls.
    footnote_ref_re = re.compile(r"\[\^(\d+)\]")

    def _linkify_footnotes(html: str) -> str:
        return footnote_ref_re.sub(
            r'<sup class="footnote-ref"><a href="#fn:\1" '
            r'id="fnref:\1">\1</a></sup>',
            html,
        )

    for seg in segments:
        seg["html"] = _linkify_footnotes(seg["html"])
        for sl in seg.get("slides", []):
            sl["html"] = _linkify_footnotes(sl["html"])
    takeaway_html = _linkify_footnotes(takeaway_html)

    return {
        "module_id": module_id,
        "chapter_id": chapter_id,
        "band_id": band_id,
        "title": title,
        "subtitle": subtitle,
        "audience": audience,
        "duration_minutes": duration_minutes,
        "sections_range": sections_range or "",
        "segments": sorted(segments, key=lambda s: s["num"]),
        "takeaway_html": takeaway_html,
        "endnotes_html": endnotes_html,
    }


def build_all() -> int:
    """Convert every content/training/*.md to its JSON sibling."""

    if not TRAINING_DIR.exists():
        print(f"ERROR: {TRAINING_DIR} does not exist.")
        return 1

    md_files = sorted(TRAINING_DIR.glob("*.md"))
    if not md_files:
        print(f"No .md files found in {TRAINING_DIR}. Nothing to build.")
        return 0

    for md_path in md_files:
        # Module id is the ch-NN prefix; strip the descriptive suffix
        stem = md_path.stem
        m = re.match(r"(ch-\d+)", stem)
        if not m:
            print(f"SKIP: {md_path.name} does not start with ch-NN.")
            continue
        module_id = m.group(1)

        md_text = md_path.read_text(encoding="utf-8")
        module = parse_module(md_text, module_id)
        out_path = TRAINING_DIR / f"{module_id}.json"
        out_path.write_text(
            json.dumps(module, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        seg_count = len(module["segments"])
        hidden_count = sum(1 for s in module["segments"] if s["hidden"])
        print(f"BUILT {out_path.relative_to(REPO_ROOT)}: "
              f"{seg_count} segments ({hidden_count} hidden), "
              f"band {module['band_id']}, sections {module['sections_range']}")

    return 0


if __name__ == "__main__":
    sys.exit(build_all())

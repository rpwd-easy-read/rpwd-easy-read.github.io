"""Export web/content.json from the PPTX builder's SECTIONS data.

Single source of truth: `build_rpwd_easy_read.py` holds the 102-section data
as Python. This script imports it, flattens it to JSON, and copies the
illustration PNGs and Vidyasagar logo into the web/img folder.

The web app reads content.json at runtime. When a caption or use-when is
edited in `build_rpwd_easy_read.py`, rebuild both the PPTX and the web app
to keep them in sync:

    python _build/illustrations.py          # if drawings changed
    python _build/build_rpwd_easy_read.py   # rebuild PPTX
    python _build/export_content.py         # refresh web/content.json + assets

Run: python _build/export_content.py
"""

import os
import sys
import json
import shutil

_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

from build_rpwd_easy_read import (  # noqa: E402
    SECTIONS, CHAPTER_DIVIDERS, CHAPTER_LABEL, CHAPTER_COLOR,
    PROJECT, ILLUSTRATION_DIR, LOGO,
    VS_BLUE, VS_PINK, VS_BLUE_DARK, VS_PINK_DARK,
)


WEB_DIR      = os.path.join(PROJECT, "web")
IMG_DIR      = os.path.join(WEB_DIR, "img")
ILLUS_WEB    = os.path.join(IMG_DIR, "illustrations")
CONTENT_JSON = os.path.join(WEB_DIR, "content.json")


def color_to_hex(c):
    """Convert a pptx RGBColor (tuple-like) to #RRGGBB."""
    try:
        return f"#{c[0]:02X}{c[1]:02X}{c[2]:02X}"
    except (TypeError, IndexError):
        s = str(c)
        return f"#{s[-6:].upper()}"


def extract_section_num(title):
    # "Section 3 \u2014 Equality and non-discrimination" -> 3
    parts = title.split(None, 2)
    return int(parts[1])


def extract_official_title(title):
    # Keep the part after the em-dash (the official section name)
    for sep in ("\u2014", "—", " - "):
        if sep in title:
            return title.split(sep, 1)[1].strip()
    return title


def is_reference_only(use_when):
    return use_when.strip().startswith("(For reference")


def build_content():
    # Group section numbers by chapter so each chapter knows what it contains.
    chapter_sections = {}
    for s in SECTIONS:
        chapter_sections.setdefault(s["chapter"], []).append(
            extract_section_num(s["section_title"])
        )

    chapters = []
    for ch, divider in CHAPTER_DIVIDERS.items():
        chapters.append({
            "id": ch,
            "label": CHAPTER_LABEL[ch],
            "title": divider["title"],
            "subtitle": divider["subtitle"],
            "kicker": divider["kicker"],
            "color": color_to_hex(CHAPTER_COLOR[ch]),
            "sections": chapter_sections.get(ch, []),
        })

    sections = []
    for s in SECTIONS:
        num = extract_section_num(s["section_title"])
        sections.append({
            "num": num,
            "chapter": s["chapter"],
            "title": s["section_title"],
            "official_title": extract_official_title(s["section_title"]),
            "plain_text": s["plain_text"],
            "use_when": s["use_when"],
            "illustration": s["illustration"],
            "is_reference": is_reference_only(s["use_when"]),
        })

    # Brand palette for the web app's CSS custom properties
    palette = {
        "vs_blue":      color_to_hex(VS_BLUE),
        "vs_blue_dark": color_to_hex(VS_BLUE_DARK),
        "vs_pink":      color_to_hex(VS_PINK),
        "vs_pink_dark": color_to_hex(VS_PINK_DARK),
    }

    return {
        "meta": {
            "title":          "The RPwD Act 2016",
            "subtitle":       "Easy Read Guide",
            "audience":       "A complete reference for persons with intellectual and learning disabilities.",
            "version":        "1.0",
            "total_sections": len(sections),
            "total_chapters": len(chapters),
            "source_note":    "Section titles verified against the official RPwD Act 2016 (Ministry of Law and Justice).",
        },
        "palette":  palette,
        "chapters": chapters,
        "sections": sections,
    }


def copy_assets():
    os.makedirs(ILLUS_WEB, exist_ok=True)
    os.makedirs(IMG_DIR, exist_ok=True)
    count = 0
    for f in sorted(os.listdir(ILLUSTRATION_DIR)):
        if f.lower().endswith(".png"):
            shutil.copy2(
                os.path.join(ILLUSTRATION_DIR, f),
                os.path.join(ILLUS_WEB, f),
            )
            count += 1
    if os.path.exists(LOGO):
        shutil.copy2(LOGO, os.path.join(IMG_DIR, "vidyasagar_logo.png"))
    return count


def main():
    os.makedirs(WEB_DIR, exist_ok=True)
    content = build_content()
    with open(CONTENT_JSON, "w", encoding="utf-8") as f:
        json.dump(content, f, indent=2, ensure_ascii=False)
    n = copy_assets()
    print(f"OK wrote {CONTENT_JSON}")
    print(f"   {len(content['sections'])} sections across {len(content['chapters'])} chapters")
    print(f"   copied {n} illustrations + logo to {IMG_DIR}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Convert the Celestial Church of Christ hymnal PDF into a Scriptune import file.

Usage: python3 scripts/parse-ccc-hymnal.py api/data/ccc-hymnal.pdf api/data/ccc-hymnal.json

The PDF pairs "Orin N" (Yoruba) with "Hymn N" (English) for the same hymn, with
tonic sol-fa notation between the marker and the words. This keeps the words,
drops the notation and page furniture, and pairs the two languages by number.
Used by permission of the Celestial Church of Christ.
"""
import json
import re
import sys
from pypdf import PdfReader

SOLFA = set("drmfstlDRMFSTL")


def is_solfa(line: str) -> bool:
    core = re.sub(r"[\s;:.\-\d()}\]\[|]", "", line).replace("ce", "")
    return len(core) > 0 and all(ch in SOLFA for ch in core)


def is_header(line: str) -> bool:
    letters = [ch for ch in line if ch.isalpha()]
    return len(letters) >= 4 and line == line.upper()


def clean(line: str) -> str:
    return re.sub(r"\s+", " ", line).strip()


def parse(pdf_path: str):
    reader = PdfReader(pdf_path)
    text = "\n".join((page.extract_text() or "") for page in reader.pages)
    lines = text.split("\n")

    # blocks[(number, language)] = [lyric lines]
    blocks: dict[tuple[int, str], list[str]] = {}
    order: list[int] = []
    current: tuple[int, str] | None = None

    for raw in lines:
        line = clean(raw)
        if line == "" or re.match(r"^\d+\s*\|\s*P\s*a\s*g\s*e", line) or "HOLY SAVIOUR PARISH" in line:
            continue
        marker = re.match(r"^(Orin|Hymn)\s+(\d+)\b", line)
        if marker:
            lang = "yo" if marker.group(1) == "Orin" else "en"
            number = int(marker.group(2))
            current = (number, lang)
            blocks.setdefault(current, [])
            if number not in order:
                order.append(number)
            continue
        if is_header(line):
            current = None
            continue
        if current is None or is_solfa(line):
            continue
        blocks[current].append(line)

    hymns = []
    for number in sorted(order):
        texts = []
        for lang in ("en", "yo"):
            body = blocks.get((number, lang), [])
            stanzas = to_stanzas(body)
            if stanzas:
                texts.append({"language": lang, "title": title_of(body, number, lang), "stanzas": stanzas})
        if not texts:
            continue
        title = next((t["title"] for t in texts if t["language"] == "en"), texts[0]["title"])
        hymns.append({"number": number, "title": title, "texts": texts})
    return hymns


def to_stanzas(body: list[str]):
    if not body:
        return []
    stanzas = []
    current_lines: list[str] = []
    current_number = None
    for line in body:
        verse = re.match(r"^(\d+)\s*[:.]\s*(.*)$", line)
        if verse:
            if current_lines:
                stanzas.append(make_stanza(current_number, current_lines))
            current_number = int(verse.group(1))
            rest = verse.group(2).strip()
            current_lines = [rest] if rest else []
        else:
            current_lines.append(line)
    if current_lines:
        stanzas.append(make_stanza(current_number, current_lines))
    # If nothing was numbered, it is a single verse.
    numbered = [s for s in stanzas if s["number"] is not None]
    if not numbered and stanzas:
        stanzas = [{"number": 1, "kind": "verse", "lines": [ln for s in stanzas for ln in s["lines"]]}]
    return [s for s in stanzas if s["lines"]]


def make_stanza(number, lines):
    return {"number": number, "kind": "verse", "lines": [ln for ln in lines if ln.strip()]}


def title_of(body: list[str], number: int, lang: str) -> str:
    for line in body:
        stripped = re.sub(r"^\d+\s*[:.]\s*", "", line).strip()
        if stripped and stripped.lower() not in ("amin", "amen"):
            return re.sub(r"[\s,;:.]+$", "", stripped)[:120]
    return f"Hymn {number}"


def main():
    pdf_path = sys.argv[1] if len(sys.argv) > 1 else "api/data/ccc-hymnal.pdf"
    out_path = sys.argv[2] if len(sys.argv) > 2 else "api/data/ccc-hymnal.json"
    hymns = parse(pdf_path)
    doc = {
        "hymnal": {
            "slug": "ccc-hymnal",
            "title": "Celestial Church of Christ Hymnal",
            "publisher": "Celestial Church of Christ",
            "description": "Hymns of the Celestial Church of Christ in Yoruba and English, used with permission.",
            "rightsStatus": "used-by-permission",
        },
        "source": {
            "slug": "ccc-holy-saviour-parish-london",
            "name": "Celestial Church of Christ, Holy Saviour Parish London (contributed with permission)",
            "license": "Used by permission of the Celestial Church of Christ, which retains all rights.",
            "rightsStatus": "used-by-permission",
            "notes": "Parsed from the parish hymnal PDF; tonic sol-fa notation omitted. The church may request removal at any time.",
        },
        "entries": hymns,
    }
    with open(out_path, "w", encoding="utf-8") as handle:
        json.dump(doc, handle, ensure_ascii=False, indent=2)
    both = sum(1 for h in hymns if len(h["texts"]) == 2)
    print(f"hymns: {len(hymns)} (bilingual: {both})  -> {out_path}")
    if hymns:
        sample = next((h for h in hymns if len(h["texts"]) == 2), hymns[0])
        print(json.dumps(sample, ensure_ascii=False, indent=2)[:900])


if __name__ == "__main__":
    main()

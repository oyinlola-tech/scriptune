#!/usr/bin/env python3
"""Parse the OCR'd CAC Yoruba hymnal text into the Scriptune import JSON.

The source is degraded OCR: no Yoruba diacritics, many word-split errors, and
page numbers / section headers / tonic sol-fa dynamic markers mixed into the
verses. This script does the STRUCTURAL cleanup only -- it never invents or
corrects words. The output is marked used-by-permission and needs-review so a
Yoruba speaker restores diacritics and fixes OCR errors before it goes live.

Usage:
    python3 scripts/parse-cac-hymnal.py \
        --in api/data/cac-yoruba.txt \
        --out api/data/cac-hymnal.json
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field

# --- normalisation ---------------------------------------------------------

# Every OCR apostrophe / elision variant collapses to a plain apostrophe.
APOSTROPHES = ["‘", "’", "‗", "`", "´", "′", "ʼ"]
# The OCR uses horizontal bars and double bars as opening/closing quote marks.
QUOTES = ["―", "‖", "“", "”", "„", "«", "»"]
DASHES = ["—", "–"]

# Tonic sol-fa dynamic markers that sit inside verses and must be dropped.
DYNAMICS = {
    "f", "ff", "fff", "mf", "mp", "p", "pp", "ppp", "cr", "di", "fp",
    "per", "un", "mj", "dim", "rall",
}

# Amin, in its OCR spellings, ends a hymn.
AMEN = {"amin", "amin.", "amen", "amen.", "amn", "amn.", "annin", "annin.", "aminl"}

# A chapter:verse anywhere in a token, so a merged ref like "OD119:5" still counts.
CHAP_VERSE = re.compile(r"\d{1,3}:\d{1,3}")
LETTER_METRE = re.compile(r"^(?:D\.?)?[CLS]\.?M\.?$", re.IGNORECASE)
SYLL_METRE = re.compile(r"^\d{1,2}s\.?$", re.IGNORECASE)
METRE_WORDS = {
    "&", "ref", "ref.", "refrain", "refrain.", "triple", "or", "t.", "d.",
    "d", "p.m", "p.m.", "h.c", "h.c.", "s.m.", "c.m.", "l.m.", "s.",
}


NUM_METRE_LOOSE = re.compile(r"^\d{1,4}(?:\.{1,2}\d{1,4})+(?:\.[A-Za-z]{1,6})?$")


def normalise(text: str) -> str:
    for ch in APOSTROPHES:
        text = text.replace(ch, "'")
    for ch in QUOTES:
        text = text.replace(ch, '"')
    for ch in DASHES:
        text = text.replace(ch, "-")
    text = re.sub(r"\s+", " ", text)
    # OCR writes some metre dots as commas: "6,4.6.4" -> "6.4.6.4".
    text = re.sub(r"(?<=\d),(?=\d)", ".", text)
    return text


def is_metreish(tok: str) -> bool:
    t = tok.strip(".,;:")
    low = t.lower()
    if low in METRE_WORDS or tok.lower() in METRE_WORDS:
        return True
    if LETTER_METRE.match(t) or NUM_METRE_LOOSE.match(t) or SYLL_METRE.match(t):
        return True
    return False


def is_dynamic(tok: str) -> bool:
    low = tok.lower().strip(".")
    if low in DYNAMICS:
        return True
    # merged markers like "f.di", "f.cr", "mp.mf"
    parts = low.split(".")
    return len(parts) > 1 and all(part in DYNAMICS for part in parts if part)


# --- structures ------------------------------------------------------------


@dataclass
class Stanza:
    number: int | None
    lines: list[str]


@dataclass
class Hymn:
    number: int
    title: str
    section: str | None
    scripture: str | None
    stanzas: list[Stanza] = field(default_factory=list)


def find_scripture(tokens: list[str], start: int, limit: int) -> int | None:
    """Index of a chapter:verse token within [start, start+limit), or None."""
    for i in range(start, min(len(tokens), start + limit)):
        if CHAP_VERSE.search(tokens[i]):
            return i
    return None


MAX_GAP = 40  # tolerate this many OCR-dropped hymn numbers in a row


def looks_like_header(tokens: list[str], i: int, last: int) -> int | None:
    """If tokens[i] starts the next hymn n (last < n <= last+MAX_GAP), return n.

    Detection is structural, not tied to a rigid counter: a bare integer with a
    scripture reference close after it (see below). Basing it on the last
    accepted number, not an expected one, lets parsing recover when OCR drops a
    hymn number entirely.
    """
    m = re.match(r"^(\d{1,4})\.?$", tokens[i])
    if not m:
        return None
    n = int(m.group(1))
    if n <= last or n > last + MAX_GAP:
        return None
    # A scripture reference shortly after is the reliable signal: verse text
    # never carries a chapter:verse, while every hymn header does. A metre right
    # after is only a secondary hint (OCR frequently mangles or drops it), so it
    # is not required. This recovers hymns whose metre is malformed or absent.
    sc = find_scripture(tokens, i + 1, 45)
    if sc is None:
        return None
    # A hymn header runs number -> metre -> title -> scripture with no hymn
    # boundary in between. A verse-number marker near a hymn's end would match
    # the NEXT hymn's scripture, so reject when an Amin before the ref is
    # followed by a fresh hymn number or metre (a real boundary). An Amin that
    # is part of a quoted doxology in the epigraph (".. for ever. Amin. Ifi 1:5")
    # is followed by the scripture itself, not a boundary, so it is allowed.
    for a in range(i + 1, sc):
        if tokens[a].lower() not in AMEN:
            continue
        for b in range(a + 1, min(sc, a + 4)):
            nm = re.match(r"^(\d{1,4})\.?$", tokens[b])
            if (nm and int(nm.group(1)) > last) or is_metreish(tokens[b]):
                return None
    return n


def split_stanzas(tokens: list[str]) -> list[Stanza]:
    """Split a hymn body (already past the scripture ref) into stanzas."""
    stanzas: list[Stanza] = []
    current_num: int | None = None
    words: list[str] = []

    def flush() -> None:
        if not words:
            return
        text = " ".join(words).strip(" ,;-")
        text = re.sub(r"\s+", " ", text)
        if text:
            stanzas.append(Stanza(number=current_num, lines=chunk_line(text)))

    idx = 0
    while idx < len(tokens):
        tok = tokens[idx]
        stripped = tok.strip(".,!?;:\"'-")
        # Drop page-number tokens (bare integers > 30; no hymn has that many
        # verses), stray all-caps heading/banner words, and lone refrain markers
        # ("&", "Ref") that OCR left inside the verse flow, so none leaks into a
        # stanza or the title.
        if stripped.isdigit() and int(stripped) > 30:
            idx += 1
            continue
        if stripped.isalpha() and stripped.isupper() and len(stripped) >= 4:
            idx += 1
            continue
        if tok == "&" or stripped.lower() in ("ref", "refrain"):
            idx += 1
            continue
        # A bare small integer (optionally with a trailing dot) starts a stanza.
        m = re.match(r"^(\d{1,2})\.?$", tok)
        if m and 1 <= int(m.group(1)) <= 30:
            flush()
            words = []
            n = int(m.group(1))
            current_num = n if 1 <= n <= 50 else None
            idx += 1
            # Skip any dynamic markers right after the number.
            while idx < len(tokens) and is_dynamic(tokens[idx]):
                idx += 1
            continue
        if is_dynamic(tok):
            idx += 1
            continue
        words.append(tok)
        idx += 1
    flush()
    return stanzas


def chunk_line(text: str) -> list[str]:
    """Keep a stanza as one line unless it exceeds the 500-char schema cap."""
    if len(text) <= 500:
        return [text]
    out: list[str] = []
    cur = ""
    for word in text.split(" "):
        if len(cur) + len(word) + 1 > 500:
            out.append(cur.strip())
            cur = word
        else:
            cur = f"{cur} {word}".strip()
    if cur:
        out.append(cur.strip())
    return out


def first_line_title(stanzas: list[Stanza], number: int) -> str:
    """Title a hymn by the first line of its first verse (first eight words)."""
    for s in stanzas:
        if s.lines and s.lines[0].strip():
            words = s.lines[0].split()
            title = " ".join(words[:8]).strip(" ,;:-\"'")
            return (title or f"Hymn {number}")[:120]
    return f"Hymn {number}"


def parse(text: str) -> tuple[list[Hymn], list[int]]:
    tokens = normalise(text).split()
    headers: list[tuple[int, int]] = []  # (token index, hymn number)
    last = 0
    i = 0
    while i < len(tokens):
        n = looks_like_header(tokens, i, last)
        if n is not None:
            headers.append((i, n))
            last = n
            i += 1
            continue
        i += 1

    hymns: list[Hymn] = []
    for h, (start, number) in enumerate(headers):
        end = headers[h + 1][0] if h + 1 < len(headers) else len(tokens)
        body = tokens[start:end]

        sc = find_scripture(body, 1, 45)
        if sc is None:
            continue

        # Section banners are left off: only four (ORIN OWURO/ALE/IYIN, ITAN ORI
        # AGBELEBU) survived OCR, so most of the book's topical sections are
        # unmarked. Tagging from the few that survived would mislabel hundreds of
        # hymns, so sections are added during the proofing pass instead.
        section = None

        # The text between the metre and the reference is the scripture epigraph,
        # not a hymn title, so it is dropped and the hymn is titled by the first
        # line of verse 1 (the conventional way hymns are named).
        scripture = " ".join(body[max(1, sc - 3):sc + 1]).strip()
        verse_tokens = body[sc + 1:]
        for k, tok in enumerate(verse_tokens):
            if tok.lower() in AMEN:
                verse_tokens = verse_tokens[:k]
                break
        stanzas = split_stanzas(verse_tokens)
        title = first_line_title(stanzas, number)
        hymns.append(Hymn(number, title, section, scripture, stanzas))

    numbers = {h.number for h in hymns}
    highest = max(numbers) if numbers else 0
    missing = [n for n in range(1, highest + 1) if n not in numbers]
    return hymns, missing


def to_json(hymns: list[Hymn]) -> dict:
    entries = []
    for h in hymns:
        stanzas = [
            {"number": s.number, "kind": "verse", "lines": s.lines}
            for s in h.stanzas
            if s.lines
        ]
        if not stanzas:
            stanzas = [{"number": 1, "kind": "verse", "lines": [h.title]}]
        entry = {
            "number": h.number,
            "title": h.title[:300],
            "texts": [{"language": "yo", "title": h.title[:300], "stanzas": stanzas[:60]}],
        }
        if h.section:
            entry["section"] = h.section[:120]
        entries.append(entry)
    return {
        "hymnal": {
            "slug": "cac-hymnal",
            "title": "Christ Apostolic Church Hymnal (Yoruba)",
            "publisher": "Christ Apostolic Church",
            "description": (
                "The Yoruba hymnal of the Christ Apostolic Church, used with permission. "
                "NEEDS REVIEW: parsed from OCR; Yoruba diacritics are missing and some "
                "words are split incorrectly. A Yoruba speaker must proofread before use."
            ),
            "rightsStatus": "used-by-permission",
        },
        "source": {
            "slug": "cac-official",
            "name": "Christ Apostolic Church (contributed with permission)",
            "license": "Used by permission of the Christ Apostolic Church, which retains all rights.",
            "rightsStatus": "used-by-permission",
            "notes": (
                "Yoruba text only, pending the English edition. Parsed from OCR by "
                "scripts/parse-cac-hymnal.py; needs a Yoruba-language proofread to "
                "restore diacritics and correct OCR word-splits. Hymns are titled by "
                "the first line of verse 1; scripture epigraphs and section banners "
                "were dropped (mostly lost in OCR) and can be re-added while proofing. "
                "The church may request removal at any time."
            ),
        },
        "entries": entries,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="src", default="api/data/cac-yoruba.txt")
    ap.add_argument("--out", dest="dst", default="api/data/cac-hymnal.json")
    args = ap.parse_args()

    with open(args.src, encoding="utf-8") as fh:
        text = fh.read()
    hymns, missing = parse(text)
    data = to_json(hymns)
    with open(args.dst, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)

    bilingual = 0
    total_stanzas = sum(len(h.stanzas) for h in hymns)
    print(f"parsed hymns: {len(hymns)}")
    print(f"total stanzas: {total_stanzas}")
    if hymns:
        print(f"highest number: {max(h.number for h in hymns)}")
    print(f"missing numbers ({len(missing)}): {missing[:40]}{' ...' if len(missing) > 40 else ''}")
    print(f"wrote: {args.dst}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

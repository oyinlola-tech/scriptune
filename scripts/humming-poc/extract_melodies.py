#!/usr/bin/env python3
"""Pull the tonic sol-fa melodies out of the CCC hymnal PDF as semitone sequences.

Usage: python extract_melodies.py [../../api/data/ccc-hymnal.pdf] [data/melodies.json]

Only the Yoruba (left) column is read, since the English column repeats the same
notation. The PDF has no octave marks, so octaves are chosen for the whole line
at once: the smallest total leaps, kept inside a typical hymn range (low s to
high m). A "-" holds the previous note for one more beat.
"""
import importlib.util
import json
import re
import sys
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
_spec = importlib.util.spec_from_file_location("ccc", ROOT / "scripts" / "parse-ccc-hymnal.py")
ccc = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ccc)

# Movable-do semitones above the tonic. Sharpened: de ri/re fe se le; flattened: ma/me ta/ba.
SEMITONES = {
    "d": 0, "de": 1, "r": 2, "re": 3, "ri": 3, "me": 3, "ma": 3, "m": 4, "f": 5, "fe": 6,
    "s": 7, "se": 8, "l": 9, "le": 10, "ta": 10, "ba": 10, "t": 11,
}
TOKEN = re.compile(r"(de|re|ri|me|ma|fe|se|le|ta|ba|[drmfslt])|([-–—])", re.IGNORECASE)
# Lowest and highest semitone a note may take: low s (-5) to high m (16).
RANGE = (-5, 16)
ORIN = re.compile(r"^\s{0,6}Orin\s+(\d+)\b")
HYMN = re.compile(r"\bHymn\s+(\d+)\b")
# The left column never starts this far in; deeper lines belong to the English side only.
LEFT_INDENT = 12


def left_column(line: str) -> str:
    if len(line) - len(line.lstrip()) > LEFT_INDENT:
        return ""
    return re.split(r"\s{4,}", line.strip())[0]


def parse_notes(text: str) -> list[list[float]]:
    """"d;- r; t;" -> [[syllable, beats], ...]."""
    text = ccc.SOLFA_LABEL.sub("", text, count=1)
    notes: list[list] = []
    for match in TOKEN.finditer(text):
        if match.group(2):
            if notes:
                notes[-1][1] += 1
        else:
            notes.append([match.group(1).lower(), 1])
    return notes


def to_pitches(notes: list[list]) -> list[list[float]]:
    """Syllables -> [semitone, beats], choosing octaves that minimise total leap size."""
    options = []
    for syllable, _ in notes:
        base = SEMITONES[syllable]
        options.append([base + 12 * k for k in (-1, 0, 1) if RANGE[0] <= base + 12 * k <= RANGE[1]])
    # Viterbi over octave choices: cost is the sum of absolute intervals.
    cost = {p: 0.0 for p in options[0]}
    back: list[dict[int, int]] = []
    for choices in options[1:]:
        step = {p: min(cost, key=lambda q: cost[q] + abs(p - q)) for p in choices}
        cost = {p: cost[q] + abs(p - q) for p, q in step.items()}
        back.append(step)
    pitch = min(cost, key=cost.get)
    path = [pitch]
    for step in reversed(back):
        pitch = step[pitch]
        path.append(pitch)
    path.reverse()
    return [[p, beats] for p, (_, beats) in zip(path, notes)]


def extract(pdf_path: str) -> dict[int, list[list[float]]]:
    reader = PdfReader(pdf_path)
    current = None
    raw: dict[int, list[list]] = {}
    for page in reader.pages:
        for line in page.extract_text(extraction_mode="layout").splitlines():
            marker = ORIN.search(line)
            hymn = HYMN.search(line)
            if marker:
                current = int(marker.group(1))
                continue
            if hymn and (current is None or int(hymn.group(1)) > current):
                current = int(hymn.group(1))
                continue
            if current is None:
                continue
            column = left_column(line)
            if column and ccc.is_solfa(column):
                raw.setdefault(current, []).extend(parse_notes(column))
    return {number: to_pitches(notes) for number, notes in raw.items() if len(notes) >= 8}


def titles() -> dict[int, str]:
    path = ROOT / "api" / "data" / "ccc-hymnal.json"
    if not path.exists():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    out = {}
    for entry in data["entries"]:
        english = next((t["title"] for t in entry["texts"] if t["language"] == "en"), entry["title"])
        out[entry["number"]] = english
    return out


def main() -> None:
    pdf_path = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / "api" / "data" / "ccc-hymnal.pdf")
    out_path = Path(sys.argv[2] if len(sys.argv) > 2 else Path(__file__).parent / "data" / "melodies.json")
    melodies = extract(pdf_path)
    names = titles()
    records = [
        {"id": f"ccc-{n}", "number": n, "title": names.get(n, ""), "notes": notes}
        for n, notes in sorted(melodies.items())
    ]
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(records, ensure_ascii=False, indent=1), encoding="utf-8")
    lengths = sorted(len(r["notes"]) for r in records)
    print(f"{len(records)} melodies -> {out_path} (median {lengths[len(lengths) // 2]} notes)")


if __name__ == "__main__":
    main()

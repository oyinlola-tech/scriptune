# Humming recognition proof of concept

Offline experiment: hum a CCC hymn, get the likely hymn numbers back. Not wired
into the app. Melodies come from the tonic sol-fa printed in the CCC hymnal PDF
(`api/data/ccc-hymnal.pdf`, used by permission, local only).

```
extract_melodies.py  PDF sol-fa -> data/melodies.json (412 hymns, semitones + beats)
pitch.py             audio -> pYIN pitch -> median-centred semitone contour
match.py             subsequence DTW over all melodies, key offsets + tempo scales
synth_hums.py        fake hums for smoke tests (data/synth/)
evaluate.py          top-1 / top-5 hit rate over a folder of labelled hums
```

## Setup

```bash
cd scripts/humming-poc
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python extract_melodies.py
```

## Try it

```bash
.venv/bin/python match.py my-hum.wav
.venv/bin/python synth_hums.py --count 40 && .venv/bin/python evaluate.py
```

Synthetic baseline (40 hums, 8-16 notes, random key/tempo/wobble/noise):
**top-1 68%, top-5 90%, ~2.3 s per hum** on CPU. Real hums will score lower.

## Recording real hums (the number that matters)

Put phone recordings in `hums/` (git-ignored), named after the hymn:
`ccc-50__ade.m4a`, `ccc-50__tola.wav`, `ccc-1__ade.wav`. Then:

```bash
.venv/bin/python evaluate.py hums
```

- 10-20 seconds each, any key, any speed; start wherever you like.
- "mmm" or "da da da" both work. A quiet room helps but isn't required.
- Several people and several hymns beat many takes of one hymn.
- Only hymns in `data/melodies.json` can be matched (`grep '"number": 50,'`).

## Known limits

- The sol-fa has no octave marks; octaves are guessed (smallest leaps, low s to high m).
- Most hymns only print the opening phrase or chorus, so humming a later line may miss.
- Rhythm in the PDF is approximate; OCR errors in the notation show up as misses.
- Identical tunes (e.g. 4/903, 69/774/877) are counted as the same answer.

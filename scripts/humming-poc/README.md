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
**top-1 68%, top-3 80%, top-5 90%, ~2 s per hum** on CPU. Real hums will score lower.

`synth_hums.py --none 40` adds made-up tunes that are not in the index. On those
(40 real + 40 none, synthetic), the raw DTW cost can't tell matches from
non-matches, but relative scores can (AUC, 0.5 = coin flip, 1.0 = perfect):

| feature | AUC | at ~75% of right answers kept |
|---|---|---|
| raw cost | 0.55 | 92% of wrong answers and 50% of none hums still shown |
| margin (#2 minus #1, different tunes) | 0.90 | 0% wrong, 10% none shown |
| z (median minus #1, over MAD) | 0.92 | 31% wrong, 10% none shown |
| margin >= 0.05 and z >= 2.45 | - | 81% kept, 0% wrong, 8% none shown |

`evaluate.py` applies a confidence rule (default `--margin 0.05 --z 2.45`) and
labels every hum CORRECT ACCEPT, FALSE REJECT, WRONG ACCEPT, WRONG REJECT,
NONE ACCEPT or NONE REJECT. The product number is **precision when confident**
(correct accepts / everything shown): 85% (22 of 26) on the synthetic set, with
81% of right answers kept. It also breaks results down by voiced duration.

Thresholds were picked on the same hums they were scored on, so treat them as
optimistic until checked on real recordings. Short hums are the main weakness:
top-1 is about 50% under 8 s of voiced audio and 83% at 12 s or more.

## Synthetic regression check

The synthetic set is regenerated exactly from fixed seeds (the audio lives in
git-ignored `data/synth/`). After any change, rebuild and compare with the
baseline below; it answers "did I break the matcher?", not "does it work for
people?".

```bash
rm -rf data/synth
.venv/bin/python synth_hums.py --count 40             # seed 7: 40 indexed hums
.venv/bin/python synth_hums.py --count 0 --none 40 --seed 11
.venv/bin/python evaluate.py --quiet
```

Baseline (frozen matcher, `--margin 0.05 --z 2.45`):

| top-1 | top-3 | top-5 | AUC cost / margin / z | shown | precision when confident | right kept | wrong shown | none shown |
|---|---|---|---|---|---|---|---|---|
| 68% | 80% | 90% | 0.55 / 0.90 / 0.92 | 26 | 85% (22/26) | 81% | 0 of 13 | 4 of 40 |

## Recording real hums (the number that matters)

Put phone recordings in `hums/` (git-ignored), named
`<hymn id or none>__<person>[_anything].<ext>`: `ccc-50__ade.m4a`,
`ccc-50__tola_2.wav`, `none__ade_popsong.m4a`. The person is only used for a
per-person breakdown in the report; the matcher never sees the filename. Then:

```bash
.venv/bin/python evaluate.py hums
```

- 10-20 seconds each, any key, any speed; start wherever you like.
- "mmm" or "da da da" both work. A quiet room helps but isn't required.
- Several people and several hymns beat many takes of one hymn.
- Also record 5-10 hums of tunes **not** in the index (a hymn without sol-fa,
  a worship or pop song, random humming) and name them `none__<person>.wav`.
  These measure false positives.
- Only hymns in `data/melodies.json` can be matched (`grep '"number": 50,'`).

## Known limits

- The sol-fa has no octave marks; octaves are guessed (smallest leaps, low s to high m).
- Most hymns only print the opening phrase or chorus, so humming a later line may miss.
- Rhythm in the PDF is approximate; OCR errors in the notation show up as misses.
- Identical tunes (e.g. 4/903, 69/774/877) are counted as the same answer.

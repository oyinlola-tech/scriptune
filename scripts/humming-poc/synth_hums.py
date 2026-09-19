#!/usr/bin/env python3
"""Make fake hums from the reference melodies to smoke-test the pipeline.

Usage: python synth_hums.py [--count 100] [--none 20] [--out data/synth] [--seed 7]

Each hum is an excerpt (often from the start, sometimes mid-tune) in a random
key and tempo, with uneven note lengths, pitch wobble, drift, the odd wrong
note, breaths between notes and background noise. Real people are still messier
than this, so treat the scores as an upper bound.

--none adds "none__" hums of made-up stepwise tunes that are not in the index,
for checking false positives.
"""
import argparse
import json
from pathlib import Path

import numpy as np
import soundfile as sf

from match import MELODIES
from pitch import SAMPLE_RATE


def hum(notes: list[list[float]], rng: np.random.Generator) -> np.ndarray:
    count = int(rng.integers(8, 17))
    start = 0 if rng.random() < 0.5 or len(notes) <= count else int(rng.integers(0, len(notes) - count))
    excerpt = notes[start : start + count]

    tonic = rng.uniform(48, 62)  # C3..D4 in MIDI, men and women
    seconds_per_beat = 60 / rng.uniform(60, 120)
    drift = rng.uniform(-0.6, 0.6)  # semitones over the whole hum

    pitch_track, gate = [], []
    for k, (pitch, beats) in enumerate(excerpt):
        length = int(SAMPLE_RATE * beats * seconds_per_beat * rng.lognormal(0, 0.15))
        sung = pitch + rng.normal(0, 0.3)
        if rng.random() < 0.05:
            sung += rng.choice([-2, -1, 1, 2])
        t = np.arange(length) / SAMPLE_RATE
        vibrato = 0.15 * np.sin(2 * np.pi * 5.5 * t + rng.uniform(0, 6.3))
        pitch_track.append(tonic + sung + drift * k / len(excerpt) + vibrato)
        envelope = np.ones(length)
        ramp = min(int(0.03 * SAMPLE_RATE), length // 4)
        envelope[:ramp] = np.linspace(0, 1, ramp)
        envelope[-ramp:] = np.linspace(1, 0, ramp)
        gate.append(envelope)
        if rng.random() < 0.3:  # breath
            gap = int(SAMPLE_RATE * rng.uniform(0.05, 0.25))
            pitch_track.append(np.full(gap, tonic + sung))
            gate.append(np.zeros(gap))

    midi = np.concatenate(pitch_track)
    midi = np.convolve(midi, np.ones(480) / 480, mode="same")  # ~30 ms glides between notes
    freq = 440 * 2 ** ((midi - 69) / 12)
    phase = 2 * np.pi * np.cumsum(freq) / SAMPLE_RATE
    tone = sum(np.sin(h * phase) / h**1.5 for h in range(1, 7))  # closed-mouth "mmm"
    signal = tone * np.concatenate(gate)
    signal /= np.abs(signal).max()

    snr_db = rng.uniform(12, 25)
    noise = rng.normal(0, 1, len(signal))
    noise *= np.sqrt(np.mean(signal**2) / np.mean(noise**2) / 10 ** (snr_db / 10))
    lead = np.zeros(int(SAMPLE_RATE * rng.uniform(0.2, 0.8)))
    return 0.8 * np.concatenate([lead, signal, lead]) + np.concatenate([lead * 0, noise, lead * 0])


def random_tune(rng: np.random.Generator) -> list[list[float]]:
    """A hymn-like made-up tune: mostly steps, some small leaps, within an octave and a half."""
    steps = rng.choice([-2, -1, 0, 1, 2, -3, 3, -4, 4, -5, 5], size=24,
                       p=[.18, .12, .14, .12, .18, .05, .05, .04, .04, .04, .04])
    pitches = np.clip(np.cumsum(steps), -5, 16)
    return [[float(p), int(rng.choice([1, 1, 1, 2, 2, 3]))] for p in pitches]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=100)
    parser.add_argument("--none", type=int, default=0)
    parser.add_argument("--out", default=str(Path(__file__).parent / "data" / "synth"))
    parser.add_argument("--seed", type=int, default=7)
    args = parser.parse_args()
    rng = np.random.default_rng(args.seed)
    records = json.loads(MELODIES.read_text(encoding="utf-8"))
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    for k in range(args.count):
        record = records[int(rng.integers(len(records)))]
        sf.write(out / f"{record['id']}__{k:03d}.wav", hum(record["notes"], rng), SAMPLE_RATE)
    for k in range(args.none):
        sf.write(out / f"none__{k:03d}.wav", hum(random_tune(rng), rng), SAMPLE_RATE)
    print(f"{args.count} hums + {args.none} none__ hums -> {out}")


if __name__ == "__main__":
    main()

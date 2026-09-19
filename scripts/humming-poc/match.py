#!/usr/bin/env python3
"""Rank hymn melodies against a hummed recording with subsequence DTW.

Usage: python match.py recording.wav [--top 5]

The hum can start anywhere in the reference and be faster or slower (step
pattern allows slopes 1/2..2, plus a few global tempo scales). Key is removed by
median-centring both sides and trying half-semitone offsets (an excerpt's
median can sit a few semitones off the whole tune's).
"""
import argparse
import json
import time
from pathlib import Path

import numpy as np

from pitch import QUERY_FPS, contour, load

MELODIES = Path(__file__).parent / "data" / "melodies.json"
FRAMES_PER_BEAT = 2
NOMINAL_BPM = 90
TEMPO_SCALES = (0.6, 1.0, 1.6)
OFFSETS = np.arange(-7, 7.01, 0.5, dtype=np.float32)
BUCKETS = 6  # references are grouped by length so short tunes aren't padded to the longest
COST_CAP = 4.0  # one bad frame can't cost more than this
PAD = 1e3  # cost of a padded (non-existent) reference frame


class Matcher:
    def __init__(self, path: Path = MELODIES):
        self.records = json.loads(path.read_text(encoding="utf-8"))
        refs = [reference_frames(r["notes"]) for r in self.records]
        # Buckets of similar-length references, each padded only to its own longest.
        self.buckets = []
        for chunk in np.array_split(np.argsort([len(r) for r in refs]), BUCKETS):
            width = max(len(refs[k]) for k in chunk)
            block = np.full((len(chunk), width), np.nan, dtype=np.float32)
            for row, k in enumerate(chunk):
                block[row, : len(refs[k])] = refs[k]
            self.buckets.append((chunk, block))
        # Identical melodies (shared tunes) all count as the same answer.
        self.tune = {}
        for r in self.records:
            key = tuple(p for p, _ in r["notes"])
            self.tune.setdefault(key, []).append(r["id"])

    def same_tune(self, record_id: str) -> list[str]:
        record = next(r for r in self.records if r["id"] == record_id)
        return self.tune[tuple(p for p, _ in record["notes"])]

    def rank(self, query: np.ndarray, top: int = 5) -> list[tuple[dict, float]]:
        best = np.full(len(self.records), np.inf)
        for scale in TEMPO_SCALES:
            length = round(len(query) * FRAMES_PER_BEAT * NOMINAL_BPM / 60 / QUERY_FPS * scale)
            if length < 4:
                continue
            resampled = np.interp(np.linspace(0, len(query) - 1, length), np.arange(len(query)), query)
            resampled = resampled.astype(np.float32)
            for chunk, block in self.buckets:
                best[chunk] = np.minimum(best[chunk], subsequence_dtw(resampled, block))
        order = np.argsort(best)[:top]
        return [(self.records[k], float(best[k])) for k in order]


def reference_frames(notes: list[list[float]]) -> np.ndarray:
    pitches = np.array([p for p, _ in notes], dtype=float)
    beats = np.array([b for _, b in notes], dtype=int)
    frames = np.repeat(pitches, beats * FRAMES_PER_BEAT)
    return frames - np.median(frames)


def subsequence_dtw(query: np.ndarray, refs: np.ndarray) -> np.ndarray:
    """Best average frame cost of `query` against any stretch of each row of `refs`.

    Steps (1,1), (1,2), (2,1): every query frame is paid for exactly once, so the
    total divided by len(query) is comparable across references.
    """
    shifted = refs[:, None, :] + OFFSETS[None, :, None]  # (refs, offsets, frames)
    padding = np.isnan(shifted)
    shifted = np.where(padding, 0, shifted)

    def cost(i: int) -> np.ndarray:
        c = np.minimum(np.abs(query[i] - shifted), COST_CAP)
        c[padding] = PAD
        return c

    prev2 = None
    cost_prev = cost(0)
    prev = cost_prev  # free start anywhere in the reference
    for i in range(1, len(query)):
        c = cost(i)
        step = np.full_like(prev, np.inf)
        step[..., 1:] = prev[..., :-1]
        step[..., 2:] = np.minimum(step[..., 2:], prev[..., :-2])
        if prev2 is not None:
            step[..., 1:] = np.minimum(step[..., 1:], prev2[..., :-1] + cost_prev[..., 1:])
        prev2, prev, cost_prev = prev, c + step, c
    return prev.min(axis=(1, 2)) / len(query)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("recording")
    parser.add_argument("--top", type=int, default=5)
    args = parser.parse_args()
    started = time.perf_counter()
    query = contour(load(args.recording))
    if len(query) < 10:
        print("Not enough hummed pitch found in the recording.")
        return
    matcher = Matcher()
    for rank, (record, score) in enumerate(matcher.rank(query, args.top), 1):
        print(f"{rank}. CCC {record['number']:>3}  {record['title']:<45} cost {score:.2f}")
    print(f"({time.perf_counter() - started:.1f}s, {len(query) / QUERY_FPS:.1f}s of voiced audio)")


if __name__ == "__main__":
    main()

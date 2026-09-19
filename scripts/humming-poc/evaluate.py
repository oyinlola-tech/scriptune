#!/usr/bin/env python3
"""Score a folder of hums: how often is the right hymn first, top 3 or top 5?

Usage: python evaluate.py [data/synth] [--limit N]

Name each file after the hymn it is, e.g. "ccc-12__ade.wav" or "ccc-12_1.wav".
Hymns that share a tune with the right one also count as correct.

Name hums of tunes that are NOT in the index "none__<anything>.wav" (a hymn with
no sol-fa, a pop song, random humming). Their best cost is compared with the
best cost of real hums to show where a "no confident match" threshold could sit.
"""
import argparse
import re
import time
from pathlib import Path

import numpy as np

from match import Matcher
from pitch import contour, load

AUDIO = {".wav", ".flac", ".ogg", ".mp3", ".m4a", ".aac", ".webm"}


def spread(costs: list[float]) -> str:
    if not costs:
        return "none"
    low, q25, mid, q75, high = np.percentile(costs, [0, 25, 50, 75, 100])
    return f"min {low:.2f}  25% {q25:.2f}  median {mid:.2f}  75% {q75:.2f}  max {high:.2f}"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("folder", nargs="?", default=str(Path(__file__).parent / "data" / "synth"))
    parser.add_argument("--limit", type=int)
    args = parser.parse_args()
    files = sorted(p for p in Path(args.folder).iterdir() if p.suffix.lower() in AUDIO)[: args.limit]
    matcher = Matcher()
    known = {r["id"] for r in matcher.records}

    hits = {1: 0, 3: 0, 5: 0}
    scored = 0
    seconds = 0.0
    misses = []
    correct_costs, wrong_costs, none_costs = [], [], []
    for path in files:
        is_none = path.name.startswith("none__")
        label = re.match(r"(ccc-\d+)", path.name)
        if not is_none and (not label or label.group(1) not in known):
            print(f"skip {path.name}: name must start with a known id like ccc-12, or with none__")
            continue
        started = time.perf_counter()
        query = contour(load(str(path)))
        ranked = matcher.rank(query) if len(query) >= 10 else []
        seconds += time.perf_counter() - started
        if not ranked:
            print(f"skip {path.name}: not enough hummed pitch found")
            continue
        best = ranked[0][1]
        if is_none:
            none_costs.append(best)
            continue

        truth = set(matcher.same_tune(label.group(1)))
        ids = [record["id"] for record, _ in ranked]
        scored += 1
        for k in hits:
            hits[k] += bool(truth & set(ids[:k]))
        (correct_costs if ids[0] in truth else wrong_costs).append(best)
        if ids[0] not in truth:
            where = next((k + 1 for k, i in enumerate(ids) if i in truth), None)
            misses.append(f"  {path.name}: got {ids[:3]}, right answer {'#' + str(where) if where else 'not in top 5'}")

    count = scored + len(none_costs)
    if not count:
        return
    print(f"{count} hums ({scored} in index, {len(none_costs)} none) | {seconds / count:.1f}s each")
    if scored:
        print(" | ".join(f"top-{k} {hits[k] / scored:.0%}" for k in hits))
    print("\nbest cost (lower = closer match)")
    print(f"  right hymn first : {spread(correct_costs)}")
    print(f"  wrong hymn first : {spread(wrong_costs)}")
    print(f"  none__ hums      : {spread(none_costs)}")

    if correct_costs and none_costs:
        print("\nif results above a cost threshold were shown as 'no confident match':")
        for threshold in np.percentile(correct_costs, [50, 75, 90, 100]):
            kept = np.mean(np.array(correct_costs) <= threshold)
            fooled = np.mean(np.array(none_costs) <= threshold)
            print(f"  threshold {threshold:.2f}: keeps {kept:.0%} of right answers, "
                  f"none__ hums still matched {fooled:.0%} (false positives)")
    if misses:
        print("\nnot first:")
        print("\n".join(misses))


if __name__ == "__main__":
    main()

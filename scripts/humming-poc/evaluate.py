#!/usr/bin/env python3
"""Score a folder of hums: ranking accuracy, and whether a match can be trusted.

Usage: python evaluate.py [data/synth] [--limit N] [--quiet]

Name each file after the hymn it is, e.g. "ccc-12__ade.wav" or "ccc-12_1.wav".
Hymns that share a tune with the right one also count as correct.
Name hums of tunes that are NOT in the index "none__<anything>.wav".

Every hum ends up in one of three groups:
  RIGHT  in the index, right hymn ranked first   -> should be shown
  WRONG  in the index, wrong hymn ranked first   -> better rejected
  NONE   not in the index                        -> should be rejected

Confidence features, higher = more sure (raw cost is negated so it reads the same way):
  cost    -(best DTW cost)
  margin  2nd-best cost (a different tune) minus best cost
  z       (median cost - best cost) / MAD over all references: how far the
          winner stands out from the whole index (median/MAD, not mean/std,
          because DTW costs have outliers)
The same hums pick the thresholds and are scored on them, so the reject tables
are optimistic; confirm on a separate set before trusting a threshold.
"""
import argparse
import re
import time
from pathlib import Path

import numpy as np

from match import Matcher
from pitch import QUERY_FPS, contour, load

AUDIO = {".wav", ".flac", ".ogg", ".mp3", ".m4a", ".aac", ".webm"}
FEATURES = ("cost", "margin", "z")
TARGETS = (0.9, 0.75, 0.5)  # share of RIGHT hums a rule must still accept


def features(matcher: Matcher, costs: np.ndarray) -> dict:
    order = np.argsort(costs)
    first = order[0]
    winner_tune = set(matcher.same_tune(matcher.records[first]["id"]))
    second = next(k for k in order[1:] if matcher.records[k]["id"] not in winner_tune)
    median = np.median(costs)
    mad = 1.4826 * np.median(np.abs(costs - median)) or 1e-9
    return {
        "ids": [matcher.records[k]["id"] for k in order[:5]],
        "best": costs[first],
        "second": costs[second],
        "cost": -costs[first],
        "margin": costs[second] - costs[first],
        "z": (median - costs[first]) / mad,
    }


def auc(good: np.ndarray, bad: np.ndarray) -> float:
    """Chance a random RIGHT hum scores higher than a random rejectable one (0.5 = useless)."""
    if not len(good) or not len(bad):
        return float("nan")
    diff = good[:, None] - bad[None, :]
    return float(np.mean(diff > 0) + 0.5 * np.mean(diff == 0))


def rates(accept: np.ndarray, group: np.ndarray) -> str:
    def share(name: str) -> str:
        members = group == name
        return f"{np.mean(accept[members]):>4.0%}" if members.any() else "   -"
    return f"RIGHT kept {share('RIGHT')} | WRONG shown {share('WRONG')} | NONE shown {share('NONE')}"


def decision_tables(rows: list[dict]) -> None:
    group = np.array([r["group"] for r in rows])
    values = {f: np.array([r[f] for r in rows]) for f in FEATURES}
    right = group == "RIGHT"
    if not right.any() or right.all():
        return

    print("\nseparation (AUC, RIGHT vs WRONG+NONE; 0.5 = coin flip, 1.0 = perfect)")
    for f in FEATURES:
        print(f"  {f:<7} {auc(values[f][right], values[f][~right]):.2f}")

    print("\nreject rules: show a match only when the feature is above a threshold")
    for f in FEATURES:
        print(f"  {f} only")
        for target in TARGETS:
            threshold = np.quantile(values[f][right], 1 - target)
            accept = values[f] >= threshold
            print(f"    {f} >= {threshold:6.2f}   {rates(accept, group)}")

    print("  margin AND z (best pair from a grid; fewest WRONG/NONE shown)")
    grid_m = np.quantile(values["margin"][right], np.linspace(0, 0.6, 13))
    grid_z = np.quantile(values["z"][right], np.linspace(0, 0.6, 13))
    for target in TARGETS:
        best = None
        for m in grid_m:
            for z in grid_z:
                accept = (values["margin"] >= m) & (values["z"] >= z)
                if np.mean(accept[right]) < target - 1e-9:
                    continue
                bad = np.mean(accept[~right])
                if best is None or bad < best[0]:
                    best = (bad, m, z, accept)
        if best:
            _, m, z, accept = best
            print(f"    margin >= {m:.2f}, z >= {z:5.2f}   {rates(accept, group)}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("folder", nargs="?", default=str(Path(__file__).parent / "data" / "synth"))
    parser.add_argument("--limit", type=int)
    parser.add_argument("--quiet", action="store_true", help="skip the per-hum table")
    args = parser.parse_args()
    files = sorted(p for p in Path(args.folder).iterdir() if p.suffix.lower() in AUDIO)[: args.limit]
    matcher = Matcher()
    known = {r["id"] for r in matcher.records}

    rows = []
    seconds = 0.0
    for path in files:
        is_none = path.name.startswith("none__")
        label = re.match(r"(ccc-\d+)", path.name)
        if not is_none and (not label or label.group(1) not in known):
            print(f"skip {path.name}: name must start with a known id like ccc-12, or with none__")
            continue
        started = time.perf_counter()
        query = contour(load(str(path)))
        if len(query) < 10:
            print(f"skip {path.name}: not enough hummed pitch found")
            continue
        row = features(matcher, matcher.scores(query))
        seconds += time.perf_counter() - started
        row["name"] = path.name
        row["voiced"] = len(query) / QUERY_FPS
        if is_none:
            row["group"], row["where"] = "NONE", None
        else:
            truth = set(matcher.same_tune(label.group(1)))
            row["where"] = next((k + 1 for k, i in enumerate(row["ids"]) if i in truth), None)
            row["group"] = "RIGHT" if row["where"] == 1 else "WRONG"
        rows.append(row)

    if not rows:
        return
    indexed = [r for r in rows if r["group"] != "NONE"]
    print(f"{len(rows)} hums ({len(indexed)} in index, {len(rows) - len(indexed)} none) | "
          f"{seconds / len(rows):.1f}s each")
    if indexed:
        print(" | ".join(
            f"top-{k} {np.mean([r['where'] is not None and r['where'] <= k for r in indexed]):.0%}"
            for k in (1, 3, 5)))

    if not args.quiet:
        print(f"\n{'hum':<22}{'voiced':>7}{'#1':>7}{'#2':>7}{'margin':>8}{'z':>7}  actual   rank")
        for r in sorted(rows, key=lambda r: (r["group"], -r["z"])):
            where = "-" if r["group"] == "NONE" else (f"#{r['where']}" if r["where"] else ">5")
            print(f"{r['name'][:21]:<22}{r['voiced']:>6.1f}s{r['best']:>7.2f}{r['second']:>7.2f}"
                  f"{r['margin']:>8.2f}{r['z']:>7.2f}  {r['group']:<7}  {where}")

    print("\nmedians by group")
    for name in ("RIGHT", "WRONG", "NONE"):
        members = [r for r in rows if r["group"] == name]
        if members:
            print(f"  {name:<6} n={len(members):<3} " + "  ".join(
                f"{f} {np.median([r[f] for r in members]):6.2f}" for f in ("best", "margin", "z", "voiced")))
    decision_tables(rows)


if __name__ == "__main__":
    main()

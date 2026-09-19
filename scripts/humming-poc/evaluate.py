#!/usr/bin/env python3
"""Score a folder of hums: ranking accuracy, and whether a match can be trusted.

Usage: python evaluate.py [data/synth] [--limit N] [--quiet] [--margin 0.05] [--z 2.45]

Name each file <label>__<person>[_anything].<ext>, e.g. "ccc-12__ade.wav",
"ccc-12__ade_2.m4a", "none__tola_popsong.wav". The label is a hymn id or "none"
(a tune NOT in the index); hymns that share a tune with the right one also
count as correct. The person is only used for the per-person breakdown; the
matcher never sees any of the name.

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
A match is "confident" when margin >= --margin and z >= --z (defaults from the
synthetic run). Each hum then gets one of six outcomes:
  CORRECT ACCEPT  right hymn first, shown       FALSE REJECT  right hymn first, hidden
  WRONG ACCEPT    wrong hymn first, shown       WRONG REJECT  wrong hymn first, hidden (good)
  NONE ACCEPT     not in index, shown           NONE REJECT   not in index, hidden (good)
The product number is precision when confident: CORRECT ACCEPT / everything shown.

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
DURATIONS = ((0, 8), (8, 12), (12, 20), (20, float("inf")))  # seconds of voiced audio
OUTCOMES = ("CORRECT ACCEPT", "FALSE REJECT", "WRONG ACCEPT", "WRONG REJECT", "NONE ACCEPT", "NONE REJECT")


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


def person(name: str) -> str:
    match = re.match(r"[^_]+(?:-\d+)?__([^_.]+)", name)
    return match.group(1) if match else "?"


def person_report(rows: list[dict]) -> None:
    people = sorted({r["person"] for r in rows})
    # Synthetic hums are numbered, not named; a per-person table means nothing there.
    if len(people) < 2 or all(p.isdigit() for p in people):
        return
    print("\nby person")
    print(f"  {'person':<12}{'n':>4}{'top-1':>7}{'top-5':>7}{'shown':>7}{'precision':>11}{'none shown':>12}")
    for who in people:
        members = [r for r in rows if r["person"] == who]
        indexed = [r for r in members if r["group"] != "NONE"]
        nones = [r for r in members if r["group"] == "NONE"]
        accepted = [r for r in members if r["outcome"].endswith("ACCEPT")]
        top1 = f"{np.mean([r['group'] == 'RIGHT' for r in indexed]):.0%}" if indexed else "-"
        top5 = f"{np.mean([r['where'] is not None for r in indexed]):.0%}" if indexed else "-"
        prec = f"{np.mean([r['outcome'] == 'CORRECT ACCEPT' for r in accepted]):.0%}" if accepted else "-"
        none_shown = f"{np.mean([r['outcome'] == 'NONE ACCEPT' for r in nones]):.0%}" if nones else "-"
        print(f"  {who[:11]:<12}{len(members):>4}{top1:>7}{top5:>7}{len(accepted):>7}{prec:>11}{none_shown:>12}")


def outcome(row: dict, margin: float, z: float) -> str:
    shown = row["margin"] >= margin and row["z"] >= z
    return {
        ("RIGHT", True): "CORRECT ACCEPT", ("RIGHT", False): "FALSE REJECT",
        ("WRONG", True): "WRONG ACCEPT", ("WRONG", False): "WRONG REJECT",
        ("NONE", True): "NONE ACCEPT", ("NONE", False): "NONE REJECT",
    }[(row["group"], shown)]


def outcome_report(rows: list[dict], margin: float, z: float) -> None:
    print(f"\noutcomes with margin >= {margin:.2f} and z >= {z:.2f}")
    counts = {name: sum(r["outcome"] == name for r in rows) for name in OUTCOMES}
    for name in OUTCOMES:
        print(f"  {name:<15} {counts[name]:>3}")
    shown = counts["CORRECT ACCEPT"] + counts["WRONG ACCEPT"] + counts["NONE ACCEPT"]
    right = counts["CORRECT ACCEPT"] + counts["FALSE REJECT"]
    if shown:
        print(f"  precision when confident: {counts['CORRECT ACCEPT'] / shown:.0%} "
              f"({counts['CORRECT ACCEPT']} of {shown} shown)")
    if right:
        print(f"  right answers kept:       {counts['CORRECT ACCEPT'] / right:.0%}")

    print("\nby voiced duration")
    print(f"  {'length':<9}{'n':>4}{'top-1':>7}{'top-5':>7}{'shown':>7}{'precision':>11}{'none shown':>12}")
    for low, high in DURATIONS:
        members = [r for r in rows if low <= r["voiced"] < high]
        if not members:
            continue
        indexed = [r for r in members if r["group"] != "NONE"]
        nones = [r for r in members if r["group"] == "NONE"]
        accepted = [r for r in members if r["outcome"].endswith("ACCEPT")]
        label = f"{low:g}-{high:g}s" if high != float("inf") else f"{low:g}s+"
        top1 = f"{np.mean([r['group'] == 'RIGHT' for r in indexed]):.0%}" if indexed else "-"
        top5 = f"{np.mean([r['where'] is not None for r in indexed]):.0%}" if indexed else "-"
        prec = f"{np.mean([r['outcome'] == 'CORRECT ACCEPT' for r in accepted]):.0%}" if accepted else "-"
        none_shown = f"{np.mean([r['outcome'] == 'NONE ACCEPT' for r in nones]):.0%}" if nones else "-"
        print(f"  {label:<9}{len(members):>4}{top1:>7}{top5:>7}{len(accepted):>7}{prec:>11}{none_shown:>12}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("folder", nargs="?", default=str(Path(__file__).parent / "data" / "synth"))
    parser.add_argument("--limit", type=int)
    parser.add_argument("--quiet", action="store_true", help="skip the per-hum table")
    parser.add_argument("--margin", type=float, default=0.05, help="confidence rule: minimum margin")
    parser.add_argument("--z", type=float, default=2.45, help="confidence rule: minimum z")
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
        row["person"] = person(path.name)
        row["voiced"] = len(query) / QUERY_FPS
        if is_none:
            row["group"], row["where"] = "NONE", None
        else:
            truth = set(matcher.same_tune(label.group(1)))
            row["where"] = next((k + 1 for k, i in enumerate(row["ids"]) if i in truth), None)
            row["group"] = "RIGHT" if row["where"] == 1 else "WRONG"
        row["outcome"] = outcome(row, args.margin, args.z)
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
        print(f"\n{'hum':<22}{'voiced':>7}{'#1':>7}{'#2':>7}{'margin':>8}{'z':>7}  actual   rank  outcome")
        for r in sorted(rows, key=lambda r: (r["group"], -r["z"])):
            where = "-" if r["group"] == "NONE" else (f"#{r['where']}" if r["where"] else ">5")
            print(f"{r['name'][:21]:<22}{r['voiced']:>6.1f}s{r['best']:>7.2f}{r['second']:>7.2f}"
                  f"{r['margin']:>8.2f}{r['z']:>7.2f}  {r['group']:<7}  {where:<4}  {r['outcome']}")

    print("\nmedians by group")
    for name in ("RIGHT", "WRONG", "NONE"):
        members = [r for r in rows if r["group"] == name]
        if members:
            print(f"  {name:<6} n={len(members):<3} " + "  ".join(
                f"{f} {np.median([r[f] for r in members]):6.2f}" for f in ("best", "margin", "z", "voiced")))
    outcome_report(rows, args.margin, args.z)
    person_report(rows)
    decision_tables(rows)


if __name__ == "__main__":
    main()

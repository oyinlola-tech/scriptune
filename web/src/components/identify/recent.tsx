"use client";

import { Clock } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { targetPath, type LibraryTargetType } from "@/lib/api";
import { useGuestHistory } from "@/lib/history/guest-history";

function hrefFor(type: string | undefined, key: string | undefined, attemptId: string | undefined): string {
  if ((type === "hymn" || type === "verse") && key !== undefined) return targetPath(type as LibraryTargetType, key);
  return attemptId === undefined ? "/" : `/results/${attemptId}`;
}

/** What this browser identified recently. Lives in local storage; no account needed. */
export function RecentlyIdentified() {
  const entries = useGuestHistory((state) => state.entries);
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  if (!mounted || entries.length === 0) return null;
  return (
    <section className="mx-auto mt-16 w-full max-w-2xl">
      <h2 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"><Clock className="size-3.5" /> Recently identified</h2>
      <ul className="divide-y divide-border/70 rounded-2xl border border-border bg-card">
        {entries.slice(0, 6).map((entry) => (
          <li key={entry.id}>
            <Link href={hrefFor(entry.type, entry.key, entry.attemptId)} className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-secondary/60">
              <span className="display-serif text-lg">{entry.label}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{entry.type === "verse" ? "Bible" : entry.type === "hymn" ? "Hymn" : "No match"}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

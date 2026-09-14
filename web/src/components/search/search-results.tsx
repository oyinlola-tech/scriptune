"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { HymnListItem } from "@/components/hymns/hymn-list-item";
import { Skeleton } from "@/components/ui/skeleton";
import { search } from "@/lib/api";
import { keys } from "@/lib/query/keys";

/** Verse and hymn results for a query, side by side on wide screens. */
export function SearchResults({ query, type }: { query: string; type: "all" | "verses" | "hymns" }) {
  const { data, isPending, isError } = useQuery({ queryKey: keys.searchAll(query, type), queryFn: () => search.all(query, type, 8), enabled: query.length >= 2 });
  if (query.length < 2) return null;
  if (isPending) return <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-40 rounded-2xl" /></div>;
  if (isError) return <p className="text-sm text-destructive">Search is unavailable right now.</p>;
  const verses = data.verses?.results ?? [];
  const hymns = data.hymns?.results ?? [];
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {data.verses !== null && (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Bible{data.verses.translation === null ? "" : ` · ${data.verses.translation}`}</h2>
          {verses.length === 0 ? <p className="text-sm text-muted-foreground">No verses matched.</p> : (
            <ul className="space-y-3">
              {verses.map((verse) => (
                <li key={`${verse.translation}:${verse.reference}`} className="rounded-2xl border border-border bg-card p-4">
                  <Link href={`/bible/${verse.translation.toLowerCase()}/${verse.book.slug}/${verse.chapter}/${verse.verse}`} className="display-serif text-lg hover:underline decoration-gold underline-offset-4">{verse.reference} <span className="ml-1 text-xs font-sans font-medium uppercase tracking-wider text-muted-foreground">{verse.translation}</span></Link>
                  <p className="mt-1 text-sm text-muted-foreground">{verse.text}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {data.hymns !== null && (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Hymns</h2>
          {hymns.length === 0 ? <p className="text-sm text-muted-foreground">No hymns matched.</p> : (
            <ul className="divide-y divide-border/70 rounded-2xl border border-border bg-card">
              {hymns.map((hymn) => <HymnListItem key={hymn.slug} slug={hymn.slug} title={hymn.title} firstLine={hymn.firstLine} />)}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

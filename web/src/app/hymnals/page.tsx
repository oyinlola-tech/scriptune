import type { Metadata } from "next";
import Link from "next/link";
import { Page, PageHeading } from "@/components/layout/page";
import { hymns } from "@/lib/api";

/** Rendered on request; the API data itself is cached per fetch. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Hymnals", description: "The hymn books on Scriptune." };

export default async function HymnalsPage() {
  const { hymnals } = await hymns.hymnals();
  return (
    <Page>
      <PageHeading eyebrow="Explore" title="Hymnals" lede="Find a hymn by its number in the book you sing from." />
      <ul className="grid gap-4 sm:grid-cols-2">
        {hymnals.map((hymnal) => (
          <li key={hymnal.slug}>
            <Link href={`/hymnals/${hymnal.slug}`} className="block rounded-2xl border border-border bg-card p-6 transition-colors hover:bg-secondary/60">
              <p className="display-serif text-2xl">{hymnal.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{[hymnal.edition, hymnal.publisher].filter(Boolean).join(" · ")}</p>
              <p className="mt-3 text-xs text-muted-foreground">{hymnal.entryCount.toLocaleString()} hymns</p>
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  );
}

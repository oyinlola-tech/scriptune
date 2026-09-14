import type { Metadata } from "next";
import Link from "next/link";
import { hymnalShortName } from "@/components/hymns/hymn-board";
import { HymnListItem } from "@/components/hymns/hymn-list-item";
import { Page, PageHeading } from "@/components/layout/page";
import { hymns } from "@/lib/api";

/** Rendered on request; the API data itself is cached per fetch. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Hymns", description: "Browse every hymn on Scriptune alphabetically." };

export default async function HymnsPage({ searchParams }: { searchParams: Promise<{ page?: string; hymnal?: string }> }) {
  const { page: rawPage, hymnal } = await searchParams;
  const page = Math.max(1, Number(rawPage ?? 1) || 1);
  const result = await hymns.list({ page, limit: 50, hymnal });
  const pageLink = (target: number) => `/hymns?page=${target}${hymnal ? `&hymnal=${encodeURIComponent(hymnal)}` : ""}`;
  return (
    <Page>
      <PageHeading eyebrow="Explore" title="All hymns" lede={`${result.total.toLocaleString()} hymns, alphabetically.`} />
      <ul className="divide-y divide-border/70 rounded-2xl border border-border bg-card">
        {result.items.map((hymn) => (
          <HymnListItem key={hymn.slug} slug={hymn.slug} title={hymn.title} firstLine={hymn.firstLine} board={hymn.placements[0] ? { book: hymnalShortName(hymn.placements[0].hymnal.title), number: hymn.placements[0].number } : undefined} />
        ))}
      </ul>
      <nav className="mt-6 flex items-center justify-between text-sm" aria-label="Pagination">
        {page > 1 ? <Link href={pageLink(page - 1)} className="underline-offset-4 hover:underline">← Previous</Link> : <span />}
        <span className="text-muted-foreground">Page {result.page} of {result.totalPages}</span>
        {page < result.totalPages ? <Link href={pageLink(page + 1)} className="underline-offset-4 hover:underline">Next →</Link> : <span />}
      </nav>
    </Page>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hymnalShortName } from "@/components/hymns/hymn-board";
import { HymnListItem } from "@/components/hymns/hymn-list-item";
import { Page, PageHeading } from "@/components/layout/page";
import { ApiError, hymns } from "@/lib/api";

async function load(slug: string, page: number) {
  try {
    return await hymns.hymnal(slug, page, 100);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const data = await load((await params).slug, 1);
  if (data === null) notFound();
  return { title: data.hymnal.title, description: data.hymnal.description ?? undefined };
}

export default async function HymnalPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params;
  const page = Math.max(1, Number((await searchParams).page ?? 1) || 1);
  const data = await load(slug, page);
  if (data === null) notFound();
  const { hymnal, entries } = data;
  return (
    <Page>
      <PageHeading eyebrow="Hymnal" title={hymnal.title} lede={hymnal.description ?? undefined} />
      <ul className="divide-y divide-border/70 rounded-2xl border border-border bg-card">
        {entries.items.map((entry) => <HymnListItem key={entry.number} slug={entry.hymn.slug} title={entry.hymn.title} firstLine={entry.hymn.firstLine} board={{ book: hymnalShortName(hymnal.title), number: entry.number }} />)}
      </ul>
      <nav className="mt-6 flex items-center justify-between text-sm" aria-label="Pagination">
        {page > 1 ? <Link href={`/hymnals/${slug}?page=${page - 1}`} className="underline-offset-4 hover:underline">← Previous</Link> : <span />}
        <span className="text-muted-foreground">Page {entries.page} of {entries.totalPages}</span>
        {page < entries.totalPages ? <Link href={`/hymnals/${slug}?page=${page + 1}`} className="underline-offset-4 hover:underline">Next →</Link> : <span />}
      </nav>
    </Page>
  );
}

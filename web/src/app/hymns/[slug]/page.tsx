import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShareButton } from "@/components/common/share-button";
import { HymnBoard, hymnalShortName } from "@/components/hymns/hymn-board";
import { HymnTextView } from "@/components/hymns/hymn-text-view";
import { Page } from "@/components/layout/page";
import { AddToCollectionButton } from "@/components/library/add-to-collection";
import { NoteEditor } from "@/components/library/note-editor";
import { SaveButton } from "@/components/library/save-button";
import { ApiError, hymns } from "@/lib/api";

async function loadHymn(slug: string) {
  try {
    return await hymns.get(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const hymn = await loadHymn((await params).slug);
  if (hymn === null) notFound();
  const text = hymn.texts[0];
  return {
    title: hymn.title,
    description: text ? `${text.firstLine} — the words of “${hymn.title}”${hymn.placements[0] ? `, number ${hymn.placements[0].number} in ${hymn.placements[0].hymnal.title}` : ""}.` : hymn.title,
    openGraph: { title: hymn.title, type: "article" },
  };
}

export default async function HymnPage({ params }: { params: Promise<{ slug: string }> }) {
  const hymn = await loadHymn((await params).slug);
  if (hymn === null) notFound();
  const text = hymn.texts.find((entry) => entry.language === "en") ?? hymn.texts[0];
  return (
    <Page>
      <article>
        <header className="mb-10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">Hymn</p>
              <h1 className="display-serif mt-2 text-4xl sm:text-5xl">{hymn.title}</h1>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              {hymn.placements.map((placement) => (
                <Link key={`${placement.hymnal.slug}-${placement.number}`} href={`/hymnals/${placement.hymnal.slug}?page=${Math.ceil(placement.number / 100)}`} title={`${placement.hymnal.title}, number ${placement.number}`}>
                  <HymnBoard book={hymnalShortName(placement.hymnal.title)} number={placement.number} />
                </Link>
              ))}
            </div>
          </div>
          {(hymn.contributors.length > 0 || hymn.year !== null) && (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              {hymn.contributors.map((person) => <span key={`${person.role}-${person.slug}`}>{person.role.toLowerCase()}: {person.name}</span>)}
              {hymn.year && <span>{hymn.year}</span>}
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <SaveButton type="hymn" targetKey={hymn.slug} />
            <AddToCollectionButton type="hymn" targetKey={hymn.slug} />
            <ShareButton title={hymn.title} text={text?.firstLine} path={`/hymns/${hymn.slug}`} />
          </div>
        </header>
        {hymn.texts.length > 0 ? <HymnTextView texts={hymn.texts} /> : <p className="text-muted-foreground">No text is available for this hymn yet.</p>}
        {hymn.scriptureReferences.length > 0 && (
          <section className="mt-12 border-t border-border pt-6" aria-labelledby="hymn-scripture">
            <h2 id="hymn-scripture" className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Scripture in this hymn</h2>
            <ul className="divide-y divide-border/70 rounded-2xl border border-border bg-card">
              {hymn.scriptureReferences.map((reference) => (
                <li key={reference.reference}>
                  <Link href={`/bible/kjv/${reference.book}/${reference.chapter}${reference.verseStart ? `/${reference.verseStart}` : ""}`} className="flex flex-wrap items-baseline justify-between gap-x-4 px-4 py-3 hover:bg-secondary/60">
                    <span className="display-serif text-lg">{reference.reference}</span>
                    {reference.note !== undefined && <span className="text-sm text-muted-foreground">{reference.note}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <NoteEditor type="hymn" targetKey={hymn.slug} />
        <p className="mt-8 text-xs text-muted-foreground">{text ? (text.rightsStatus === "public-domain" ? "These words are in the public domain." : "Used by permission of the rights holder. See the Copyright page.") : ""}</p>
      </article>
    </Page>
  );
}

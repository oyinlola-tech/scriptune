import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CrossReferences } from "@/components/bible/cross-references";
import { TranslationNotice } from "@/components/bible/translation-notice";
import { VerseBlock } from "@/components/bible/verse-block";
import { Page } from "@/components/layout/page";
import { ShareButton } from "@/components/common/share-button";
import { AddToCollectionButton } from "@/components/library/add-to-collection";
import { NoteEditor } from "@/components/library/note-editor";
import { SaveButton } from "@/components/library/save-button";
import { ApiError, bible, hymns, verseKey } from "@/lib/api";

type Params = Promise<{ translation: string; book: string; chapter: string; verse: string }>;

async function load(params: Params) {
  const { translation, book, chapter, verse } = await params;
  try {
    const [detail, related, crossReferences] = await Promise.all([
      bible.verse(translation, book, Number(chapter), Number(verse), 2),
      hymns.forVerse(translation, book, Number(chapter), Number(verse)).catch(() => ({ reference: "", hymns: [] })),
      // An extra; the verse still opens if these cannot be had.
      bible.crossReferences(translation, book, Number(chapter), Number(verse)).catch(() => null),
    ]);
    return { detail, related, crossReferences };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await load(params);
  if (data === null) notFound();
  const { verse } = data.detail;
  return { title: `${verse.reference} (${data.detail.translation.code})`, description: verse.text, openGraph: { title: verse.reference, description: verse.text, type: "article" } };
}

export default async function VersePage({ params }: { params: Params }) {
  const data = await load(params);
  if (data === null) notFound();
  const { detail, related, crossReferences } = data;
  const code = detail.translation.code;
  return (
    <Page width="narrow">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">{detail.translation.name}</p>
        <h1 className="display-serif mt-2 text-4xl sm:text-5xl">{detail.verse.reference}</h1>
        <div className="mt-5 flex flex-wrap gap-2">
          <SaveButton type="verse" targetKey={verseKey(code, detail.verse.book.slug, detail.verse.chapter, detail.verse.verse)} />
          <AddToCollectionButton type="verse" targetKey={verseKey(code, detail.verse.book.slug, detail.verse.chapter, detail.verse.verse)} />
          <ShareButton title={`${detail.verse.reference} (${code})`} text={detail.verse.text} path={`/bible/${code.toLowerCase()}/${detail.verse.book.slug}/${detail.verse.chapter}/${detail.verse.verse}`} />
          <Link href={`/bible/${code.toLowerCase()}/${detail.verse.book.slug}/${detail.verse.chapter}#v${detail.verse.verse}`} className="inline-flex items-center rounded-full border border-border px-3 py-1.5 text-sm hover:bg-secondary">Read the chapter</Link>
        </div>
      </header>
      <div className="space-y-4" lang={detail.translation.language}>
        {detail.context.before.map((verse) => <VerseBlock key={verse.verse} verse={verse} translation={code} />)}
        <VerseBlock verse={detail.verse} translation={code} highlighted linked={false} />
        {detail.context.after.map((verse) => <VerseBlock key={verse.verse} verse={verse} translation={code} />)}
      </div>
      <TranslationNotice translation={detail.translation} />
      <NoteEditor type="verse" targetKey={verseKey(code, detail.verse.book.slug, detail.verse.chapter, detail.verse.verse)} />
      {crossReferences !== null && <CrossReferences data={crossReferences} />}
      {related.hymns.length > 0 && (
        <section className="mt-12 border-t border-border pt-6" aria-labelledby="hymns-on-passage">
          <h2 id="hymns-on-passage" className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Hymns on this passage</h2>
          <ul className="divide-y divide-border/70 rounded-2xl border border-border bg-card">
            {related.hymns.map((hymn) => (
              <li key={hymn.slug}><Link href={`/hymns/${hymn.slug}`} className="block px-4 py-3 hover:bg-secondary/60"><span className="display-serif text-lg">{hymn.title}</span></Link></li>
            ))}
          </ul>
        </section>
      )}
    </Page>
  );
}

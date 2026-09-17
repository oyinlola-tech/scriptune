import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { bookLabel } from "@scriptune/contracts";
import { TranslationPicker } from "@/components/bible/book-grid";
import { TranslationNotice } from "@/components/bible/translation-notice";
import { VerseBlock } from "@/components/bible/verse-block";
import { Page } from "@/components/layout/page";
import { ApiError, bible } from "@/lib/api";

type Params = Promise<{ translation: string; book: string; chapter: string }>;

async function load(params: Params) {
  const { translation, book, chapter } = await params;
  try {
    const [data, translations] = await Promise.all([bible.chapter(translation, book, Number(chapter)), bible.translations()]);
    return { ...data, translations: translations.translations };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await load(params);
  if (data === null) notFound();
  return { title: `${bookLabel(data.book)} ${data.chapter} (${data.translation.code})`, description: data.verses[0]?.text };
}

export default async function ChapterPage({ params }: { params: Params }) {
  const data = await load(params);
  if (data === null) notFound();
  const code = data.translation.code.toLowerCase();
  // Only the 66 shared books are in every translation; the others would lead some pills to a missing page.
  const canSwitch = !data.book.deuterocanonical && data.translations.length > 1;
  return (
    <Page width="narrow">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">{data.translation.name}</p>
        <h1 className="display-serif mt-2 text-4xl sm:text-5xl" lang={data.translation.language}>{bookLabel(data.book)} {data.chapter}</h1>
        <p className="mt-2 text-sm"><Link href={`/bible/${code}/${data.book.slug}`} className="text-muted-foreground underline-offset-4 hover:underline">All {data.book.chapterCount} chapters</Link></p>
      </header>
      {canSwitch && <TranslationPicker translations={data.translations} current={data.translation.code} hrefFor={(other) => `/bible/${other}/${data.book.slug}/${data.chapter}`} />}
      <div className="space-y-4" lang={data.translation.language}>
        {data.verses.map((verse) => <VerseBlock key={verse.verse} verse={verse} translation={data.translation.code} />)}
      </div>
      <nav className="mt-10 flex items-center justify-between text-sm" aria-label="Chapters">
        {data.chapter > 1 ? <Link href={`/bible/${code}/${data.book.slug}/${data.chapter - 1}`} className="underline-offset-4 hover:underline">← Chapter {data.chapter - 1}</Link> : <Link href={`/bible/${code}/${data.book.slug}`} className="underline-offset-4 hover:underline">← Chapters</Link>}
        {data.chapter < data.book.chapterCount && <Link href={`/bible/${code}/${data.book.slug}/${data.chapter + 1}`} className="underline-offset-4 hover:underline">Chapter {data.chapter + 1} →</Link>}
      </nav>
      <TranslationNotice translation={data.translation} />
    </Page>
  );
}

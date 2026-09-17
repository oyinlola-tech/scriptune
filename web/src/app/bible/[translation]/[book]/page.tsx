import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { bookLabel } from "@scriptune/contracts";
import { Page } from "@/components/layout/page";
import { ApiError, bible } from "@/lib/api";

type Params = Promise<{ translation: string; book: string }>;

async function load(params: Params) {
  const { translation, book } = await params;
  try {
    const data = await bible.books(translation);
    const needle = book.trim().toLowerCase();
    const found = data.books.find((entry) => entry.slug === needle || entry.name.toLowerCase() === needle || entry.abbreviation.toLowerCase() === needle) ?? null;
    return found === null ? null : { translation: data.translation, book: found };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await load(params);
  if (data === null) notFound();
  return { title: `${bookLabel(data.book)} (${data.translation.code})`, description: `Choose a chapter of ${data.book.name}.` };
}

/** The chapters of one book, laid out like the numbers on a hymn board. */
export default async function BookPage({ params }: { params: Params }) {
  const data = await load(params);
  if (data === null) notFound();
  const code = data.translation.code.toLowerCase();
  const chapters = Array.from({ length: data.book.chapterCount }, (_, index) => index + 1);
  return (
    <Page width="narrow">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">{data.translation.name}</p>
        <h1 className="display-serif mt-2 text-4xl sm:text-5xl" lang={data.translation.language}>{bookLabel(data.book)}</h1>
        <p className="mt-2 text-muted-foreground">{data.book.chapterCount === 1 ? "One chapter." : `${data.book.chapterCount} chapters. Choose one to read.`}</p>
      </header>
      <ol className="grid grid-cols-5 gap-2 sm:grid-cols-8" aria-label="Chapters">
        {chapters.map((chapter) => (
          <li key={chapter}>
            <Link href={`/bible/${code}/${data.book.slug}/${chapter}`} className="display-serif flex aspect-square items-center justify-center rounded-xl border border-border bg-card text-xl transition-colors hover:border-gold hover:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-gold">
              {chapter}
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-10 text-sm"><Link href={`/bible/${code}`} className="underline-offset-4 hover:underline">← All books</Link></p>
    </Page>
  );
}

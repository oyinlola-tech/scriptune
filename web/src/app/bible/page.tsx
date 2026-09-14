import type { Metadata } from "next";
import { BookGrid, TranslationPicker } from "@/components/bible/book-grid";
import { Page, PageHeading } from "@/components/layout/page";
import { bible } from "@/lib/api";
import { DEFAULT_TRANSLATION } from "@/lib/site";

/** Rendered on request; the API data itself is cached per fetch. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Bible", description: "Read the Bible in the King James, World English, Douay-Rheims and American Standard versions." };

export default async function BiblePage() {
  const [{ translation, books }, { translations }] = await Promise.all([bible.books(DEFAULT_TRANSLATION), bible.translations()]);
  return (
    <Page width="wide">
      <PageHeading eyebrow="Read" title={translation.name} lede="Choose a translation and a book, then a chapter." />
      <TranslationPicker translations={translations} current={translation.code} />
      <BookGrid translationCode={translation.code} books={books} />
    </Page>
  );
}

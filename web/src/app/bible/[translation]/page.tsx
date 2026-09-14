import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookGrid, TranslationPicker } from "@/components/bible/book-grid";
import { Page, PageHeading } from "@/components/layout/page";
import { ApiError, bible } from "@/lib/api";

type Params = Promise<{ translation: string }>;

async function load(params: Params) {
  const { translation } = await params;
  try {
    const [books, translations] = await Promise.all([bible.books(translation), bible.translations()]);
    return { ...books, translations: translations.translations };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await load(params);
  if (data === null) notFound();
  return { title: data.translation.name, description: `Read the ${data.translation.name} book by book.` };
}

/** The books of one translation. */
export default async function TranslationPage({ params }: { params: Params }) {
  const data = await load(params);
  if (data === null) notFound();
  const full = data.translations.find((translation) => translation.code === data.translation.code);
  return (
    <Page width="wide">
      <PageHeading eyebrow="Read" title={data.translation.name} lede={full?.description ?? "Choose a book, then a chapter."} />
      <TranslationPicker translations={data.translations} current={data.translation.code} />
      <BookGrid translationCode={data.translation.code} books={data.books} />
    </Page>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResultView } from "@/components/identify/result-view";
import { Page } from "@/components/layout/page";
import { ApiError, recognition } from "@/lib/api";

type Params = Promise<{ attemptId: string }>;

async function load(params: Params) {
  const { attemptId } = await params;
  try {
    return await recognition.attempt(attemptId);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const result = await load(params);
  if (result === null) notFound();
  const best = result.best;
  const title = best === null ? `“${result.transcript}”` : best.type === "verse" ? `${best.reference} (${best.translation})` : best.title;
  return { title: `Identified: ${title}`, description: `Scriptune heard “${result.transcript}”.` };
}

/** A past identification, shareable by link. Renders on the server so a bad id is a real 404. */
export default async function ResultPage({ params }: { params: Params }) {
  const result = await load(params);
  if (result === null) notFound();
  return (
    <Page>
      <ResultView result={result} />
    </Page>
  );
}

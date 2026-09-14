import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { SaveButton } from "@/components/library/save-button";
import { verseKey, type RecognitionCandidate } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ConfidenceBadge } from "./confidence-badge";

export function candidateHref(candidate: RecognitionCandidate): string {
  return candidate.type === "verse"
    ? `/bible/${candidate.translation.toLowerCase()}/${candidate.book}/${candidate.chapter}/${candidate.verse}`
    : `/hymns/${candidate.slug}`;
}

/** One match. The best match is rendered large with the words themselves. */
export function CandidateCard({ candidate, featured = false }: { candidate: RecognitionCandidate; featured?: boolean }) {
  const href = candidateHref(candidate);
  const title = candidate.type === "verse" ? candidate.reference : candidate.title;
  const body = candidate.type === "verse" ? candidate.text : candidate.firstLine;
  const kind = candidate.type === "verse" ? `${candidate.translation} · Bible` : "Hymn";
  const target = candidate.type === "verse"
    ? { type: "verse" as const, key: verseKey(candidate.translation, candidate.book, candidate.chapter, candidate.verse) }
    : { type: "hymn" as const, key: candidate.slug };

  return (
    <article className={cn("rounded-2xl border border-border bg-card p-5 animate-rise", featured && "p-7 shadow-[0_30px_80px_-40px_rgba(28,25,23,0.35)] ring-1 ring-gold/40")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{kind}</p>
        <ConfidenceBadge confidence={candidate.confidence} />
      </div>
      <h3 className={cn("display-serif mt-3", featured ? "text-3xl sm:text-4xl" : "text-xl")}>
        <Link href={href} className="hover:underline decoration-gold underline-offset-4">{title}</Link>
      </h3>
      <p className={cn("mt-3 text-foreground/85", featured ? "hymn-text" : "text-sm text-muted-foreground")}>{body}</p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Link href={href} className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          {candidate.type === "verse" ? "Read in context" : "See the words"} <ArrowUpRight className="size-4" />
        </Link>
        <SaveButton type={target.type} targetKey={target.key} />
      </div>
    </article>
  );
}

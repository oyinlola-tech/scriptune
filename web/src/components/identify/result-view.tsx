"use client";

import { RotateCcw, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { RecognitionResultDto } from "@/lib/api";
import { CandidateCard } from "./candidate-card";

/** Transcript, best match, and the runners-up. */
export function ResultView({ result, onReset }: { result: RecognitionResultDto; onReset?: () => void }) {
  const [best, ...others] = result.candidates;
  return (
    <section className="mx-auto w-full max-w-2xl space-y-6" aria-live="polite">
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{result.inputType === "AUDIO" ? "We heard" : "You typed"}</p>
        <p className="display-serif mt-2 text-2xl text-foreground/80">“{result.transcript}”</p>
      </div>
      {best === undefined ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="display-serif text-2xl">Nothing matched yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">Try a longer or clearer clip, or search for the words you remember.</p>
        </div>
      ) : (
        <CandidateCard candidate={best} featured />
      )}
      {others.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Could also be</p>
          {others.map((candidate) => (
            <CandidateCard key={`${candidate.type}-${candidate.type === "verse" ? `${candidate.translation}:${candidate.reference}` : candidate.slug}`} candidate={candidate} />
          ))}
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        {onReset ? (
          <Button variant="outline" className="rounded-full" onClick={onReset}><RotateCcw data-icon="inline-start" /> Listen again</Button>
        ) : (
          <Button variant="outline" className="rounded-full" render={<Link href="/" />}><RotateCcw data-icon="inline-start" /> Identify another</Button>
        )}
        <Button variant="ghost" className="rounded-full" render={<Link href={`/search?q=${encodeURIComponent(result.transcript)}`} />}>
          <Search data-icon="inline-start" /> Search these words
        </Button>
      </div>
    </section>
  );
}

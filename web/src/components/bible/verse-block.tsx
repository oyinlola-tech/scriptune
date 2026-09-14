import Link from "next/link";
import type { VerseDto } from "@/lib/api";
import { cn } from "@/lib/utils";

/** One verse with its number, optionally emphasised. */
export function VerseBlock({ verse, translation, highlighted = false, linked = true }: { verse: VerseDto; translation: string; highlighted?: boolean; linked?: boolean }) {
  const href = `/bible/${translation.toLowerCase()}/${verse.book.slug}/${verse.chapter}/${verse.verse}`;
  const number = <sup className="mr-1.5 text-[0.65em] font-sans font-medium text-muted-foreground">{verse.verse}</sup>;
  return (
    <p id={`v${verse.verse}`} className={cn("hymn-text scroll-mt-24", highlighted && "rounded-xl bg-gold/15 px-3 py-2 -mx-3")}>
      {linked ? <Link href={href} className="hover:underline decoration-gold underline-offset-4">{number}</Link> : number}
      {verse.text}
    </p>
  );
}

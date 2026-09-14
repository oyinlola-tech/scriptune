import { verseForDate } from "@scriptune/contracts";
import Link from "next/link";

/** Today's verse, linking to the passage. Server-rendered; the same for everyone on a given day. */
export function VerseOfTheDay() {
  const verse = verseForDate();
  return (
    <Link
      href={`/bible/${verse.translation.toLowerCase()}/${verse.book}/${verse.chapter}/${verse.verse}`}
      className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-gold"
    >
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">Verse of the day</p>
      <p className="hymn-text mt-2 text-lg">{verse.text}</p>
      <p className="mt-2 text-sm text-muted-foreground">{verse.reference} · {verse.translation}</p>
    </Link>
  );
}

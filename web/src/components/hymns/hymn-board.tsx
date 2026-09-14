import { cn } from "@/lib/utils";

/**
 * A hymn's number as it appears on the board at the front of church: an
 * ink slat, the book above in small caps, the number large in ivory.
 */
export function HymnBoard({ book, number, className }: { book: string; number: number; className?: string }) {
  return (
    <span role="img" className={cn("hymn-board", className)} aria-label={`${book} number ${number}`}>
      <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-ivory/70">{book}</span>
      <span className="display-serif text-2xl leading-none">{number}</span>
    </span>
  );
}

/** Short label for a hymnal on the board. */
export function hymnalShortName(title: string): string {
  if (/sacred songs and solos/i.test(title)) return "SS&S";
  return title.split(/\s+/).map((word) => word[0]?.toUpperCase() ?? "").join("").slice(0, 4);
}

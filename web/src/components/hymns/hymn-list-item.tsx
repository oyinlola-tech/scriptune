import Link from "next/link";
import { HymnBoard } from "./hymn-board";

export interface HymnListItemProps {
  slug: string;
  title: string;
  firstLine: string | null;
  meta?: string;
  board?: { book: string; number: number };
}

/** A hymn in a list: title in serif, first line beneath, placement on the right. */
export function HymnListItem({ slug, title, firstLine, meta, board }: HymnListItemProps) {
  return (
    <li>
      <Link href={`/hymns/${slug}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-secondary/60">
        <span className="min-w-0">
          <span className="display-serif block text-lg">{title}</span>
          {firstLine && firstLine !== title && <span className="block truncate text-sm text-muted-foreground">{firstLine}</span>}
        </span>
        {board ? <HymnBoard book={board.book} number={board.number} className="min-w-[3.25rem] px-2 py-1 [&>span:last-child]:text-lg" /> : meta ? <span className="shrink-0 text-xs text-muted-foreground">{meta}</span> : null}
      </Link>
    </li>
  );
}

import { passageLabel } from "@scriptune/contracts";
import Link from "next/link";
import type { CrossReferencesDto } from "@/lib/api";

/** Passages that speak to the same thing, each opening in the translation being read. */
export function CrossReferences({ data }: { data: CrossReferencesDto }) {
  if (data.references.length === 0) return null;
  const code = data.translation.code.toLowerCase();
  return (
    <section className="mt-12 border-t border-border pt-6" aria-labelledby="related-scriptures">
      <h2 id="related-scriptures" className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Related scriptures</h2>
      <ul className="divide-y divide-border/70 rounded-2xl border border-border bg-card">
        {data.references.map((passage) => (
          <li key={`${passage.book.slug}-${passage.chapter}-${passage.verse}`}>
            <Link href={`/bible/${code}/${passage.book.slug}/${passage.chapter}/${passage.verse}`} className="block px-4 py-3 hover:bg-secondary/60">
              <span className="display-serif text-lg" lang={data.translation.language}>{passageLabel(passage)}</span>
              <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground" lang={data.translation.language}>{passage.text}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        Cross-references from <a href={data.source.url} className="underline underline-offset-4 hover:text-foreground" rel="noreferrer" target="_blank">{data.source.name}</a>, {data.source.licence}.
      </p>
    </section>
  );
}

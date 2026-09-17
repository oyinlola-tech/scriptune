import Link from "next/link";
import { bookLabel } from "@scriptune/contracts";
import type { BookDto, TranslationDto } from "@/lib/api";

const GROUPS = [
  { label: "Old Testament", match: (book: BookDto) => book.testament === "OLD" && !book.deuterocanonical },
  { label: "Deuterocanonical books", match: (book: BookDto) => book.deuterocanonical },
  { label: "New Testament", match: (book: BookDto) => book.testament === "NEW" },
] as const;

/** Pills for switching translation; the current one is filled. `hrefFor` keeps the reader on the same book or chapter. */
export function TranslationPicker({ translations, current, hrefFor = (code) => `/bible/${code}` }: { translations: Pick<TranslationDto, "code" | "name">[]; current: string; hrefFor?: (code: string) => string }) {
  return (
    <nav className="mb-8 flex flex-wrap gap-2" aria-label="Translations">
      {translations.map((translation) => {
        const active = translation.code === current;
        return (
          <Link key={translation.code} href={hrefFor(translation.code.toLowerCase())} aria-current={active ? "page" : undefined} title={translation.name} className={`rounded-full border px-3 py-1 text-sm transition-colors ${active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-gold hover:text-foreground"}`}>
            {translation.code}
          </Link>
        );
      })}
    </nav>
  );
}

/** Books grouped by testament, with the deuterocanon between when a translation has it. */
export function BookGrid({ translationCode, books }: { translationCode: string; books: BookDto[] }) {
  const code = translationCode.toLowerCase();
  return (
    <>
      {GROUPS.map((group) => {
        const members = books.filter(group.match);
        if (members.length === 0) return null;
        return (
          <section key={group.label} className="mb-10">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{group.label}</h2>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {members.map((book) => (
                <li key={book.slug}>
                  <Link href={`/bible/${code}/${book.slug}`} className="flex items-baseline justify-between rounded-xl border border-border bg-card px-4 py-3 hover:bg-secondary/60">
                    <span className="min-w-0">
                      <span className="display-serif block truncate text-lg">{bookLabel(book)}</span>
                      {book.localName !== null && <span className="block truncate text-xs text-muted-foreground">{book.name}</span>}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">{book.chapterCount}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

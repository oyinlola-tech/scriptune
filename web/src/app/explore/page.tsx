import type { Metadata } from "next";
import { BookOpen, Library, Music } from "lucide-react";
import Link from "next/link";
import { Page, PageHeading } from "@/components/layout/page";
import { SearchBox } from "@/components/search/search-box";
import { bible, hymns, type HymnalDto, type TranslationDto } from "@/lib/api";

export const metadata: Metadata = { title: "Explore", description: "Browse hymnals, hymns and scripture on Scriptune." };

const LANGUAGE_NAMES: Record<string, string> = { en: "English", yo: "Yorùbá", ig: "Igbo", ha: "Hausa", fr: "Français" };

function sentenceList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

/** What is there to browse, said from what is actually loaded rather than from a fixed line of copy. */
function describe(translations: TranslationDto[], hymnals: HymnalDto[]) {
  const languages = [...new Set(translations.map((translation) => LANGUAGE_NAMES[translation.language] ?? translation.language))];
  const hymnCount = hymnals.reduce((sum, hymnal) => sum + hymnal.entryCount, 0);
  return {
    hymnals: hymnals.length === 0 ? "Find a hymn by its number." : hymnals.length === 1 ? `Find a hymn by its number in ${hymnals[0]?.title}.` : `Find a hymn by its number in ${hymnals.length} hymnals.`,
    hymns: hymnCount === 0 ? "Every hymn, alphabetically, with its words." : `${hymnCount.toLocaleString("en")} hymns, alphabetically, with their words.`,
    scripture: translations.length === 0 ? "The Bible, book by book." : `${translations.length} translations in ${sentenceList(languages)}, book by book.`,
  };
}

export default async function ExplorePage() {
  // The page is a signpost; it still stands if the API cannot be reached.
  const [translations, hymnals] = await Promise.all([
    bible.translations().then((data) => data.translations, () => []),
    hymns.hymnals().then((data) => data.hymnals, () => []),
  ]);
  const text = describe(translations, hymnals);
  const sections = [
    { href: "/hymnals", icon: Library, title: "Hymnals", text: text.hymnals },
    { href: "/hymns", icon: Music, title: "Hymns", text: text.hymns },
    { href: "/bible", icon: BookOpen, title: "Scripture", text: text.scripture },
  ];
  return (
    <Page>
      <PageHeading eyebrow="Explore" title="Read and wander" lede="Everything Scriptune can identify, laid out to browse." />
      <div className="mb-10"><SearchBox size="md" /></div>
      <ul className="grid gap-4 sm:grid-cols-3">
        {sections.map((section) => (
          <li key={section.href}>
            <Link href={section.href} className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:bg-secondary/60">
              <section.icon className="size-6 text-gold" />
              <span className="display-serif mt-4 text-2xl">{section.title}</span>
              <span className="mt-2 text-sm text-muted-foreground">{section.text}</span>
            </Link>
          </li>
        ))}
      </ul>
      {translations.length > 0 && (
        <section className="mt-12" aria-labelledby="explore-translations">
          <h2 id="explore-translations" className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Translations</h2>
          <ul className="divide-y divide-border/70 rounded-2xl border border-border bg-card">
            {translations.map((translation) => (
              <li key={translation.code}>
                <Link href={`/bible/${translation.code.toLowerCase()}`} className="flex flex-wrap items-baseline justify-between gap-x-4 px-4 py-3 hover:bg-secondary/60">
                  <span className="display-serif text-lg" lang={translation.language}>{translation.name}</span>
                  <span className="text-sm text-muted-foreground">{translation.code} · {LANGUAGE_NAMES[translation.language] ?? translation.language}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {hymnals.length > 0 && (
        <section className="mt-10" aria-labelledby="explore-hymnals">
          <h2 id="explore-hymnals" className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Hymnals</h2>
          <ul className="divide-y divide-border/70 rounded-2xl border border-border bg-card">
            {hymnals.map((hymnal) => (
              <li key={hymnal.slug}>
                <Link href={`/hymnals/${hymnal.slug}`} className="flex flex-wrap items-baseline justify-between gap-x-4 px-4 py-3 hover:bg-secondary/60">
                  <span className="display-serif text-lg">{hymnal.title}</span>
                  <span className="text-sm text-muted-foreground">{hymnal.entryCount.toLocaleString("en")} hymns</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Page>
  );
}

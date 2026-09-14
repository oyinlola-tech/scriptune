import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/layout/page";
import { SearchBox } from "@/components/search/search-box";
import { SearchResults } from "@/components/search/search-results";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Search", description: "Search hymns and Bible verses by the words you remember." };

const TYPES = [{ value: "all", label: "Everything" }, { value: "verses", label: "Bible" }, { value: "hymns", label: "Hymns" }] as const;

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const { q = "", type: rawType } = await searchParams;
  const type = rawType === "verses" || rawType === "hymns" ? rawType : "all";
  const query = q.trim();
  return (
    <Page width="wide">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="display-serif text-4xl sm:text-5xl">Search the words you remember</h1>
        <p className="mt-3 text-muted-foreground">Half a line is often enough.</p>
        <div className="mt-6"><SearchBox key={query} initial={query} autoFocus /></div>
        <div className="mt-4 inline-flex rounded-full border border-border bg-card p-1">
          {TYPES.map((entry) => (
            <Link key={entry.value} href={`/search?q=${encodeURIComponent(query)}&type=${entry.value}`} className={cn("rounded-full px-4 py-1.5 text-sm font-medium", type === entry.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{entry.label}</Link>
          ))}
        </div>
      </div>
      <div className="mt-10">
        {query.length >= 2 ? <SearchResults query={query} type={type} /> : (
          <p className="text-center text-sm text-muted-foreground">Try “how sweet the sound” or “the Lord is my shepherd”.</p>
        )}
      </div>
    </Page>
  );
}

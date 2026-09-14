import type { Metadata } from "next";
import { BookOpen, Library, Music } from "lucide-react";
import Link from "next/link";
import { Page, PageHeading } from "@/components/layout/page";
import { SearchBox } from "@/components/search/search-box";

export const metadata: Metadata = { title: "Explore", description: "Browse hymnals, hymns and scripture on Scriptune." };

const SECTIONS = [
  { href: "/hymnals", icon: Library, title: "Hymnals", text: "Find a hymn by its number in Sacred Songs and Solos." },
  { href: "/hymns", icon: Music, title: "Hymns", text: "Every hymn, alphabetically, with its words." },
  { href: "/bible", icon: BookOpen, title: "Scripture", text: "The King James Version, book by book." },
];

export default function ExplorePage() {
  return (
    <Page>
      <PageHeading eyebrow="Explore" title="Read and wander" lede="Everything Scriptune can identify, laid out to browse." />
      <div className="mb-10"><SearchBox size="md" /></div>
      <ul className="grid gap-4 sm:grid-cols-3">
        {SECTIONS.map((section) => (
          <li key={section.href}>
            <Link href={section.href} className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:bg-secondary/60">
              <section.icon className="size-6 text-gold" />
              <span className="display-serif mt-4 text-2xl">{section.title}</span>
              <span className="mt-2 text-sm text-muted-foreground">{section.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  );
}

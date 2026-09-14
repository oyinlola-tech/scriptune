"use client";

import { useState } from "react";
import type { HymnTextDto } from "@/lib/api";
import { cn } from "@/lib/utils";
import { HymnStanzas } from "./hymn-stanzas";

const LANGUAGE_NAMES: Record<string, string> = { en: "English", yo: "Yorùbá", ig: "Igbo", ha: "Hausa", fr: "Français" };

function languageName(code: string): string {
  return LANGUAGE_NAMES[code] ?? code.toUpperCase();
}

/** The hymn's words, with a language switch when it exists in more than one. */
export function HymnTextView({ texts }: { texts: HymnTextDto[] }) {
  const ordered = [...texts].sort((a, b) => (a.language === "en" ? -1 : b.language === "en" ? 1 : 0));
  const [active, setActive] = useState(ordered[0]?.language ?? "en");
  const text = ordered.find((entry) => entry.language === active) ?? ordered[0];
  if (text === undefined) return <p className="text-muted-foreground">No text is available for this hymn yet.</p>;
  return (
    <div>
      {ordered.length > 1 && (
        <div role="tablist" aria-label="Language" className="mb-6 inline-flex rounded-full border border-border bg-card p-1">
          {ordered.map((entry) => (
            <button
              key={entry.language}
              type="button"
              role="tab"
              aria-selected={entry.language === active}
              onClick={() => setActive(entry.language)}
              className={cn("rounded-full px-4 py-1.5 text-sm font-medium transition-colors", entry.language === active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {languageName(entry.language)}
            </button>
          ))}
        </div>
      )}
      {text.title !== "" && <p className="display-serif mb-6 text-2xl text-foreground/80">{text.title}</p>}
      <HymnStanzas stanzas={text.stanzas} />
    </div>
  );
}

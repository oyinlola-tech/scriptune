"use client";

import type { RecognitionMode } from "@/lib/api";
import { cn } from "@/lib/utils";

const MODES: { value: RecognitionMode; label: string; hint: string }[] = [
  { value: "bible", label: "Bible", hint: "A verse or passage" },
  { value: "hymn", label: "Hymn", hint: "Sung words" },
  { value: "auto", label: "Either", hint: "Let Scriptune decide" },
];

/** Segmented control for what to listen for. Arrow keys move between options, as a radio group should. */
export function ModeToggle({ value, onChange }: { value: RecognitionMode; onChange: (mode: RecognitionMode) => void }) {
  const move = (delta: number) => {
    const index = MODES.findIndex((mode) => mode.value === value);
    const next = MODES[(index + delta + MODES.length) % MODES.length];
    if (next !== undefined) onChange(next.value);
  };
  return (
    <div role="radiogroup" aria-label="What to identify" className="inline-flex rounded-full border border-border bg-card p-1">
      {MODES.map((mode) => {
        const checked = value === mode.value;
        return (
          <button
            key={mode.value}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={`${mode.label}: ${mode.hint}`}
            tabIndex={checked ? 0 : -1}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); move(1); }
              if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); move(-1); }
            }}
            onClick={() => onChange(mode.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              checked ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}

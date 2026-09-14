import type { Stanza } from "@/lib/api";
import { cn } from "@/lib/utils";

/** The words, one stanza per block, choruses set apart with a gold rule. */
export function HymnStanzas({ stanzas }: { stanzas: Stanza[] }) {
  return (
    <div className="space-y-8">
      {stanzas.map((stanza, index) => (
        <div key={index} className={cn("grid grid-cols-[2rem_1fr] gap-x-3", stanza.kind === "chorus" && "border-l-2 border-gold pl-4 [&>span]:hidden")}>
          <span className="pt-1.5 text-xs font-medium text-muted-foreground">{stanza.number ?? ""}</span>
          <div>
            {stanza.kind === "chorus" && <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.2em] text-gold">Chorus</p>}
            {stanza.lines.map((line, lineIndex) => (
              <p key={lineIndex} className="hymn-text">{line}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

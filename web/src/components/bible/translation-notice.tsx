import Link from "next/link";
import type { TranslationSummaryDto } from "@/lib/api";

/** The copyright line an openly licensed translation asks to have shown beside its text. */
export function TranslationNotice({ translation }: { translation: TranslationSummaryDto }) {
  // Falsy, not just null: a response cached before the field existed has no notice at all.
  if (!translation.notice) return null;
  return (
    <p className="mt-10 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
      {translation.notice} <Link href="/legal/copyright" className="underline underline-offset-4 hover:text-foreground">Copyright and credits</Link>
    </p>
  );
}

import Link from "next/link";
import { cn } from "@/lib/utils";

/** The Scriptune mark: a serif wordmark with a gold point, like a tuning note. */
export function Wordmark({ className, size = "md" }: { className?: string; size?: "md" | "lg" | "xl" }) {
  const sizes = { md: "text-xl", lg: "text-3xl", xl: "text-[clamp(3rem,12vw,9rem)]" };
  return (
    <Link href="/" className={cn("display-serif inline-flex items-baseline gap-0.5 text-foreground", sizes[size], className)} aria-label="Scriptune home">
      <span>Scriptune</span>
      <span aria-hidden className="mb-[0.12em] inline-block size-[0.22em] rounded-full bg-gold" />
    </Link>
  );
}

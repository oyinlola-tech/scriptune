import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Standard page column. */
export function Page({ children, className, width = "default" }: { children: ReactNode; className?: string; width?: "default" | "narrow" | "wide" }) {
  const widths = { default: "max-w-4xl", narrow: "max-w-2xl", wide: "max-w-6xl" };
  return <div className={cn("page-gutter mx-auto w-full py-10", widths[width], className)}>{children}</div>;
}

/** Page heading: an eyebrow, a serif title and an optional lede. */
export function PageHeading({ eyebrow, title, lede, actions }: { eyebrow?: string; title: ReactNode; lede?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-gold">{eyebrow}</p>}
        <h1 className="display-serif text-4xl sm:text-5xl">{title}</h1>
        {lede && <p className="mt-3 max-w-2xl text-muted-foreground">{lede}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}

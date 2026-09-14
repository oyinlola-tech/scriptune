import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";

const COLUMNS = [
  { title: "Find", links: [{ href: "/", label: "Identify" }, { href: "/search", label: "Search" }, { href: "/explore", label: "Explore" }] },
  { title: "Read", links: [{ href: "/bible", label: "Bible" }, { href: "/hymnals", label: "Hymnals" }, { href: "/hymns", label: "All hymns" }] },
  { title: "You", links: [{ href: "/library", label: "Library" }, { href: "/library/history", label: "History" }, { href: "/account", label: "Account" }] },
  { title: "Legal", links: [{ href: "/legal/terms", label: "Terms" }, { href: "/legal/privacy", label: "Privacy" }, { href: "/legal/copyright", label: "Copyright" }, { href: "/legal/licenses", label: "Licences" }] },
];

/**
 * Typographic footer: a very large wordmark, three short columns and a
 * rights row that says where the words come from.
 */
export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60">
      <div className="page-gutter mx-auto w-full max-w-6xl py-12">
        <div className="grid gap-10 md:grid-cols-[1fr_auto]">
          <div className="max-w-md">
            <p className="text-sm text-muted-foreground">Hear it. Know it. Keep it.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Scriptune identifies hymns and Bible passages from what you heard, then shows you the words and the scripture behind them.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-4">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="mb-3 font-medium">{column.title}</p>
                <ul className="space-y-2">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-muted-foreground transition-colors hover:text-foreground">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 overflow-hidden leading-none">
          <Wordmark size="xl" className="-mb-[0.18em] text-foreground/90" />
        </div>
        <div className="mt-6 flex flex-col gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Scripture from the King James Version. Hymns from Sacred Songs and Solos. Both public domain.</p>
          <p>© {new Date().getFullYear()} Scriptune</p>
        </div>
      </div>
    </footer>
  );
}

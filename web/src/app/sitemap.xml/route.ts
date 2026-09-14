import { bible, hymns } from "@/lib/api";
import { DEFAULT_TRANSLATION, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

interface Entry {
  path: string;
  changefreq: "weekly" | "monthly" | "yearly";
}

async function collect(): Promise<Entry[]> {
  const entries: Entry[] = [
    "/",
    "/search",
    "/explore",
    "/hymns",
    "/hymnals",
    "/bible",
  ].map((path) => ({ path, changefreq: "weekly" }));
  try {
    const [{ hymnals }, { books }] = await Promise.all([
      hymns.hymnals(),
      bible.books(DEFAULT_TRANSLATION),
    ]);
    entries.push(
      ...hymnals.map((hymnal) => ({
        path: `/hymnals/${hymnal.slug}`,
        changefreq: "monthly" as const,
      })),
    );
    entries.push(
      ...books.map((book) => ({
        path: `/bible/${DEFAULT_TRANSLATION.toLowerCase()}/${book.slug}`,
        changefreq: "yearly" as const,
      })),
    );
    for (let page = 1; page <= 20; page += 1) {
      const result = await hymns.list({ page, limit: 100 });
      entries.push(
        ...result.items.map((hymn) => ({
          path: `/hymns/${hymn.slug}`,
          changefreq: "monthly" as const,
        })),
      );
      if (page >= result.totalPages) break;
    }
  } catch {
    // The API being down should not break the sitemap entirely.
  }
  return entries;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Static pages, every hymn, every hymnal and every book's first chapter. Built per request, cached for an hour. */
export async function GET(): Promise<Response> {
  const entries = await collect();
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map(
      (entry) =>
        `  <url><loc>${escapeXml(`${SITE_URL}${entry.path}`)}</loc><changefreq>${entry.changefreq}</changefreq></url>`,
    )
    .join("\n")}\n</urlset>\n`;
  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

import { isLegalSlug, LEGAL_DOCUMENTS, LEGAL_SLUGS } from "@scriptune/contracts";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Page } from "@/components/layout/page";

type Params = Promise<{ doc: string }>;

export function generateStaticParams() {
  return LEGAL_SLUGS.map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { doc } = await params;
  if (!isLegalSlug(doc)) notFound();
  const document = LEGAL_DOCUMENTS[doc];
  return { title: document.title, description: document.summary };
}

/** Terms, privacy and licences, rendered from the shared legal text. */
export default async function LegalPage({ params }: { params: Params }) {
  const { doc } = await params;
  if (!isLegalSlug(doc)) notFound();
  const document = LEGAL_DOCUMENTS[doc];
  const updated = new Date(document.updatedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  return (
    <Page width="narrow">
      <nav className="mb-8 flex flex-wrap gap-2 text-sm" aria-label="Legal documents">
        {LEGAL_SLUGS.map((slug) => (
          <Link key={slug} href={`/legal/${slug}`} className={`rounded-full border px-3 py-1 ${slug === doc ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {LEGAL_DOCUMENTS[slug].title}
          </Link>
        ))}
      </nav>
      <header className="mb-10">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">Legal</p>
        <h1 className="display-serif mt-2 text-4xl sm:text-5xl">{document.title}</h1>
        <p className="mt-3 text-muted-foreground">{document.summary}</p>
        <p className="mt-2 text-xs text-muted-foreground">Last updated {updated}</p>
      </header>
      <div className="space-y-8">
        {document.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="display-serif text-2xl">{section.heading}</h2>
            {section.paragraphs.map((paragraph, index) => <p key={index} className="mt-3 leading-relaxed text-foreground/90">{paragraph}</p>)}
            {section.bullets && (
              <ul className="mt-3 list-disc space-y-1.5 pl-6 text-foreground/90">
                {section.bullets.map((bullet, index) => <li key={index}>{bullet}</li>)}
              </ul>
            )}
          </section>
        ))}
      </div>
    </Page>
  );
}

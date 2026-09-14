import type { Metadata } from "next";
import { Bug, GitBranch, Lightbulb, Mail } from "lucide-react";
import { LEGAL_CONTACT, PROJECT_LINKS } from "@scriptune/contracts";
import { Page, PageHeading } from "@/components/layout/page";
import { SupportWidget } from "@/components/support/support-widget";

export const metadata: Metadata = { title: "Support", description: "Report a problem, suggest a hymnal, contribute code, or help keep Scriptune running." };

const GITHUB_LINKS = [
  { href: PROJECT_LINKS.reportProblem, icon: Bug, title: "Report a problem", text: "A hymn that will not identify, a verse in the wrong place, an app that crashed. Say what you did and what happened." },
  { href: PROJECT_LINKS.suggest, icon: Lightbulb, title: "Suggest something", text: "A hymnal your church sings from, a translation, a feature you wish were there." },
  { href: PROJECT_LINKS.github, icon: GitBranch, title: "Read or improve the code", text: "Scriptune is open source. Fork it, fix it, send a pull request." },
];

export default function SupportPage() {
  return (
    <Page>
      <PageHeading eyebrow="Support" title="Keep the singing going" lede="Scriptune is built by one person for churches that sing. There are two ways to help, and both matter." />

      <section aria-labelledby="build" className="grid gap-6 md:grid-cols-[1fr_2fr] md:gap-10">
        <div>
          <h2 id="build" className="display-serif text-2xl">Help build it</h2>
          <p className="mt-2 text-sm text-muted-foreground">Everything lives on GitHub: the code, the open problems and the plans. An issue takes two minutes and is the surest way to get something fixed.</p>
        </div>
        <ul className="grid gap-3">
          {GITHUB_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} target="_blank" rel="noopener noreferrer" className="flex gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-secondary/60">
                <link.icon className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
                <span>
                  <span className="display-serif block text-xl">{link.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{link.text}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="running" className="mt-14 grid gap-6 border-t border-border/60 pt-12 md:grid-cols-[1fr_2fr] md:gap-10">
        <div>
          <h2 id="running" className="display-serif text-2xl">Help keep it running</h2>
          <p className="mt-2 text-sm text-muted-foreground">Identifying a hymn costs a little every time: the servers, the database and the speech-to-text behind the microphone. Scriptune has no adverts and no paid tier, so gifts are what pay for it.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <p className="display-serif text-2xl">A gift of any size</p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">One-off or monthly, whatever suits. You will see exactly where it goes on GitHub.</p>
          <div className="mt-6"><SupportWidget /></div>
        </div>
      </section>

      <p className="mt-14 flex items-center gap-2 text-sm text-muted-foreground">
        <Mail className="size-4" aria-hidden /> Prefer email? <a href={`mailto:${LEGAL_CONTACT.email}`} className="underline underline-offset-4 hover:text-foreground">{LEGAL_CONTACT.email}</a>
      </p>
    </Page>
  );
}

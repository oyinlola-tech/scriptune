import { BookOpen, Ear, Sparkles } from "lucide-react";
import Link from "next/link";
import { IdentifyPanel } from "@/components/identify/identify-panel";
import { RecentlyIdentified } from "@/components/identify/recent";
import { VerseOfTheDay } from "@/components/bible/verse-of-the-day";

const STEPS = [
  { icon: Ear, title: "Listen", text: "Hold the phone toward the choir, the pulpit, or hum it yourself, for a few seconds." },
  { icon: Sparkles, title: "Match", text: "Scriptune compares what it heard against every verse and hymn it knows." },
  { icon: BookOpen, title: "Read on", text: "Open the words, the passage around them, and the hymns that sing it." },
];

/**
 * The home page is the tool. An eyebrow, one serif line, the listening
 * disc, and quiet alternatives underneath. Everything enters once, in order.
 */
export default function HomePage() {
  return (
    <div className="page-gutter mx-auto w-full max-w-6xl pb-16 pt-10 sm:pt-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="enter-1 text-xs font-medium uppercase tracking-[0.2em] text-gold">Scriptune</p>
        <h1 className="enter-2 display-serif mt-3 text-4xl sm:text-6xl">What are you looking for?</h1>
        <p className="enter-3 mt-4 text-balance text-muted-foreground">A hymn the choir just started. A verse the preacher quoted. Let it listen and find out.</p>
      </div>
      <div className="enter-4 mt-10">
        <IdentifyPanel />
      </div>
      <div className="enter-4 mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <Link href="/search" className="underline-offset-4 hover:text-foreground hover:underline">Search the words instead</Link>
        <span aria-hidden>·</span>
        <span className="inline-flex items-center gap-2" title="Melody recognition is coming in a later release">Hum a hymn <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">Soon</span></span>
      </div>
      <div className="enter-4 mx-auto mt-12 max-w-2xl"><VerseOfTheDay /></div>
      <RecentlyIdentified />
      <section className="mx-auto mt-20 max-w-4xl" aria-labelledby="how">
        <h2 id="how" className="mb-6 text-center text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <step.icon className="size-5 text-gold" />
                <span className="font-mono text-xs text-muted-foreground">{index + 1} / {STEPS.length}</span>
              </div>
              <p className="display-serif mt-4 text-2xl">{step.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

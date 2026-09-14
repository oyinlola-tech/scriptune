"use client";

import { Page } from "@/components/layout/page";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Page width="narrow" className="flex flex-1 flex-col justify-center py-24 text-center">
      <p className="display-serif text-[clamp(5rem,20vw,10rem)] leading-none text-foreground/15">Hmm</p>
      <h1 className="display-serif -mt-4 text-3xl sm:text-4xl">Something went wrong on our side.</h1>
      <p className="mt-3 text-muted-foreground">It is not you. Try again in a moment.</p>
      <div className="mt-8"><Button className="rounded-full" onClick={reset}>Try again</Button></div>
      {error.digest && <p className="mt-6 font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>}
    </Page>
  );
}

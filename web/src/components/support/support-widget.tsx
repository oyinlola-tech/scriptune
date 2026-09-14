"use client";

import { Heart } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PROJECT_LINKS, givingWidgetUrl } from "@scriptune/contracts";

/**
 * "Support Scriptune" opens the giving widget in a dialog. The frame is only
 * created once opened, so nothing third-party loads for people who just read.
 */
export function SupportWidget() {
  const { resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scheme = resolvedTheme === "dark" ? "dark" : "light";
  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setLoaded(false); }}>
      <DialogTrigger render={<Button size="lg" className="rounded-full px-6" />}>
        <Heart data-icon="inline-start" /> Support Scriptune
      </DialogTrigger>
      <DialogContent className="max-w-lg p-0 sm:rounded-3xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="display-serif text-2xl">Thank you</DialogTitle>
          <DialogDescription>Whatever you give keeps the servers up and the words free for every congregation.</DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6">
          <div className="relative h-[600px] overflow-hidden rounded-xl">
            {!loaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground" aria-live="polite">
                <span>Loading the giving form…</span>
                <a href={PROJECT_LINKS.give} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-foreground">Open it in a new tab instead</a>
              </div>
            )}
            {open && (
              <iframe
                src={givingWidgetUrl(scheme)}
                title="Support Scriptune"
                width="100%"
                height="600"
                onLoad={() => setLoaded(true)}
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                className={`relative w-full border-0 transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

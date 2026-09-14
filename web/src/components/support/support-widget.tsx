"use client";

import { Heart } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SUPPORT_EMBED_URL } from "@/lib/site";

/** The site palette, handed to the widget so it sits on the page like everything else. */
const PALETTE = {
  light: { color: "#26231f", textColor: "#f6f2e9", cardBg: "#fbf9f4", cardText: "#26231f" },
  dark: { color: "#efe9dd", textColor: "#171513", cardBg: "#1f1c19", cardText: "#efe9dd" },
} as const;

function embedUrl(scheme: "light" | "dark"): string {
  const params = new URLSearchParams({ ...PALETTE[scheme], theme: "transparent" });
  return `${SUPPORT_EMBED_URL}?${params.toString()}`;
}

/**
 * "Support Scriptune" opens the giving widget in a dialog. The frame is only
 * created once opened, so nothing third-party loads for people who just read.
 */
export function SupportWidget() {
  const { resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const scheme = resolvedTheme === "dark" ? "dark" : "light";
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" className="rounded-full px-6" />}>
        <Heart data-icon="inline-start" /> Support Scriptune
      </DialogTrigger>
      <DialogContent className="max-w-lg p-0 sm:rounded-3xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="display-serif text-2xl">Thank you</DialogTitle>
          <DialogDescription>Whatever you give keeps the servers up and the words free for every congregation.</DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6">
          {open && (
            <iframe
              src={embedUrl(scheme)}
              title="Support Scriptune"
              width="100%"
              height="600"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              className="w-full rounded-xl border-0"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

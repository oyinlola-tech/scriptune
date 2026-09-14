"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Shares the page with the device's share sheet, or copies the link. */
export function ShareButton({ title, text, path }: { title: string; text?: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = `${window.location.origin}${path}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // Cancelled or unsupported payload; fall through to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the link.");
    }
  };
  return (
    <Button variant="outline" size="sm" className="rounded-full" onClick={() => void share()}>
      {copied ? <Check data-icon="inline-start" className="text-gold" /> : <Share2 data-icon="inline-start" />} Share
    </Button>
  );
}

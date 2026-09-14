"use client";

import { Loader2, Mic, Square } from "lucide-react";
import type { RecorderStatus } from "@/lib/recorder/use-recorder";
import { cn } from "@/lib/utils";

interface ListenButtonProps {
  status: RecorderStatus;
  level: number;
  elapsedMs: number;
  onStart: () => void;
  onStop: () => void;
}

function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `0:${String(seconds).padStart(2, "0")}`;
}

/**
 * The listening disc, drawn like a choir leader's pitch pipe: an ink disc
 * inside a ticked gold dial. Idle, it breathes slowly. Listening, the dial
 * turns, sound rings spread outward and the disc swells with the room.
 */
export function ListenButton({ status, level, elapsedMs, onStart, onStop }: ListenButtonProps) {
  const recording = status === "recording";
  const busy = status === "requesting" || status === "processing";
  const label =
    status === "recording" ? `Listening ${formatElapsed(elapsedMs)}` :
    status === "processing" ? "Identifying…" :
    status === "requesting" ? "Allow the microphone to continue" :
    status === "denied" ? "Microphone blocked. Allow it in your browser, or type the words." :
    status === "unsupported" ? "This browser cannot record. Type the words instead." :
    "Tap to listen";

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex size-64 items-center justify-center">
        {recording && (
          <>
            <span className="absolute inset-8 rounded-full bg-gold/35 animate-listen" />
            <span className="absolute inset-8 rounded-full bg-gold/25 animate-listen [animation-delay:0.6s]" />
            <span className="absolute inset-8 rounded-full bg-gold/15 animate-listen [animation-delay:1.2s]" />
          </>
        )}
        <span
          aria-hidden
          className={cn("absolute inset-2 rounded-full transition-opacity duration-500", recording ? "opacity-100 animate-dial" : "opacity-45", busy && "opacity-25")}
          style={{
            background: "repeating-conic-gradient(from 0deg, var(--gold) 0deg 1.4deg, transparent 1.4deg 6deg)",
            mask: "radial-gradient(circle, transparent 60%, black 61%, black 66%, transparent 67%)",
            WebkitMask: "radial-gradient(circle, transparent 60%, black 61%, black 66%, transparent 67%)",
          }}
        />
        <button
          type="button"
          onClick={recording ? onStop : onStart}
          disabled={busy || status === "unsupported"}
          aria-pressed={recording}
          aria-label={recording ? "Stop listening" : "Start listening"}
          style={{ transform: recording ? `scale(${1 + level * 0.14})` : undefined }}
          className={cn(
            "relative z-10 flex size-44 items-center justify-center rounded-full bg-primary text-primary-foreground",
            "shadow-[0_24px_70px_-24px_color-mix(in_oklch,var(--ink)_70%,transparent)] transition-[transform,box-shadow] duration-150",
            "outline-none focus-visible:ring-4 focus-visible:ring-gold/60 disabled:opacity-60",
            !recording && !busy && "animate-breathe",
            recording && "ring-4 ring-gold",
          )}
        >
          {busy ? <Loader2 className="size-12 animate-spin" /> : recording ? <Square className="size-11 fill-current" /> : <Mic className="size-14" strokeWidth={1.75} />}
        </button>
      </div>
      <p className={cn("max-w-xs text-center text-sm font-medium", recording ? "text-gold" : "text-muted-foreground")} aria-live="polite">{label}</p>
    </div>
  );
}

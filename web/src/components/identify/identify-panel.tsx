"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Keyboard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, library, recognition, verseKey, type RecognitionMode, type RecognitionResultDto } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useGuestHistory } from "@/lib/history/guest-history";
import { keys } from "@/lib/query/keys";
import { useRecorder } from "@/lib/recorder/use-recorder";
import { ListenButton } from "./listen-button";
import { ModeToggle } from "./mode-toggle";
import { ResultView } from "./result-view";

function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 503) return "Audio recognition is not available right now. You can still type the words.";
    if (error.status === 422) return "We could not hear any words in that clip. Try again a little closer.";
    if (error.status === 429) return "Too many tries in a minute. Take a breath and try again shortly.";
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

/** The identify flow: choose what to listen for, listen (or type), see the result. */
export function IdentifyPanel() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isMember } = useAuth();
  const addHistory = useGuestHistory((state) => state.add);
  const [mode, setMode] = useState<RecognitionMode>("auto");
  const [typed, setTyped] = useState("");
  const [showTyping, setShowTyping] = useState(false);
  const [result, setResult] = useState<RecognitionResultDto | null>(null);

  const remember = (outcome: RecognitionResultDto, usedMode: RecognitionMode) => {
    queryClient.setQueryData(keys.attempt(outcome.attemptId), outcome);
    const best = outcome.best;
    const target = best === null ? {} : best.type === "verse"
      ? { type: "verse" as const, key: verseKey(best.translation, best.book, best.chapter, best.verse) }
      : { type: "hymn" as const, key: best.slug };
    if (isMember) {
      // The account keeps its own history; sync it and refresh the History page.
      void library.addHistory({ kind: "identify", mode: usedMode, query: outcome.transcript, attemptId: outcome.attemptId, ...target })
        .then(() => queryClient.invalidateQueries({ queryKey: keys.history() }))
        .catch(() => undefined);
    } else {
      addHistory({
        kind: "identify",
        mode: usedMode,
        query: outcome.transcript,
        attemptId: outcome.attemptId,
        label: best === null ? outcome.transcript : best.type === "verse" ? best.reference : best.title,
        ...target,
      });
    }
    setResult(outcome);
    window.history.replaceState(null, "", `/results/${outcome.attemptId}`);
  };

  const fromAudio = useMutation({
    mutationFn: (variables: { blob: Blob; mode: RecognitionMode }) => recognition.audio(variables.blob, variables.mode),
    onSuccess: (outcome, variables) => remember(outcome, variables.mode),
    onError: (error) => toast.error(describeError(error)),
  });
  const fromText = useMutation({
    mutationFn: (variables: { text: string; mode: RecognitionMode }) => recognition.text(variables.text, variables.mode),
    onSuccess: (outcome, variables) => remember(outcome, variables.mode),
    onError: (error) => toast.error(describeError(error)),
  });

  const recorder = useRecorder({ maxDurationMs: 15_000, onClip: (blob) => fromAudio.mutateAsync({ blob, mode }).then(() => undefined, () => undefined) });

  const submitTyped = (event: FormEvent) => {
    event.preventDefault();
    if (typed.trim().length >= 2) fromText.mutate({ text: typed.trim(), mode });
  };

  const reset = () => {
    setResult(null);
    router.replace("/");
  };

  if (result !== null) {
    return <ResultView result={result} onReset={reset} />;
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <ModeToggle value={mode} onChange={setMode} />
      <ListenButton status={fromText.isPending ? "processing" : recorder.status} level={recorder.level} elapsedMs={recorder.elapsedMs} onStart={() => void recorder.start()} onStop={recorder.stop} />
      {recorder.status === "denied" && (
        <p className="max-w-sm text-center text-sm text-muted-foreground">Allow microphone access in your browser settings, or type the words instead.</p>
      )}
      {showTyping ? (
        <form onSubmit={submitTyped} className="flex w-full max-w-md gap-2 animate-rise">
          <Input autoFocus value={typed} onChange={(event) => setTyped(event.target.value)} placeholder="Type the words you remember" aria-label="Words you heard" className="h-11 rounded-full bg-card px-5" />
          <Button type="submit" className="h-11 rounded-full px-5" disabled={typed.trim().length < 2 || fromText.isPending}>Find</Button>
        </form>
      ) : (
        <button type="button" onClick={() => setShowTyping(true)} className="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          <Keyboard className="size-4" /> Type the words instead
        </button>
      )}
    </div>
  );
}

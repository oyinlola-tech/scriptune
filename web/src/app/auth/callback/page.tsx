"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Page } from "@/components/layout/page";
import { auth, library } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toHistoryInput, useGuestHistory } from "@/lib/history/guest-history";

/** Only ever bounce to a same-origin path, never off-site. */
function safeRedirect(value: string | null): string {
  if (value === null || /[\\]/.test(value) || !value.startsWith("/") || value.startsWith("//")) return "/library";
  try {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin ? url.pathname + url.search + url.hash : "/library";
  } catch {
    return "/library";
  }
}

function Exchange() {
  const params = useSearchParams();
  const router = useRouter();
  const { signIn } = useAuth();
  const guestEntries = useGuestHistory((state) => state.entries);
  const clearGuest = useGuestHistory((state) => state.clear);
  const [failed, setFailed] = useState<string | null>(params.get("error"));
  const started = useRef(false);

  useEffect(() => {
    const code = params.get("code");
    if (started.current || code === null) return;
    started.current = true;
    const redirect = params.get("redirect");
    void (async () => {
      try {
        const session = await auth.googleExchange(code);
        signIn(session);
        if (guestEntries.length > 0) {
          try {
            await library.importHistory(guestEntries.map(toHistoryInput));
            clearGuest();
          } catch {
            // best effort
          }
        }
        router.replace(safeRedirect(redirect));
      } catch {
        setFailed("exchange_failed");
      }
    })();
  }, [params, router, signIn, guestEntries, clearGuest]);

  if (failed !== null) {
    return (
      <div className="text-center">
        <h1 className="display-serif text-4xl">Sign-in did not complete</h1>
        <p className="mt-2 text-muted-foreground">Google did not finish signing you in ({failed.replace(/_/g, " ")}). Please try again.</p>
        <a href="/auth/login" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">Back to sign in</a>
      </div>
    );
  }
  return <p className="text-center text-muted-foreground">Finishing sign-in…</p>;
}

export default function CallbackPage() {
  return <Page width="narrow"><Suspense><Exchange /></Suspense></Page>;
}

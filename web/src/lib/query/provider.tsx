"use client";

import { QueryClient, QueryClientProvider, type QueryClient as QueryClientType } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";
import { useSessionRestore } from "@/lib/auth";
import { useAuthStore } from "@/lib/auth/store";

function SessionRestorer() {
  useSessionRestore();
  return null;
}

/** Drops one user's cached library/history when the account changes, so it never shows to the next. */
function CacheGuard({ client }: { client: QueryClientType }) {
  useEffect(() => {
    let previous = useAuthStore.getState().user?.id ?? null;
    return useAuthStore.subscribe((state) => {
      const current = state.user?.id ?? null;
      if (current !== previous) {
        previous = current;
        client.clear();
      }
    });
  }, [client]);
  return null;
}

/** App-wide providers: theme, server-state cache, session restoration. */
export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false } },
      }),
  );
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={client}>
        <SessionRestorer />
        <CacheGuard client={client} />
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

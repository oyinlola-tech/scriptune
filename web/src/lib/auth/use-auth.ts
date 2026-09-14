"use client";

import { useEffect } from "react";
import { settleSession, useAuthStore } from "./store";

/** Restores the session once on mount and exposes the current auth state. */
export function useAuth() {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const signIn = useAuthStore((state) => state.signIn);
  const signOut = useAuthStore((state) => state.signOut);
  return { status, user, isMember: status === "member", signIn, signOut };
}

/** Mount once near the root: settles the session as soon as storage has been read. */
export function useSessionRestore() {
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      settleSession();
      return undefined;
    }
    return useAuthStore.persist.onFinishHydration(settleSession);
  }, []);
}

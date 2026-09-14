"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { auth as authApi, refreshTokens, setTokenSource, type AuthSessionDto, type UserDto } from "@/lib/api";
import { useGuestHistory } from "@/lib/history/guest-history";

export type AuthStatus = "loading" | "guest" | "member";

interface AuthState {
  status: AuthStatus;
  user: UserDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  signIn: (session: AuthSessionDto) => void;
  signOut: (options?: { remote?: boolean }) => Promise<void>;
  restore: () => Promise<void>;
  refresh: () => Promise<string | null>;
}

let refreshing: Promise<string | null> | null = null;

/**
 * Called once the persisted state is on hand: a stored refresh token becomes
 * a live session, no token means a guest. Without this the header would sit
 * on its loading placeholder for first-time visitors.
 */
export function settleSession(): void {
  const state = useAuthStore.getState();
  if (state.refreshToken === null) {
    useAuthStore.setState({ status: "guest" });
  } else {
    void state.restore();
  }
}

/**
 * Who is signed in. The access token stays in memory; only the refresh token
 * and the user profile persist, so a reload restores the session by refreshing.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      status: "loading",
      user: null,
      accessToken: null,
      refreshToken: null,

      signIn: (session) => {
        set({ status: "member", user: session.user, accessToken: session.tokens.accessToken, refreshToken: session.tokens.refreshToken });
      },

      signOut: async (options = {}) => {
        const { accessToken, refreshToken } = get();
        // Revoke the session on the server first, while the access token is still attached,
        // so a leaked refresh token cannot outlive "Sign out".
        if (options.remote !== false && accessToken !== null) {
          try {
            await authApi.logout(refreshToken ?? undefined);
          } catch {
            // Best effort: the local session is cleared regardless.
          }
        }
        set({ status: "guest", user: null, accessToken: null, refreshToken: null });
        // This device's guest history belongs to whoever signed in; never carry it to the next account.
        useGuestHistory.getState().clear();
      },

      refresh: async () => {
        if (refreshing !== null) return refreshing;
        refreshing = (async () => {
          const { refreshToken } = get();
          if (refreshToken === null) {
            set({ status: "guest", user: null, accessToken: null });
            return null;
          }
          let tokens;
          try {
            tokens = await refreshTokens(refreshToken);
          } catch {
            // Transient (429, 5xx, offline): keep the refresh token so a later attempt can recover.
            set({ status: "guest", accessToken: null });
            return null;
          }
          if (tokens === null) {
            set({ status: "guest", user: null, accessToken: null, refreshToken: null });
            return null;
          }
          set({ status: "member", accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
          return tokens.accessToken;
        })().finally(() => {
          refreshing = null;
        });
        return refreshing;
      },

      restore: async () => {
        const token = await get().refresh();
        if (token === null) return;
        try {
          const { user } = await authApi.me();
          set({ user });
        } catch {
          await get().signOut({ remote: false });
        }
      },
    }),
    {
      name: "scriptune.auth",
      partialize: (state) => ({ refreshToken: state.refreshToken, user: state.user }),
    },
  ),
);

setTokenSource({
  getAccessToken: () => useAuthStore.getState().accessToken,
  refresh: () => useAuthStore.getState().refresh(),
});

// Keep tabs in step: when another tab rotates the refresh token, pick up the new one
// instead of later refreshing with a stale token and losing the whole session.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === "scriptune.auth") void useAuthStore.persist.rehydrate();
  });
}

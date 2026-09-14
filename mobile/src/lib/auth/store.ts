import { secrets } from "./secret-store";
import { create } from "zustand";
import type { AuthSessionDto, TokensDto, UserDto } from "@scriptune/contracts";
import { auth, client, library } from "../api";
import { queryClient } from "../query";
import { toHistoryInput, useGuestHistory } from "../history";

const REFRESH_KEY = "scriptune.refreshToken";

interface AuthState {
  status: "loading" | "guest" | "member";
  user: UserDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  restore(): Promise<void>;
  signIn(session: AuthSessionDto): Promise<void>;
  signOut(): Promise<void>;
  refresh(): Promise<string | null>;
}

async function persistRefresh(token: string | null): Promise<void> {
  if (token === null) await secrets.delete(REFRESH_KEY);
  else await secrets.set(REFRESH_KEY, token);
}

/** Guest history moves into the account on sign in; best effort, never blocks. */
async function importGuestHistory(): Promise<void> {
  const { entries, clear } = useGuestHistory.getState();
  if (entries.length === 0) return;
  try {
    await library.importHistory(entries.map(toHistoryInput));
    clear();
  } catch {
    // The entries stay on the device and are retried on the next sign in.
  }
}

/**
 * Session state. The refresh token lives in the device keychain, the access
 * token only in memory, the same split the web app uses.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  status: "loading",
  user: null,
  accessToken: null,
  refreshToken: null,

  async restore() {
    const refreshToken = await secrets.get(REFRESH_KEY);
    if (refreshToken === null) {
      set({ status: "guest" });
      return;
    }
    set({ refreshToken });
    let token: string | null;
    try {
      token = await get().refresh();
    } catch {
      token = null;
    }
    if (token === null) {
      // Offline or a hiccup: stay a guest for now but keep the stored token for the next launch.
      set({ status: "guest" });
      return;
    }
    try {
      const { user } = await auth.me();
      set({ user, status: "member" });
    } catch {
      set({ status: "guest" });
    }
  },

  async signIn(session) {
    await persistRefresh(session.tokens.refreshToken);
    set({ user: session.user, accessToken: session.tokens.accessToken, refreshToken: session.tokens.refreshToken, status: "member" });
    await importGuestHistory();
  },

  async signOut() {
    const { refreshToken } = get();
    if (refreshToken !== null) {
      try {
        await auth.logout(refreshToken);
      } catch {
        // The session is cleared locally regardless.
      }
    }
    await persistRefresh(null);
    set({ user: null, accessToken: null, refreshToken: null, status: "guest" });
    // Never show one account's library to the next person on this device.
    queryClient.removeQueries({ queryKey: ["library"] });
  },

  async refresh() {
    const { refreshToken } = get();
    if (refreshToken === null) return null;
    let tokens: TokensDto | null;
    try {
      tokens = await client.refreshTokens(refreshToken);
    } catch {
      // Transient (offline, 5xx, rate limit): keep the token so a later attempt can recover.
      set({ accessToken: null });
      return null;
    }
    if (tokens === null) {
      // Definitive (401/403): the session is gone.
      await persistRefresh(null);
      set({ user: null, accessToken: null, refreshToken: null, status: "guest" });
      return null;
    }
    await persistRefresh(tokens.refreshToken);
    set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    return tokens.accessToken;
  },
}));

client.setTokenSource({
  getAccessToken: () => useAuthStore.getState().accessToken,
  refresh: () => useAuthStore.getState().refresh(),
});

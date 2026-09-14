import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface Extra {
  apiUrl?: string;
  siteUrl?: string;
  allowApiOverride?: boolean;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

/** The API address baked into this build (EXPO_PUBLIC_API_URL, else app.json "extra"). */
export const DEFAULT_API_URL = (process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? "http://localhost:4000").replace(/\/$/, "");
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL ?? extra.siteUrl ?? "http://localhost:3001").replace(/\/$/, "");
export const DEFAULT_TRANSLATION = "KJV";

/**
 * Whether the in-app "Connection" override is offered. Only in development
 * builds, or when a build explicitly opts in via `extra.allowApiOverride`,
 * so a release build cannot be told to send its tokens to another host.
 */
export const ALLOW_API_OVERRIDE = __DEV__ || extra.allowApiOverride === true;

interface ApiConfigState {
  /** An address chosen on the device that overrides the baked-in one, or null. */
  override: string | null;
  /** True once the persisted override has been read from storage. */
  hydrated: boolean;
  setOverride(url: string | null): void;
}

/**
 * Lets a development build keep working when the server moves, for example
 * when the tunnel restarts with a new address. Persisted per device.
 */
export const useApiConfig = create<ApiConfigState>()(
  persist(
    (set) => ({
      override: null,
      hydrated: false,
      setOverride: (url) => set({ override: url === null ? null : url.trim().replace(/\/$/, "") }),
    }),
    {
      name: "scriptune.api",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ override: state.override }),
      onRehydrateStorage: () => (state) => {
        if (!ALLOW_API_OVERRIDE && state?.override != null) state.override = null;
        useApiConfig.setState({ hydrated: true });
      },
    },
  ),
);

/** The address the app is talking to right now. */
export function getApiUrl(): string {
  const { override } = useApiConfig.getState();
  return (ALLOW_API_OVERRIDE ? override : null) ?? DEFAULT_API_URL;
}

function isPrivateHost(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
}

/**
 * Accepts an http(s) URL with a host. Plain http is allowed only for private
 * hosts (a laptop or tunnel on the same network); public hosts must use https
 * so tokens are never sent in the clear.
 */
export function isValidApiUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    if (url.hostname === "") return false;
    if (url.protocol === "https:") return true;
    return url.protocol === "http:" && isPrivateHost(url.hostname);
  } catch {
    return false;
  }
}

/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import { NetworkOnly, Serwist, type PrecacheEntry, type RuntimeCaching, type SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const API_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").origin;
  } catch {
    return "http://localhost:4000";
  }
})();

/**
 * Never cache API responses. They are per-account (library, notes, history,
 * the signed-in user) and keyed only by URL, so a cached copy would outlive
 * sign-out and could be served to the next person on the device. Everything
 * else (the app shell, fonts, images) keeps Serwist's defaults.
 */
const runtimeCaching: RuntimeCaching[] = [
  { matcher: ({ url }) => url.origin === API_ORIGIN, handler: new NetworkOnly() },
  { matcher: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/auth/"), handler: new NetworkOnly() },
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
});

serwist.addEventListeners();

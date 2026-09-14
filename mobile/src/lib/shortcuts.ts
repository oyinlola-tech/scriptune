/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform } from "react-native";
import type { RouterAction } from "expo-quick-actions/router";

interface QuickActionsModule {
  setItems<T>(items: T[]): Promise<void>;
}
interface QuickActionsRouter {
  useQuickActionRouting(): void;
}

/**
 * App-icon shortcuts ("Listen now", "Search"). The native module is absent
 * in Expo Go, so the library is loaded defensively and everything becomes a
 * no-op there instead of crashing at import time.
 */
function load(): { actions: QuickActionsModule; router: QuickActionsRouter } | null {
  try {
    return { actions: require("expo-quick-actions") as QuickActionsModule, router: require("expo-quick-actions/router") as QuickActionsRouter };
  } catch {
    return null;
  }
}

const modules = load();

export const SHORTCUTS: RouterAction[] = [
  { id: "listen", title: "Listen now", subtitle: "Identify what is playing", icon: Platform.OS === "ios" ? "symbol:mic.fill" : "listen", params: { href: "/listen" } },
  { id: "search", title: "Search", subtitle: "Hymns and verses", icon: Platform.OS === "ios" ? "symbol:magnifyingglass" : "search", params: { href: "/search" } },
];

/** Routes a tapped shortcut to its `href`. Call once in the root layout. */
export function useShortcutRouting(): void {
  // Stable across renders: the module either loaded at startup or it did not.
  if (modules !== null) modules.router.useQuickActionRouting();
}

/** Registers the shortcuts with the OS; silently does nothing where unsupported. */
export async function registerShortcuts(): Promise<void> {
  if (modules === null) return;
  await modules.actions.setItems(SHORTCUTS).catch(() => undefined);
}

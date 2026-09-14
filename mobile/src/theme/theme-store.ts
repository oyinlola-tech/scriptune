import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemePreference = "system" | "light" | "dark";

interface ThemeState {
  preference: ThemePreference;
  setPreference(next: ThemePreference): void;
}

/** Pushes the choice into React Native, so every useColorScheme() in the app follows it. */
export function applyThemePreference(preference: ThemePreference): void {
  // react-native-web has no setColorScheme; the browser keeps following the device there.
  if (typeof Appearance.setColorScheme !== "function") return;
  Appearance.setColorScheme(preference === "system" ? "unspecified" : preference);
}

/** Light, dark, or follow the device. Persisted per device; applied on launch by the root layout. */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: "system",
      setPreference: (next) => {
        applyThemePreference(next);
        set({ preference: next });
      },
    }),
    { name: "scriptune.theme", storage: createJSONStorage(() => AsyncStorage) },
  ),
);

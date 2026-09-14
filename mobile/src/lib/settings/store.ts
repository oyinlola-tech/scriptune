import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SettingsState {
  /** Start listening as soon as the app opens on the Identify tab, like Shazam's auto mode. */
  autoListen: boolean;
  setAutoListen(next: boolean): void;
}

/** Small on-device preferences that are not about appearance or connection. */
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      autoListen: false,
      setAutoListen: (next) => set({ autoListen: next }),
    }),
    { name: "scriptune.settings", storage: createJSONStorage(() => AsyncStorage) },
  ),
);

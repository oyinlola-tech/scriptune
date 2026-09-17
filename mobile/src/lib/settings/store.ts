import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SettingsState {
  /** Start listening as soon as the app opens on the Identify tab, like Shazam's auto mode. */
  autoListen: boolean;
  setAutoListen(next: boolean): void;
  /** How large the words of hymns and scripture are set. */
  readingSize: ReadingSize;
  setReadingSize(next: ReadingSize): void;
  /** The translation last chosen on the Bible tab, so it opens there again. */
  translation: string | null;
  setTranslation(next: string): void;
}

export type ReadingSize = "small" | "medium" | "large" | "xlarge";

/** Multipliers for the reading text; "medium" is the size the app was designed at. */
export const READING_SCALE: Record<ReadingSize, number> = { small: 0.9, medium: 1, large: 1.2, xlarge: 1.4 };

/** Small on-device preferences that are not about appearance or connection. */
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      autoListen: false,
      setAutoListen: (next) => set({ autoListen: next }),
      readingSize: "medium",
      setReadingSize: (next) => set({ readingSize: next }),
      translation: null,
      setTranslation: (next) => set({ translation: next }),
    }),
    { name: "scriptune.settings", storage: createJSONStorage(() => AsyncStorage) },
  ),
);

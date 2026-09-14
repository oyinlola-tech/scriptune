import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const KEY = "scriptune.onboarded";

interface OnboardingState {
  status: "unknown" | "pending" | "done";
  load(): Promise<void>;
  complete(): Promise<void>;
  reset(): Promise<void>;
}

/** Whether the person has been through the three welcome screens on this device. */
export const useOnboarding = create<OnboardingState>((set) => ({
  status: "unknown",
  async load() {
    try {
      set({ status: (await AsyncStorage.getItem(KEY)) === "1" ? "done" : "pending" });
    } catch {
      set({ status: "pending" });
    }
  },
  async complete() {
    set({ status: "done" });
    await AsyncStorage.setItem(KEY, "1").catch(() => undefined);
  },
  async reset() {
    set({ status: "pending" });
    await AsyncStorage.removeItem(KEY).catch(() => undefined);
  },
}));

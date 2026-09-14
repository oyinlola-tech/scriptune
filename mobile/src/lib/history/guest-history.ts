import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { HistoryEntryInput, LibraryTargetType } from "@scriptune/contracts";

export interface GuestHistoryEntry extends HistoryEntryInput {
  id: string;
  occurredAt: string;
  label: string;
}

interface GuestHistoryState {
  entries: GuestHistoryEntry[];
  add: (entry: Omit<GuestHistoryEntry, "id" | "occurredAt">) => void;
  clear: () => void;
}

const MAX_GUEST_ENTRIES = 100;

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** What a guest identified on this device. Imported into the account on sign in. */
export const useGuestHistory = create<GuestHistoryState>()(
  persist(
    (set) => ({
      entries: [],
      add: (entry) => set((state) => ({ entries: [{ ...entry, id: newId(), occurredAt: new Date().toISOString() }, ...state.entries].slice(0, MAX_GUEST_ENTRIES) })),
      clear: () => set({ entries: [] }),
    }),
    { name: "scriptune.history", storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export function historyTarget(type: LibraryTargetType, key: string) {
  return { type, key };
}

/** Strips the device-only fields before sending an entry to the API. */
export function toHistoryInput(entry: GuestHistoryEntry): HistoryEntryInput {
  return { kind: entry.kind, mode: entry.mode, query: entry.query, type: entry.type, key: entry.key, attemptId: entry.attemptId, occurredAt: entry.occurredAt };
}

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HistoryEntryInput, LibraryTargetType } from "@/lib/api";

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

/** Recently identified items for guests, kept in this browser only. */
export const useGuestHistory = create<GuestHistoryState>()(
  persist(
    (set) => ({
      entries: [],
      add: (entry) =>
        set((state) => ({
          entries: [{ ...entry, id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`, occurredAt: new Date().toISOString() }, ...state.entries].slice(0, MAX_GUEST_ENTRIES),
        })),
      clear: () => set({ entries: [] }),
    }),
    { name: "scriptune.history" },
  ),
);

export function historyTarget(type: LibraryTargetType, key: string) {
  return { type, key };
}

/** Strips the browser-only fields before sending an entry to the API. */
export function toHistoryInput(entry: GuestHistoryEntry): HistoryEntryInput {
  return {
    kind: entry.kind,
    mode: entry.mode,
    query: entry.query,
    type: entry.type,
    key: entry.key,
    attemptId: entry.attemptId,
    occurredAt: entry.occurredAt,
  };
}

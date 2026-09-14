import { create } from "zustand";

export type ToastTone = "error" | "success" | "info";
export interface ToastItem { id: number; tone: ToastTone; message: string }

interface ToastState {
  items: ToastItem[];
  show: (tone: ToastTone, message: string) => void;
  dismiss: (id: number) => void;
}

const DURATION_MS = 4500;
let nextId = 1;

/** Brief messages for things that happened off to the side: a save that failed, a note kept. */
export const useToasts = create<ToastState>((set) => ({
  items: [],
  show: (tone, message) => {
    const id = nextId++;
    set((state) => ({ items: [...state.items.filter((item) => item.message !== message), { id, tone, message }].slice(-3) }));
    setTimeout(() => set((state) => ({ items: state.items.filter((item) => item.id !== id) })), DURATION_MS);
  },
  dismiss: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
}));

export const toast = {
  error: (message: string) => useToasts.getState().show("error", message),
  success: (message: string) => useToasts.getState().show("success", message),
  info: (message: string) => useToasts.getState().show("info", message),
};

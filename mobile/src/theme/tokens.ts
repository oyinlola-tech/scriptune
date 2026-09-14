/**
 * Scriptune palette, shared with the web app's globals.css.
 * Warm ivory paper, near-black ink, a muted gold for the one accent.
 */
export const palette = {
  light: {
    background: "#f6f2e9",
    surface: "#fbf9f4",
    ink: "#26231f",
    muted: "#6f6a62",
    border: "#e2dccf",
    gold: "#c2a24f",
    goldSoft: "#efe4c6",
    danger: "#b4433a",
  },
  dark: {
    background: "#171513",
    surface: "#1f1c19",
    ink: "#efe9dd",
    muted: "#a39c90",
    border: "#312d28",
    gold: "#cfae5c",
    goldSoft: "#3a3222",
    danger: "#e07a70",
  },
} as const;

export type Scheme = keyof typeof palette;
export type Colors = (typeof palette)[Scheme];

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 } as const;
export const radius = { sm: 8, md: 16, pill: 999 } as const;

/** Display serif for scripture and hymn moments; the system sans for everything else. */
export const fonts = {
  serif: "DMSerifDisplay_400Regular",
  sans: undefined,
  mono: "Menlo",
} as const;

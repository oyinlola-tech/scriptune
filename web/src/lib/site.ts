export const SITE_NAME = "Scriptune";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const SITE_DESCRIPTION =
  "Hear a hymn or a Bible passage and find out what it is. Scriptune listens, identifies, and shows you the words, the scripture and everything connected to it.";
export const DEFAULT_TRANSLATION = "KJV";
export const GITHUB_URL = "https://github.com/oyinlola-tech/scriptune";
/** The giving widget; colours are appended per theme by the support page. */
export const SUPPORT_EMBED_URL = "https://myhappr.com/embed/oyinlola";

export const NAV_LINKS = [
  { href: "/", label: "Identify" },
  { href: "/search", label: "Search" },
  { href: "/explore", label: "Explore" },
] as const;

/**
 * Who operates Scriptune and how to reach them. Its own module so both the
 * legal documents and the credits can use it without importing each other.
 */
export const LEGAL_CONTACT = {
  operator: "Scriptune",
  email: "hello@scriptune.app",
  website: "https://scriptune.app",
} as const;

/** Where to report, contribute and give. Shared by the web app and the mobile app. */
export const PROJECT_LINKS = {
  github: "https://github.com/oyinlola-tech/scriptune",
  reportProblem: "https://github.com/oyinlola-tech/scriptune/issues/new?labels=bug&title=Something%20went%20wrong",
  suggest: "https://github.com/oyinlola-tech/scriptune/issues/new?labels=enhancement&title=Suggestion",
  /** The giving page; `embed` renders just the widget. Colours are appended per theme. */
  give: "https://myhappr.com/oyinlola",
  giveEmbed: "https://myhappr.com/embed/oyinlola",
} as const;

/** Site palette handed to the giving widget so it matches the app in either theme. */
export const GIVING_WIDGET_COLORS = {
  light: { color: "#26231f", textColor: "#f6f2e9", cardBg: "#fbf9f4", cardText: "#26231f" },
  dark: { color: "#efe9dd", textColor: "#171513", cardBg: "#1f1c19", cardText: "#efe9dd" },
} as const;

export function givingWidgetUrl(scheme: "light" | "dark"): string {
  const params = new URLSearchParams({ ...GIVING_WIDGET_COLORS[scheme], theme: "transparent" });
  return `${PROJECT_LINKS.giveEmbed}?${params.toString()}`;
}

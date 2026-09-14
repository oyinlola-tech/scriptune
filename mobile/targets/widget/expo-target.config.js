/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: "widget",
  name: "widget",
  displayName: "Scriptune",
  bundleIdentifier: ".widget",
  icon: "../../assets/images/icon.png",
  // Widgets need iOS 17 for containerBackground and the accessory families used here.
  deploymentTarget: "17.0",
  colors: {
    $widgetBackground: "#1c1917",
    $accent: "#c9a34a",
    ink: { light: "#1c1917", dark: "#1c1917" },
    ivory: { light: "#f6f2e9", dark: "#f6f2e9" },
    gold: { light: "#c9a34a", dark: "#cfae5c" },
    paper: { light: "#f6f2e9", dark: "#1f1c19" },
    text: { light: "#26231f", dark: "#efe9dd" },
    muted: { light: "#6f6a62", dark: "#a39c90" },
  },
  frameworks: ["SwiftUI", "WidgetKit"],
};

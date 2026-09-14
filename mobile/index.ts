/* eslint-disable @typescript-eslint/no-require-imports */
import "expo-router/entry";
import { Platform } from "react-native";

// Android draws home-screen widgets through a headless task. The native module
// only exists in real builds (not Expo Go), so it is loaded defensively.
if (Platform.OS === "android") {
  try {
    const { registerWidgetTaskHandler } = require("react-native-android-widget") as typeof import("react-native-android-widget");
    const { widgetTaskHandler } = require("./src/widgets/task-handler") as typeof import("./src/widgets/task-handler");
    registerWidgetTaskHandler(widgetTaskHandler);
  } catch {
    // Expo Go: no widgets, everything else works.
  }
}

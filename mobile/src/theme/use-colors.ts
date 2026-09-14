import { useColorScheme } from "react-native";
import { palette, type Colors, type Scheme } from "./tokens";

/** The colours for the device's current appearance. */
export function useColors(): Colors {
  const scheme: Scheme = useColorScheme() === "dark" ? "dark" : "light";
  return palette[scheme];
}

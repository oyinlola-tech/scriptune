import type { ReactNode } from "react";
import { Keyboard, Pressable, type StyleProp, type ViewStyle } from "react-native";

/**
 * Closes the keyboard when the person taps empty space. Buttons, links and
 * inputs inside still win the touch, so nothing else changes. `cursor: auto`
 * keeps the web build from showing a hand over the whole page.
 */
export function DismissKeyboard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessible={false} onPress={Keyboard.dismiss} style={[{ cursor: "auto" }, style]}>
      {children}
    </Pressable>
  );
}

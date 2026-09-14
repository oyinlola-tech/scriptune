import type { ReactNode } from "react";
import { ScrollView, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, useColors } from "@/theme";
import { DismissKeyboard } from "./dismiss-keyboard";

/** A safe-area page on the ivory ground, scrolling by default. Tapping empty space or dragging closes the keyboard. */
export function Screen({ children, scroll = true, style }: { children: ReactNode; scroll?: boolean; style?: ViewStyle }) {
  const colors = useColors();
  const content = { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md, ...style };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <DismissKeyboard style={[{ flexGrow: 1 }, content]}>{children}</DismissKeyboard>
        </ScrollView>
      ) : (
        <DismissKeyboard style={[{ flex: 1 }, content]}>{children}</DismissKeyboard>
      )}
    </SafeAreaView>
  );
}

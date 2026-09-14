import { Switch, View } from "react-native";
import { useSettings } from "@/lib/settings";
import { spacing, useColors } from "@/theme";
import { Text } from "./text";

/** The Shazam-style switch: open the app and it is already listening. */
export function ListeningSettings() {
  const colors = useColors();
  const autoListen = useSettings((state) => state.autoListen);
  const setAutoListen = useSettings((state) => state.setAutoListen);
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="eyebrow" style={{ color: colors.muted }}>Listening</Text>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text>Start listening when the app opens</Text>
          <Text variant="muted" style={{ fontSize: 13 }}>The microphone starts the moment Scriptune comes to the front on the Identify tab. Recording still stops after fifteen seconds.</Text>
        </View>
        <Switch value={autoListen} onValueChange={setAutoListen} trackColor={{ true: colors.gold, false: colors.border }} thumbColor={colors.surface} accessibilityLabel="Start listening when the app opens" />
      </View>
      <Text variant="muted" style={{ fontSize: 13 }}>Tip: add the Scriptune widget to your home screen, or long-press the app icon, to start listening without opening the app first.</Text>
    </View>
  );
}

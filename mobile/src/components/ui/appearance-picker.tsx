import { Monitor, Moon, Sun } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { radius, spacing, useColors, useThemeStore, type ThemePreference } from "@/theme";
import { Text } from "./text";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Device", icon: Monitor },
];

/** Light for the morning service, dark for the evening one, or whatever the phone says. */
export function AppearancePicker() {
  const colors = useColors();
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="eyebrow" style={{ color: colors.muted }}>Appearance</Text>
      <View style={{ flexDirection: "row", gap: spacing.xs, backgroundColor: colors.surface, borderRadius: radius.pill, padding: 3, borderWidth: 1, borderColor: colors.border }} accessibilityRole="radiogroup">
        {OPTIONS.map((option) => {
          const selected = option.value === preference;
          return (
            <Pressable key={option.value} onPress={() => setPreference(option.value)} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={option.label} style={{ flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: selected ? colors.ink : "transparent" }}>
              <option.icon size={15} color={selected ? colors.background : colors.muted} />
              <Text style={{ fontSize: 13, color: selected ? colors.background : colors.muted }}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

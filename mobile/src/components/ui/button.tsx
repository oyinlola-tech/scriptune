import type { LucideIcon } from "lucide-react-native";
import { Pressable, View, type PressableProps } from "react-native";
import { radius, spacing, useColors } from "@/theme";
import { Text } from "./text";

type Variant = "primary" | "outline" | "ghost" | "danger";

/** A pill button: ink for the primary action, outlined or quiet otherwise; optional icon before or after the label. */
export function Button({ label, icon: Icon, iconSide = "leading", variant = "primary", style, ...props }: PressableProps & { label: string; icon?: LucideIcon; iconSide?: "leading" | "trailing"; variant?: Variant }) {
  const colors = useColors();
  const primary = variant === "primary";
  const foreground = primary ? colors.background : variant === "danger" ? colors.danger : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      style={({ pressed }) => [
        {
          paddingVertical: spacing.sm + 2,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.pill,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: primary ? colors.ink : "transparent",
          borderWidth: variant === "outline" ? 1 : 0,
          borderColor: colors.border,
          opacity: pressed || props.disabled ? 0.7 : 1,
        },
        typeof style === "function" ? undefined : style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        {Icon && iconSide === "leading" && <Icon size={16} color={foreground} strokeWidth={2} />}
        <Text style={{ color: foreground, fontWeight: "500" }}>{label}</Text>
        {Icon && iconSide === "trailing" && <Icon size={16} color={foreground} strokeWidth={2} />}
      </View>
    </Pressable>
  );
}

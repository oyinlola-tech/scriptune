import { CircleAlert, CircleCheck, Info, WifiOff, type LucideIcon } from "lucide-react-native";
import { Pressable, View, type ViewStyle } from "react-native";
import { radius, spacing, useColors } from "@/theme";
import { Text } from "./text";

export type NoticeTone = "error" | "info" | "success" | "offline";

const ICONS: Record<NoticeTone, LucideIcon> = { error: CircleAlert, info: Info, success: CircleCheck, offline: WifiOff };

/**
 * The one way a screen tells the person something went wrong or needs their
 * attention: a bordered card with an icon, a plain sentence, and, when there is
 * something to do about it, one action. Sits where the missing content would be.
 */
export function Notice({ tone = "error", title, message, action, compact = false, style }: { tone?: NoticeTone; title?: string; message: string; action?: { label: string; onPress: () => void }; compact?: boolean; style?: ViewStyle }) {
  const colors = useColors();
  const Icon = ICONS[tone];
  const accent = tone === "error" ? colors.danger : tone === "success" ? colors.gold : colors.muted;
  return (
    <View accessibilityRole={tone === "error" ? "alert" : undefined} accessibilityLiveRegion="polite" style={[{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, padding: compact ? spacing.sm + 2 : spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: tone === "error" ? colors.danger : colors.border, borderLeftWidth: 3, borderLeftColor: accent, backgroundColor: colors.surface }, style]}>
      <Icon size={compact ? 16 : 18} color={accent} strokeWidth={2} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 2 }}>
        {title && <Text style={{ fontWeight: "600" }}>{title}</Text>}
        <Text variant={compact ? "muted" : "body"} style={compact ? { fontSize: 13 } : undefined}>{message}</Text>
        {action && (
          <Pressable onPress={action.onPress} accessibilityRole="button" hitSlop={8} style={({ pressed }) => ({ alignSelf: "flex-start", marginTop: spacing.xs, opacity: pressed ? 0.6 : 1 })}>
            <Text style={{ color: colors.ink, fontWeight: "600", textDecorationLine: "underline" }}>{action.label}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

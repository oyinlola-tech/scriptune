import { CircleAlert, CircleCheck, Info, X } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToasts } from "@/lib/toast";
import { radius, spacing, useColors } from "@/theme";
import { Text } from "./text";

/** Renders toasts above the tab bar. Mount once, in the root layout. */
export function ToastHost() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const items = useToasts((state) => state.items);
  const dismiss = useToasts((state) => state.dismiss);
  if (items.length === 0) return null;
  return (
    <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom: insets.bottom + 72, alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md }}>
      {items.map((item) => {
        const Icon = item.tone === "error" ? CircleAlert : item.tone === "success" ? CircleCheck : Info;
        const accent = item.tone === "error" ? colors.danger : colors.gold;
        return (
          <View key={item.id} accessibilityRole="alert" accessibilityLiveRegion="assertive" style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, maxWidth: 480, width: "100%", paddingVertical: spacing.sm + 2, paddingLeft: spacing.md, paddingRight: spacing.sm, borderRadius: radius.md, backgroundColor: colors.ink, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}>
            <Icon size={18} color={accent} strokeWidth={2} />
            <Text style={{ flex: 1, color: colors.background, fontSize: 15 }}>{item.message}</Text>
            <Pressable onPress={() => dismiss(item.id)} accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={8} style={{ padding: 4 }}>
              <X size={16} color={colors.background} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

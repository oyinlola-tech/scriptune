import { Tabs } from "expo-router";
import { BookOpen, LayoutGrid, Mic, Music, type LucideIcon } from "lucide-react-native";
import { Platform, StyleSheet, View, type ColorValue } from "react-native";
import { spacing, useColors } from "@/theme";

/** The icon, with a small gold dot above it while the tab is active. */
function tabIcon(Icon: LucideIcon) {
  const render = ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <View style={{ alignItems: "center", gap: 3 }}>
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: focused ? "#c2a24f" : "transparent" }} />
      <Icon size={22} color={String(color)} strokeWidth={focused ? 2.25 : 1.6} />
    </View>
  );
  render.displayName = `TabIcon(${Icon.displayName ?? "icon"})`;
  return render;
}

/**
 * Four destinations: Identify, Bible, Hymns and More. Everything else
 * (search, library, offline copies, settings, account) lives behind More,
 * so the bar stays quiet and the microphone stays the point of the app.
 */
export default function TabLayout() {
  const colors = useColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", letterSpacing: 0.4, marginTop: 2 },
        tabBarItemStyle: { paddingVertical: spacing.xs },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          elevation: 0,
          shadowOpacity: 0,
          ...(Platform.OS === "web" ? { height: 64 } : {}),
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Identify", tabBarIcon: tabIcon(Mic), tabBarAccessibilityLabel: "Identify, listen or type the words" }} />
      <Tabs.Screen name="bible" options={{ title: "Bible", tabBarIcon: tabIcon(BookOpen) }} />
      <Tabs.Screen name="hymns" options={{ title: "Hymns", tabBarIcon: tabIcon(Music) }} />
      <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: tabIcon(LayoutGrid), tabBarAccessibilityLabel: "More: search, library, offline copies, settings" }} />
    </Tabs>
  );
}

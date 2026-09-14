import { DMSerifDisplay_400Regular, useFonts } from "@expo-google-fonts/dm-serif-display";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { registerShortcuts, useShortcutRouting } from "@/lib/shortcuts";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { useAuthStore } from "@/lib/auth";
import { useOnboarding } from "@/lib/onboarding";
import { persistOptions, queryClient } from "@/lib/query";
import { ToastHost } from "@/components/ui";
import { applyThemePreference, palette, useThemeStore } from "@/theme";
import { useApiConfig } from "@/lib/config";

SplashScreen.preventAutoHideAsync();

function navigationTheme(scheme: "light" | "dark") {
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  const colors = palette[scheme];
  return { ...base, colors: { ...base.colors, primary: colors.gold, background: colors.background, card: colors.surface, text: colors.ink, border: colors.border } };
}

/** Root: fonts, theme, server cache, session restore, then the stack. */
export default function RootLayout() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const [fontsLoaded] = useFonts({ DMSerifDisplay_400Regular });
  const restore = useAuthStore((state) => state.restore);
  const onboarding = useOnboarding((state) => state.status);
  const loadOnboarding = useOnboarding((state) => state.load);
  const apiHydrated = useApiConfig((state) => state.hydrated);
  const ready = fontsLoaded && onboarding !== "unknown" && apiHydrated;
  useShortcutRouting();
  useEffect(() => {
    void registerShortcuts();
  }, []);

  useEffect(() => {
    void loadOnboarding();
    const apply = () => applyThemePreference(useThemeStore.getState().preference);
    if (useThemeStore.persist.hasHydrated()) apply();
    return useThemeStore.persist.onFinishHydration(apply);
  }, [loadOnboarding]);
  // Restore the session only once the API-address override has loaded, so the
  // refresh request goes to the chosen host, not the built-in default.
  useEffect(() => {
    if (!apiHydrated) return;
    void restore();
  }, [apiHydrated, restore]);
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  const onboarded = onboarding === "done";
  return (
    <ThemeProvider value={navigationTheme(scheme)}>
      <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <Stack screenOptions={{ headerShadowVisible: false, headerTitleStyle: { fontFamily: "DMSerifDisplay_400Regular", fontSize: 20 } }}>
          <Stack.Protected guard={!onboarded}>
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={onboarded}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="listen" options={{ headerShown: false }} />
            <Stack.Screen name="hymns/[slug]" options={{ title: "Hymn" }} />
            <Stack.Screen name="bible/[translation]/[book]/index" options={{ title: "Chapters" }} />
            <Stack.Screen name="bible/[translation]/[book]/[chapter]/index" options={{ title: "Chapter" }} />
            <Stack.Screen name="bible/[translation]/[book]/[chapter]/[verse]" options={{ title: "Verse" }} />
            <Stack.Screen name="search" options={{ title: "Search" }} />
            <Stack.Screen name="library/index" options={{ title: "Library" }} />
            <Stack.Screen name="settings" options={{ title: "Settings" }} />
            <Stack.Screen name="auth/login" options={{ title: "Sign in", presentation: "modal" }} />
            <Stack.Screen name="auth/callback" options={{ title: "Signing in" }} />
            <Stack.Screen name="library/collections/[slug]" options={{ title: "Collection" }} />
            <Stack.Screen name="offline" options={{ title: "Offline" }} />
          </Stack.Protected>
          <Stack.Screen name="legal/[doc]" options={{ title: "Legal", presentation: "modal" }} />
        </Stack>
        <ToastHost />
      </PersistQueryClientProvider>
    </ThemeProvider>
  );
}

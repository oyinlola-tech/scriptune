import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Extends app.json with values that must come from the environment: the
 * Apple team id, which the widget extension needs for signing. Set
 * APPLE_TEAM_ID locally or as a GitHub secret; unsigned CI builds work without it.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? "Scriptune",
  slug: config.slug ?? "scriptune",
  extra: {
    ...config.extra,
    ...(process.env.EXPO_PUBLIC_ALLOW_API_OVERRIDE === "1" ? { allowApiOverride: true } : {}),
  },
  ios: {
    ...config.ios,
    ...(process.env.APPLE_TEAM_ID ? { appleTeamId: process.env.APPLE_TEAM_ID } : {}),
  },
});

import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Button, Screen, Text } from "@/components/ui";
import { clearPendingGoogleSignIn, exchangeGoogleCode, hasPendingGoogleSignIn, isGoogleSignInActive, useAuthStore } from "@/lib/auth";
import { useColors } from "@/theme";

/**
 * Cold-start landing for scriptune://auth/callback?code=…. When the auth
 * session is still open the sign-in screen handles the code itself; this
 * route covers the app being relaunched by the link.
 */
export default function AuthCallbackScreen() {
  const colors = useColors();
  const { code, error } = useLocalSearchParams<{ code?: string; error?: string }>();
  const signIn = useAuthStore((state) => state.signIn);
  const [failed, setFailed] = useState<string | null>(error ?? null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || typeof code !== "string") return;
    started.current = true;
    void (async () => {
      // The in-app auth session owns the exchange when it is open; do nothing here.
      if (isGoogleSignInActive()) {
        router.replace("/library");
        return;
      }
      // Only honour a code if this device actually started a sign-in: an
      // arbitrary scriptune://auth/callback?code=… link must not sign anyone in.
      if (!(await hasPendingGoogleSignIn())) {
        setFailed("unexpected_callback");
        return;
      }
      await clearPendingGoogleSignIn();
      try {
        await signIn(await exchangeGoogleCode(code));
        router.replace("/library");
      } catch {
        setFailed("exchange_failed");
      }
    })();
  }, [code, signIn]);

  if (failed !== null) {
    return (
      <Screen>
        <Text variant="display">Sign-in did not complete</Text>
        <Text variant="muted">Google did not finish signing you in ({failed.replace(/_/g, " ")}). Please try again.</Text>
        <Button label="Back to sign in" onPress={() => router.replace("/auth/login")} />
      </Screen>
    );
  }
  return <Screen><Text variant="muted" style={{ color: colors.muted }}>Finishing sign-in…</Text></Screen>;
}

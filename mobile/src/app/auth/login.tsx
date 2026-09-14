import { useMutation } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { useRef, useState } from "react";
import { Keyboard, TextInput, View } from "react-native";
import { Button, Notice, Screen, Text } from "@/components/ui";
import { ApiError, auth } from "@/lib/api";
import { signInWithGoogle, useAuthStore } from "@/lib/auth";
import { radius, spacing, useColors } from "@/theme";

/** Email and password sign in, or Google through the API's OAuth flow. */
export default function LoginScreen() {
  const colors = useColors();
  const signIn = useAuthStore((state) => state.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const passwordField = useRef<TextInput>(null);

  const submit = useMutation({
    mutationFn: () => (mode === "login" ? auth.login(email.trim(), password) : auth.register(email.trim(), password)),
    onSuccess: async (session) => {
      await signIn(session);
      router.back();
    },
    onError: (cause) => setError(cause instanceof ApiError ? cause.message : "Could not sign in. Check your connection and try again."),
  });
  const google = useMutation({
    mutationFn: signInWithGoogle,
    onSuccess: async (outcome) => {
      if (outcome.status === "signed-in") { await signIn(outcome.session); router.back(); }
      else if (outcome.status === "failed") setError(`Google did not finish signing you in (${outcome.reason.replace(/_/g, " ")}).`);
    },
  });
  const canSubmit = !submit.isPending && email !== "" && password.length >= 8;
  const field = { padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, fontSize: 16 } as const;

  return (
    <Screen>
      <Text variant="display">{mode === "login" ? "Welcome back" : "Create an account"}</Text>
      <Text variant="muted">Accounts keep your saved hymns, verses and collections in step across devices.</Text>
      <View style={{ gap: spacing.sm }}>
        <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" autoComplete="email" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => passwordField.current?.focus()} style={field} />
        <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.muted} secureTextEntry autoComplete={mode === "login" ? "current-password" : "new-password"} ref={passwordField} returnKeyType="go" onSubmitEditing={() => { if (canSubmit) submit.mutate(); }} style={field} />
        {error && <Notice message={error} />}
        <Button label={submit.isPending ? "One moment…" : mode === "login" ? "Sign in" : "Create account"} disabled={!canSubmit} onPress={() => { Keyboard.dismiss(); submit.mutate(); }} />
        <Button label={mode === "login" ? "New here? Create an account" : "Have an account? Sign in"} variant="ghost" onPress={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <Text variant="muted">or</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>
      <Button label={google.isPending ? "Opening Google…" : "Continue with Google"} variant="outline" disabled={google.isPending} onPress={() => google.mutate()} />
      <Text variant="muted" style={{ textAlign: "center", fontSize: 12 }}>
        By continuing you agree to the <Link href="/legal/terms" style={{ textDecorationLine: "underline", color: colors.ink }}>Terms</Link> and <Link href="/legal/privacy" style={{ textDecorationLine: "underline", color: colors.ink }}>Privacy Policy</Link>.
      </Text>
    </Screen>
  );
}

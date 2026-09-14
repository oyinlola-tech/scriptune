import { useQueryClient } from "@tanstack/react-query";
import { Check, Plug, RotateCcw } from "lucide-react-native";
import { useState } from "react";
import { TextInput, View } from "react-native";
import { ALLOW_API_OVERRIDE, DEFAULT_API_URL, getApiUrl, isValidApiUrl, useApiConfig } from "@/lib/config";
import { useAuthStore } from "@/lib/auth";
import { radius, spacing, useColors } from "@/theme";
import { Button } from "./button";
import { Notice } from "./notice";
import { Text } from "./text";

type Probe = { state: "idle" } | { state: "checking" } | { state: "ok"; ms: number } | { state: "failed"; reason: string };

async function probe(url: string): Promise<Probe> {
  const started = Date.now();
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/health`, { signal: AbortSignal.timeout(8000) });
    return response.ok ? { state: "ok", ms: Date.now() - started } : { state: "failed", reason: `The server answered ${response.status}.` };
  } catch {
    return { state: "failed", reason: "No answer. Check the address and that the server or tunnel is running." };
  }
}

/**
 * Where the app sends its requests. Meant for testing builds against a
 * laptop or a tunnel whose address changes; production builds leave it alone.
 */
export function ConnectionSettings() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const override = useApiConfig((state) => state.override);
  const setOverride = useApiConfig((state) => state.setOverride);
  const [draft, setDraft] = useState(override ?? "");
  const [result, setResult] = useState<Probe>({ state: "idle" });
  const current = getApiUrl();
  const valid = isValidApiUrl(draft);

  const test = async () => {
    setResult({ state: "checking" });
    setResult(await probe(draft));
  };
  const apply = () => {
    // Moving to another host must not carry the current session there.
    void useAuthStore.getState().signOut();
    setOverride(draft);
    queryClient.clear();
    setResult({ state: "idle" });
  };
  const reset = () => {
    setOverride(null);
    setDraft("");
    queryClient.clear();
    setResult({ state: "idle" });
  };

  if (!ALLOW_API_OVERRIDE) return null;
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="eyebrow" style={{ color: colors.muted }}>Developer · API address</Text>
      <Text variant="muted">Only in development builds. Talking to {current}{override === null ? " (built in)" : ""}.</Text>
      <TextInput
        value={draft}
        onChangeText={(next) => { setDraft(next); setResult({ state: "idle" }); }}
        placeholder={DEFAULT_API_URL}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        returnKeyType="done"
        style={{ padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, fontSize: 15 }}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        <Button label={result.state === "checking" ? "Checking…" : "Test"} icon={Plug} variant="outline" disabled={!valid || result.state === "checking"} onPress={() => void test()} />
        <Button label="Use this address" icon={Check} disabled={!valid || draft.trim().replace(/\/$/, "") === current} onPress={apply} />
        {override !== null && <Button label="Back to built-in" icon={RotateCcw} variant="ghost" onPress={reset} />}
      </View>
      {result.state === "ok" && <Text style={{ color: colors.gold }}><Check size={12} color={colors.gold} /> Reachable, {result.ms} ms.</Text>}
      {result.state === "failed" && <Notice compact message={result.reason} />}
    </View>
  );
}

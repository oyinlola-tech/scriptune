import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import { LogIn, LogOut, UserX } from "lucide-react-native";
import { Alert, Pressable, View } from "react-native";
import Constants from "expo-constants";
import { AppearancePicker, Button, ConnectionSettings, ListeningSettings, Screen, Text } from "@/components/ui";
import { auth } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { toast } from "@/lib/toast";
import { spacing, useColors } from "@/theme";

const LEGAL = [
  { doc: "terms", label: "Terms" },
  { doc: "privacy", label: "Privacy" },
  { doc: "copyright", label: "Copyright" },
  { doc: "licenses", label: "Licences" },
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={{ gap: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }}>
      <Text variant="eyebrow" style={{ color: colors.muted }}>{title}</Text>
      {children}
    </View>
  );
}

function AccountSection() {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const queryClient = useQueryClient();
  const deleteAccount = useMutation({
    mutationFn: () => auth.deleteAccount(),
    onSuccess: async () => { await useAuthStore.getState().signOut(); queryClient.removeQueries({ queryKey: ["library"] }); toast.success("Your account has been deleted."); },
    onError: () => toast.error("Could not delete the account. Try again."),
  });
  const confirmDelete = () => Alert.alert(
    "Delete your account?",
    "This removes your account, saved items, collections, notes and history for good. It cannot be undone.",
    [{ text: "Keep my account", style: "cancel" }, { text: "Delete for good", style: "destructive", onPress: () => deleteAccount.mutate() }],
  );
  if (status !== "member") {
    return (
      <Section title="Account">
        <Text variant="muted">Sign in to keep hymns, verses, notes and collections on every device.</Text>
        <Link href="/auth/login" asChild><Button label={status === "loading" ? "Checking…" : "Sign in"} icon={LogIn} disabled={status === "loading"} /></Link>
      </Section>
    );
  }
  return (
    <Section title="Account">
      <Text>{user?.name ?? user?.email}</Text>
      {user?.name && <Text variant="muted">{user.email}</Text>}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        <Button label="Sign out" icon={LogOut} variant="outline" onPress={() => void signOut()} />
        <Button label={deleteAccount.isPending ? "Deleting…" : "Delete account"} icon={UserX} variant="danger" disabled={deleteAccount.isPending} onPress={confirmDelete} />
      </View>
      <Text variant="muted" style={{ fontSize: 12 }}>Deleting removes everything kept under this account. It cannot be undone.</Text>
    </Section>
  );
}

/** Listening, appearance, account and the small print, in one quiet place. */
export default function SettingsScreen() {
  const colors = useColors();
  const version = Constants.expoConfig?.version ?? "";
  return (
    <Screen>
      <ListeningSettings />
      <View style={{ paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }}>
        <AppearancePicker />
      </View>
      <ConnectionSettings />
      <AccountSection />
      <Section title="About">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
          {LEGAL.map((item) => (
            <Link key={item.doc} href={{ pathname: "/legal/[doc]", params: { doc: item.doc } }} asChild>
              <Pressable accessibilityRole="link"><Text variant="muted" style={{ textDecorationLine: "underline" }}>{item.label}</Text></Pressable>
            </Link>
          ))}
        </View>
        {version !== "" && <Text variant="muted" style={{ fontSize: 12 }}>Scriptune {version}</Text>}
      </Section>
    </Screen>
  );
}

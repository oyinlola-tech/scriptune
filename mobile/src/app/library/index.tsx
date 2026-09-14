import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import { LogIn, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { TargetRow } from "@/components/library";
import { Button, Notice, Screen, Text } from "@/components/ui";
import { library } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { useGuestHistory } from "@/lib/history";
import { keys } from "@/lib/query";
import { radius, spacing, useColors } from "@/theme";

const SECTIONS = ["Saved", "Collections", "Notes", "History"] as const;
type Section = (typeof SECTIONS)[number];

function Segments({ value, onChange }: { value: Section; onChange: (next: Section) => void }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", gap: spacing.xs, backgroundColor: colors.surface, borderRadius: radius.pill, padding: 3, borderWidth: 1, borderColor: colors.border }}>
      {SECTIONS.map((section) => (
        <Pressable key={section} onPress={() => onChange(section)} accessibilityRole="tab" accessibilityState={{ selected: value === section }} style={{ flex: 1, paddingVertical: 7, borderRadius: radius.pill, alignItems: "center", backgroundColor: value === section ? colors.ink : "transparent" }}>
          <Text style={{ fontSize: 13, color: value === section ? colors.background : colors.muted }}>{section}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function GuestLibrary() {
  const status = useAuthStore((state) => state.status);
  const entries = useGuestHistory((state) => state.entries);
  return (
    <Screen>
      <Text variant="muted">Sign in to keep hymns and verses, build collections for services, and see what you identified on any device.</Text>
      <Link href="/auth/login" asChild><Button label={status === "loading" ? "Checking…" : "Sign in"} icon={LogIn} disabled={status === "loading"} /></Link>
      {entries.length > 0 && (
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <Text variant="eyebrow">Identified on this device</Text>
          {entries.map((entry) => <Text key={entry.id} variant="muted">{entry.label}</Text>)}
          <Text variant="muted" style={{ fontSize: 12 }}>These move into your account when you sign in.</Text>
        </View>
      )}
    </Screen>
  );
}

/** Saved items, collections, notes and history for members. */
export default function LibraryScreen() {
  const status = useAuthStore((state) => state.status);
  const queryClient = useQueryClient();
  const [section, setSection] = useState<Section>("Saved");
  const member = status === "member";
  const saved = useQuery({ queryKey: keys.saved(), queryFn: () => library.saved(), enabled: member });
  const collections = useQuery({ queryKey: keys.collections(), queryFn: () => library.collections(), enabled: member && section === "Collections" });
  const notes = useQuery({ queryKey: keys.notes(), queryFn: () => library.notes(), enabled: member && section === "Notes" });
  const history = useQuery({ queryKey: keys.history(), queryFn: () => library.history(), enabled: member && section === "History" });
  const clearHistory = useMutation({ mutationFn: () => library.clearHistory(), onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.history() }) });

  if (!member) return <GuestLibrary />;
  return (
    <Screen>
      <Segments value={section} onChange={setSection} />
      {section === "Saved" && (
        <View style={{ gap: spacing.sm }}>
          {saved.data?.items.length === 0 && <Text variant="muted">Nothing saved yet. Open a hymn or verse and save it, and it will wait for you here.</Text>}
          {saved.data?.items.map((item) => <TargetRow key={`${item.target.type}-${item.target.key}`} target={item.target} />)}
        </View>
      )}
      {section === "Collections" && (
        <View style={{ gap: spacing.sm }}>
          {collections.data?.collections.length === 0 && <Text variant="muted">No collections yet. Open a hymn or verse and add it to a new collection.</Text>}
          {collections.data?.collections.map((collection) => (
            <Link key={collection.slug} href={{ pathname: "/library/collections/[slug]", params: { slug: collection.slug } }} asChild>
              <Pressable style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingVertical: 6 }}>
                <Text variant="title">{collection.name}</Text>
                <Text variant="muted">{collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      )}
      {section === "Notes" && (
        <View style={{ gap: spacing.md }}>
          {notes.data?.notes.length === 0 && <Text variant="muted">No notes yet. Write one on any hymn or verse.</Text>}
          {notes.data?.notes.map((note) => <TargetRow key={`${note.target.type}-${note.target.key}`} target={note.target} subtitle={note.body} />)}
        </View>
      )}
      {section === "History" && (
        <View style={{ gap: spacing.sm }}>
          {history.data?.entries.length === 0 && <Text variant="muted">Nothing identified yet.</Text>}
          {history.data?.entries.map((entry) => (
            entry.target ? <TargetRow key={entry.id} target={entry.target} subtitle={entry.query} /> : <Text key={entry.id} variant="muted">{entry.query}</Text>
          ))}
          {history.data && history.data.entries.length > 0 && <Button label="Clear history" icon={Trash2} variant="ghost" disabled={clearHistory.isPending} onPress={() => clearHistory.mutate()} />}
        </View>
      )}
      {(saved.isError || collections.isError || notes.isError || history.isError) && <Notice message="Your library could not be loaded. Check your connection and try again." />}
    </Screen>
  );
}

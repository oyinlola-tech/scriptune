import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PenLine, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Keyboard, TextInput, View } from "react-native";
import type { LibraryTargetType } from "@scriptune/contracts";
import { Button, Text } from "@/components/ui";
import { library } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/lib/auth";
import { keys } from "@/lib/query";
import { radius, spacing, useColors } from "@/theme";

/** A member's private note on this hymn or verse, edited in place. */
export function NoteEditor({ type, targetKey }: { type: LibraryTargetType; targetKey: string }) {
  const colors = useColors();
  const isMember = useAuthStore((state) => state.status === "member");
  const queryClient = useQueryClient();
  const notes = useQuery({ queryKey: keys.notes(), queryFn: () => library.notes(), enabled: isMember });
  const existing = notes.data?.notes.find((note) => note.target.type === type && note.target.key === targetKey) ?? null;
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState("");
  const refresh = () => { Keyboard.dismiss(); setEditing(false); void queryClient.invalidateQueries({ queryKey: keys.notes() }); };
  const save = useMutation({ mutationFn: () => library.putNote(type, targetKey, body.trim()), onSuccess: refresh, onError: () => toast.error("Could not save the note. Try again.") });
  const remove = useMutation({ mutationFn: () => library.deleteNote(type, targetKey), onSuccess: refresh, onError: () => toast.error("Could not delete the note. Try again.") });
  if (!isMember) return null;
  return (
    <View style={{ marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: spacing.sm }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text variant="eyebrow" style={{ color: colors.muted }}>Your note</Text>
        {!editing && <Button label={existing ? "Edit" : "Write a note"} icon={PenLine} variant="ghost" onPress={() => { setBody(existing?.body ?? ""); setEditing(true); }} />}
      </View>
      {editing ? (
        <>
          <TextInput value={body} onChangeText={setBody} multiline autoFocus placeholder="What this means to you, where you sang it, who to remember…" placeholderTextColor={colors.muted} style={{ minHeight: 96, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, color: colors.ink, fontSize: 16, textAlignVertical: "top" }} />
          <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
            <Button label="Save note" disabled={body.trim() === "" || save.isPending} onPress={() => save.mutate()} />
            <Button label="Cancel" variant="ghost" onPress={() => { Keyboard.dismiss(); setEditing(false); }} />
            {existing && <Button label="Delete" icon={Trash2} variant="danger" disabled={remove.isPending} onPress={() => remove.mutate()} />}
          </View>
        </>
      ) : existing ? (
        <Text>{existing.body}</Text>
      ) : (
        <Text variant="muted">Only you can see notes. They stay with this {type === "hymn" ? "hymn" : "verse"} in your library.</Text>
      )}
    </View>
  );
}

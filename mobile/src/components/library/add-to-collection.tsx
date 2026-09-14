import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderPlus, Plus, X } from "lucide-react-native";
import { useState } from "react";
import { Keyboard, Modal, Pressable, TextInput, View } from "react-native";
import type { LibraryTargetType } from "@scriptune/contracts";
import { Button, DismissKeyboard, Text } from "@/components/ui";
import { library } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/lib/auth";
import { keys } from "@/lib/query";
import { radius, spacing, useColors } from "@/theme";

/** Adds a hymn or verse to a collection, creating one inline if needed. Members only. */
export function AddToCollectionButton({ type, targetKey }: { type: LibraryTargetType; targetKey: string }) {
  const colors = useColors();
  const isMember = useAuthStore((state) => state.status === "member");
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const collections = useQuery({ queryKey: keys.collections(), queryFn: () => library.collections(), enabled: isMember && open });
  const done = () => { setOpen(false); setName(""); void queryClient.invalidateQueries({ queryKey: keys.collections() }); };
  const add = useMutation({ mutationFn: (slug: string) => library.addToCollection(slug, type, targetKey), onSuccess: () => { done(); toast.success("Added to the collection."); }, onError: () => toast.error("Could not add it to the collection. Try again.") });
  const createAndAdd = useMutation({
    mutationFn: async () => { const created = await library.createCollection(name.trim()); await library.addToCollection(created.slug, type, targetKey); },
    onSuccess: () => { done(); toast.success("Collection created."); },
    onError: () => toast.error("Could not create the collection. Try again."),
  });
  if (!isMember) return null;
  return (
    <>
      <Button label="Add to collection" icon={FolderPlus} variant="outline" onPress={() => setOpen(true)} />
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <DismissKeyboard style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.md }}>
          <Text variant="display">Add to a collection</Text>
          <Text variant="muted">Collections group hymns and verses, like a Sunday order of service.</Text>
          <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: "hidden" }}>
            {collections.data?.collections.map((collection, index) => (
              <Pressable key={collection.slug} onPress={() => add.mutate(collection.slug)} disabled={add.isPending} style={{ padding: spacing.md, flexDirection: "row", justifyContent: "space-between", borderTopWidth: index === 0 ? 0 : 1, borderTopColor: colors.border }}>
                <Text variant="title">{collection.name}</Text>
                <Text variant="muted">{collection.itemCount}</Text>
              </Pressable>
            ))}
            {collections.data?.collections.length === 0 && <Text variant="muted" style={{ padding: spacing.md }}>No collections yet. Create one below.</Text>}
          </View>
          <TextInput value={name} onChangeText={setName} returnKeyType="done" onSubmitEditing={() => { if (name.trim() !== "" && !createAndAdd.isPending) createAndAdd.mutate(); }} placeholder="New collection name" placeholderTextColor={colors.muted} style={{ padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, fontSize: 16 }} />
          <Button label="Create and add" icon={Plus} disabled={name.trim() === "" || createAndAdd.isPending} onPress={() => { Keyboard.dismiss(); createAndAdd.mutate(); }} />
          <Button label="Close" icon={X} variant="ghost" onPress={() => setOpen(false)} />
        </DismissKeyboard>
      </Modal>
    </>
  );
}

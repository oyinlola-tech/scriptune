import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { TargetRow } from "@/components/library";
import { Button, Notice, Screen, Text } from "@/components/ui";
import { library } from "@/lib/api";
import { keys } from "@/lib/query";
import { spacing } from "@/theme";

/** A collection's items in order, with removal and deletion. */
export default function CollectionScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const collection = useQuery({ queryKey: keys.collection(slug), queryFn: () => library.collection(slug) });
  const invalidate = () => { void queryClient.invalidateQueries({ queryKey: keys.collection(slug) }); void queryClient.invalidateQueries({ queryKey: keys.collections() }); };
  const remove = useMutation({ mutationFn: (item: { type: "hymn" | "verse"; key: string }) => library.removeFromCollection(slug, item.type, item.key), onSuccess: invalidate });
  const destroy = useMutation({ mutationFn: () => library.deleteCollection(slug), onSuccess: () => { invalidate(); router.back(); } });

  return (
    <Screen>
      <Stack.Screen options={{ title: collection.data?.name ?? "Collection" }} />
      {collection.isPending && <Text variant="muted">Loading…</Text>}
      {collection.isError && <Notice message="This collection could not be loaded." action={{ label: "Try again", onPress: () => void collection.refetch() }} />}
      {collection.data && (
        <>
          <Text variant="eyebrow">Collection</Text>
          <Text variant="display">{collection.data.name}</Text>
          {collection.data.description && <Text variant="muted">{collection.data.description}</Text>}
          {collection.data.items.length === 0 && <Text variant="muted">Empty so far. Add hymns and verses from their pages.</Text>}
          <View style={{ gap: spacing.sm }}>
            {collection.data.items.map((item) => (
              <View key={`${item.target.type}-${item.target.key}`} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <View style={{ flex: 1 }}><TargetRow target={item.target} subtitle={item.note} /></View>
                <Button label="Remove" variant="ghost" disabled={remove.isPending} onPress={() => remove.mutate({ type: item.target.type, key: item.target.key })} />
              </View>
            ))}
          </View>
          <Button label="Delete collection" variant="outline" disabled={destroy.isPending} onPress={() => destroy.mutate()} style={{ marginTop: spacing.lg }} />
        </>
      )}
    </Screen>
  );
}

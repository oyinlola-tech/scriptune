import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { ShareButton } from "@/components/common";
import { AddToCollectionButton, NoteEditor, SaveButton } from "@/components/library";
import { TranslationNotice } from "@/components/bible";
import { Notice, Screen, Text } from "@/components/ui";
import { bible, verseKey } from "@/lib/api";
import { readLocalVerse } from "@/lib/offline";
import { keys } from "@/lib/query";
import { fonts, spacing, useColors } from "@/theme";

/** One verse, set large, with the verses around it in a quieter voice. */
export default function VerseScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ translation: string; book: string; chapter: string; verse: string }>();
  const chapter = Number(params.chapter);
  const verse = Number(params.verse);
  const detail = useQuery({ queryKey: keys.verse(params.translation, params.book, chapter, verse), queryFn: async () => (await readLocalVerse(params.translation, params.book, chapter, verse)) ?? bible.verse(params.translation, params.book, chapter, verse) });

  return (
    <Screen>
      <Stack.Screen options={{ title: detail.data?.verse.reference ?? "Verse" }} />
      {detail.isPending && <Text variant="muted">Loading…</Text>}
      {detail.isError && <Notice message="This verse is not on the device and could not be fetched. Connect, or download the translation from the Offline screen." action={{ label: "Try again", onPress: () => void detail.refetch() }} />}
      {detail.data && (
        <>
          <Text variant="eyebrow">{detail.data.translation.name}</Text>
          <Text variant="display">{detail.data.verse.reference}</Text>
          <Text style={{ fontFamily: fonts.serif, fontSize: 26, lineHeight: 38, marginVertical: spacing.sm }}>{detail.data.verse.text}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <SaveButton type="verse" targetKey={verseKey(detail.data.translation.code, detail.data.verse.book.slug, chapter, verse)} />
            <AddToCollectionButton type="verse" targetKey={verseKey(detail.data.translation.code, detail.data.verse.book.slug, chapter, verse)} />
            <ShareButton title={`${detail.data.verse.reference} (${detail.data.translation.code})`} path={`/bible/${params.translation.toLowerCase()}/${detail.data.verse.book.slug}/${chapter}/${verse}`} />
          </View>
          <View style={{ gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }}>
            <Text variant="eyebrow">In context</Text>
            {[...detail.data.context.before, detail.data.verse, ...detail.data.context.after].map((entry) => (
              <Text key={entry.verse} variant={entry.verse === verse ? "body" : "muted"}>
                <Text variant="muted" style={{ fontSize: 11 }}>{entry.verse} </Text>
                {entry.text}
              </Text>
            ))}
          </View>
          <TranslationNotice translation={detail.data.translation} />
          <NoteEditor type="verse" targetKey={verseKey(detail.data.translation.code, detail.data.verse.book.slug, chapter, verse)} />
        </>
      )}
    </Screen>
  );
}

import { passageLabel } from "@scriptune/contracts";
import { useQuery } from "@tanstack/react-query";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, View } from "react-native";
import { ShareButton } from "@/components/common";
import { AddToCollectionButton, NoteEditor, SaveButton } from "@/components/library";
import { TranslationNotice } from "@/components/bible";
import { Notice, Screen, Text } from "@/components/ui";
import { bible, hymns, verseKey } from "@/lib/api";
import { readLocalVerse, useIsOnline } from "@/lib/offline";
import { keys } from "@/lib/query";
import { fonts, radius, spacing, useColors } from "@/theme";

/** One verse, set large, with the verses around it in a quieter voice. */
export default function VerseScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ translation: string; book: string; chapter: string; verse: string }>();
  const chapter = Number(params.chapter);
  const verse = Number(params.verse);
  const detail = useQuery({ queryKey: keys.verse(params.translation, params.book, chapter, verse), queryFn: async () => (await readLocalVerse(params.translation, params.book, chapter, verse)) ?? bible.verse(params.translation, params.book, chapter, verse) });
  const online = useIsOnline();
  // An extra that needs the network; the verse itself reads from the device when it is there.
  const related = useQuery({ queryKey: keys.crossReferences(params.translation, params.book, chapter, verse), queryFn: () => bible.crossReferences(params.translation, params.book, chapter, verse), enabled: online, staleTime: 24 * 60 * 60 * 1000 });
  const sung = useQuery({ queryKey: keys.hymnsForVerse(params.translation, params.book, chapter, verse), queryFn: () => hymns.forVerse(params.translation, params.book, chapter, verse), enabled: online, staleTime: 24 * 60 * 60 * 1000 });

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
          {related.data !== undefined && related.data.references.length > 0 && (
            <View style={{ gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }}>
              <Text variant="eyebrow">Related scriptures</Text>
              <View style={{ borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: "hidden" }}>
                {related.data.references.map((passage, index) => (
                  <Link key={`${passage.book.slug}-${passage.chapter}-${passage.verse}`} href={{ pathname: "/bible/[translation]/[book]/[chapter]/[verse]", params: { translation: params.translation, book: passage.book.slug, chapter: String(passage.chapter), verse: String(passage.verse) } }} asChild>
                    <Pressable accessibilityRole="link" accessibilityLabel={`${passageLabel(passage)}. ${passage.text}`} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                      <View style={{ paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: colors.border, gap: 2 }}>
                        <Text variant="title" style={{ fontSize: 17 }}>{passageLabel(passage)}</Text>
                        <Text variant="muted" numberOfLines={2} style={{ fontSize: 13, lineHeight: 19 }}>{passage.text}</Text>
                      </View>
                    </Pressable>
                  </Link>
                ))}
              </View>
              <Text variant="muted" style={{ fontSize: 11 }}>Cross-references from {related.data.source.name}, {related.data.source.licence}.</Text>
            </View>
          )}
          {sung.data !== undefined && sung.data.hymns.length > 0 && (
            <View style={{ gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }}>
              <Text variant="eyebrow">Hymns on this passage</Text>
              <View style={{ borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: "hidden" }}>
                {sung.data.hymns.map((hymn, index) => (
                  <Link key={hymn.slug} href={{ pathname: "/hymns/[slug]", params: { slug: hymn.slug } }} asChild>
                    <Pressable accessibilityRole="link" style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                      <View style={{ paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: colors.border }}>
                        <Text variant="title" style={{ fontSize: 17 }} numberOfLines={2}>{hymn.title}</Text>
                      </View>
                    </Pressable>
                  </Link>
                ))}
              </View>
            </View>
          )}
          <TranslationNotice translation={detail.data.translation} />
          <NoteEditor type="verse" targetKey={verseKey(detail.data.translation.code, detail.data.verse.book.slug, chapter, verse)} />
        </>
      )}
    </Screen>
  );
}

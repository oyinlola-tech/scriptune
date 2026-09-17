import { bookLabel } from "@scriptune/contracts";
import { useQuery } from "@tanstack/react-query";
import { Link, Stack, router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { TranslationNotice, TranslationSwitcher } from "@/components/bible";
import { Button, Notice, ReadingText, Screen, Text } from "@/components/ui";
import { bible } from "@/lib/api";
import { readLocalChapter } from "@/lib/offline";
import { keys } from "@/lib/query";
import { spacing } from "@/theme";

/** A chapter, verse by verse. Scroll to the verse you want; tap it for context, saving and notes. */
export default function ChapterScreen() {
  const params = useLocalSearchParams<{ translation: string; book: string; chapter: string }>();
  const chapter = Number(params.chapter);
  const data = useQuery({ queryKey: keys.chapter(params.translation.toUpperCase(), params.book, chapter), queryFn: async () => (await readLocalChapter(params.translation, params.book, chapter)) ?? bible.chapter(params.translation, params.book, chapter) });
  const book = data.data?.book;

  return (
    <Screen>
      <Stack.Screen options={{ title: book ? `${bookLabel(book)} ${chapter}` : "Chapter" }} />
      {data.isPending && <Text variant="muted">Loading…</Text>}
      {data.isError && <Notice message="This chapter is not on the device and could not be fetched. Connect, or download the translation from More › Offline copies." action={{ label: "Try again", onPress: () => void data.refetch() }} />}
      {data.data && book && (
        <>
          <Text variant="eyebrow">{data.data.translation.name}</Text>
          <Text variant="display">{bookLabel(book)} {chapter}</Text>
          {/* Only the 66 shared books are in every translation. */}
          {!book.deuterocanonical && <TranslationSwitcher current={params.translation} onChoose={(code) => router.replace({ pathname: "/bible/[translation]/[book]/[chapter]", params: { translation: code, book: book.slug, chapter: String(chapter) } })} />}
          <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
            {data.data.verses.map((verse) => (
              <Link key={verse.verse} href={{ pathname: "/bible/[translation]/[book]/[chapter]/[verse]", params: { translation: params.translation, book: book.slug, chapter: String(chapter), verse: String(verse.verse) } }} asChild>
                <Pressable accessibilityRole="link" accessibilityLabel={`Verse ${verse.verse}. ${verse.text}`} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                  {/* Layout lives on this View: a Pressable inside Link asChild loses function styles on web. */}
                  <View style={{ flexDirection: "row", gap: spacing.sm }}>
                    <Text variant="muted" style={{ width: 28, textAlign: "right", fontSize: 12, lineHeight: 30, fontVariant: ["tabular-nums"] }}>{verse.verse}</Text>
                    <ReadingText style={{ flex: 1 }}>{verse.text}</ReadingText>
                  </View>
                </Pressable>
              </Link>
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginTop: spacing.lg, gap: spacing.sm }}>
            {chapter > 1 ? (
              <Link href={{ pathname: "/bible/[translation]/[book]/[chapter]", params: { translation: params.translation, book: book.slug, chapter: String(chapter - 1) } }} asChild replace><Button label={String(chapter - 1)} accessibilityLabel={`Chapter ${chapter - 1}`} icon={ChevronLeft} variant="outline" /></Link>
            ) : <View />}
            <Link href={{ pathname: "/bible/[translation]/[book]", params: { translation: params.translation, book: book.slug } }} asChild><Button label="Chapters" icon={LayoutGrid} variant="ghost" /></Link>
            {chapter < book.chapterCount ? (
              <Link href={{ pathname: "/bible/[translation]/[book]/[chapter]", params: { translation: params.translation, book: book.slug, chapter: String(chapter + 1) } }} asChild replace><Button label={String(chapter + 1)} accessibilityLabel={`Chapter ${chapter + 1}`} icon={ChevronRight} iconSide="trailing" variant="outline" /></Link>
            ) : <View />}
          </View>
          <TranslationNotice translation={data.data.translation} />
        </>
      )}
    </Screen>
  );
}

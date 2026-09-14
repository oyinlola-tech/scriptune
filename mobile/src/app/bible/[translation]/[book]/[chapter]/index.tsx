import { useQuery } from "@tanstack/react-query";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Button, Notice, Screen, Text } from "@/components/ui";
import { bible } from "@/lib/api";
import { readLocalChapter } from "@/lib/offline";
import { keys } from "@/lib/query";
import { fonts, spacing } from "@/theme";

/** A chapter, verse by verse. Scroll to the verse you want; tap it for context, saving and notes. */
export default function ChapterScreen() {
  const params = useLocalSearchParams<{ translation: string; book: string; chapter: string }>();
  const chapter = Number(params.chapter);
  const data = useQuery({ queryKey: keys.chapter(params.translation.toUpperCase(), params.book, chapter), queryFn: async () => (await readLocalChapter(params.translation, params.book, chapter)) ?? bible.chapter(params.translation, params.book, chapter) });
  const book = data.data?.book;

  return (
    <Screen>
      <Stack.Screen options={{ title: book ? `${book.name} ${chapter}` : "Chapter" }} />
      {data.isPending && <Text variant="muted">Loading…</Text>}
      {data.isError && <Notice message="This chapter is not on the device and could not be fetched. Connect, or download the translation from More › Offline copies." action={{ label: "Try again", onPress: () => void data.refetch() }} />}
      {data.data && book && (
        <>
          <Text variant="eyebrow">{data.data.translation.name}</Text>
          <Text variant="display">{book.name} {chapter}</Text>
          <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
            {data.data.verses.map((verse) => (
              <Link key={verse.verse} href={{ pathname: "/bible/[translation]/[book]/[chapter]/[verse]", params: { translation: params.translation, book: book.slug, chapter: String(chapter), verse: String(verse.verse) } }} asChild>
                <Pressable style={({ pressed }) => ({ flexDirection: "row", gap: spacing.sm, opacity: pressed ? 0.7 : 1 })}>
                  <Text variant="muted" style={{ width: 28, textAlign: "right", fontSize: 12, lineHeight: 30, fontVariant: ["tabular-nums"] }}>{verse.verse}</Text>
                  <Text style={{ flex: 1, fontFamily: fonts.serif, fontSize: 19, lineHeight: 30 }}>{verse.text}</Text>
                </Pressable>
              </Link>
            ))}
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.lg, gap: spacing.sm }}>
            {chapter > 1 ? (
              <Link href={{ pathname: "/bible/[translation]/[book]/[chapter]", params: { translation: params.translation, book: book.slug, chapter: String(chapter - 1) } }} asChild replace><Button label={`Chapter ${chapter - 1}`} icon={ChevronLeft} variant="outline" /></Link>
            ) : <View />}
            <Link href={{ pathname: "/bible/[translation]/[book]", params: { translation: params.translation, book: book.slug } }} asChild><Button label="Chapters" icon={LayoutGrid} variant="ghost" /></Link>
            {chapter < book.chapterCount ? (
              <Link href={{ pathname: "/bible/[translation]/[book]/[chapter]", params: { translation: params.translation, book: book.slug, chapter: String(chapter + 1) } }} asChild replace><Button label={`Chapter ${chapter + 1}`} icon={ChevronRight} variant="outline" /></Link>
            ) : <View />}
          </View>
        </>
      )}
    </Screen>
  );
}

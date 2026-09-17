import { bookLabel } from "@scriptune/contracts";
import { useQuery } from "@tanstack/react-query";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, View } from "react-native";
import { Notice, Screen, Text } from "@/components/ui";
import { bible } from "@/lib/api";
import { listLocalBooks } from "@/lib/offline";
import { keys } from "@/lib/query";
import { fonts, radius, spacing, useColors } from "@/theme";

/** The chapters of one book as a grid of numbers. Pick one before reading. */
export default function BookScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ translation: string; book: string }>();
  const translation = params.translation.toUpperCase();
  const books = useQuery({ queryKey: keys.books(translation), queryFn: async () => (await listLocalBooks(translation)) ?? bible.books(params.translation) });
  const needle = params.book.toLowerCase();
  const book = books.data?.books.find((entry) => entry.slug === needle || entry.name.toLowerCase() === needle || entry.abbreviation.toLowerCase() === needle) ?? null;
  const chapters = book === null ? [] : Array.from({ length: book.chapterCount }, (_, index) => index + 1);

  return (
    <Screen>
      <Stack.Screen options={{ title: book ? bookLabel(book) : "Chapters" }} />
      {books.isPending && <Text variant="muted">Loading…</Text>}
      {(books.isError || (books.isSuccess && book === null)) && <Notice message="This book could not be found." />}
      {book && (
        <>
          <Text variant="eyebrow">{books.data?.translation.name}</Text>
          <Text variant="display">{bookLabel(book)}</Text>
          <Text variant="muted">{book.chapterCount === 1 ? "One chapter." : `${book.chapterCount} chapters. Choose one to read.`}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm }} accessibilityLabel="Chapters">
            {chapters.map((chapter) => (
              <Link key={chapter} href={{ pathname: "/bible/[translation]/[book]/[chapter]", params: { translation: params.translation, book: book.slug, chapter: String(chapter) } }} asChild>
                <Pressable style={({ pressed }) => ({ width: 56, height: 56, alignItems: "center", justifyContent: "center", borderRadius: radius.md, borderWidth: 1, borderColor: pressed ? colors.gold : colors.border, backgroundColor: colors.surface })}>
                  <Text style={{ fontFamily: fonts.serif, fontSize: 22 }}>{chapter}</Text>
                </Pressable>
              </Link>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

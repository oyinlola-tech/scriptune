import { bookLabel } from "@scriptune/contracts";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "expo-router";
import { Pressable, View } from "react-native";
import { Notice, Screen, Text } from "@/components/ui";
import { bible } from "@/lib/api";
import { DEFAULT_TRANSLATION } from "@/lib/config";
import { listLocalBooks, useCorpora, useIsOnline } from "@/lib/offline";
import { keys } from "@/lib/query";
import { radius, spacing, useColors } from "@/theme";

const GROUPS = [
  { label: "Old Testament", match: (book: { testament: string; deuterocanonical: boolean }) => book.testament === "OLD" && !book.deuterocanonical },
  { label: "Deuterocanonical books", match: (book: { testament: string; deuterocanonical: boolean }) => book.deuterocanonical },
  { label: "New Testament", match: (book: { testament: string; deuterocanonical: boolean }) => book.testament === "NEW" },
] as const;

/** The books, then chapters, then the chapter itself. Reads the device copy when it is there. */
export default function BibleScreen() {
  const colors = useColors();
  const online = useIsOnline();
  const { corpora } = useCorpora();
  const [translation, setTranslation] = useState(DEFAULT_TRANSLATION);
  const translations = useQuery({ queryKey: ["bible", "translations"], queryFn: () => bible.translations(), enabled: online });
  const choices = translations.data?.translations.map((entry) => ({ code: entry.code, name: entry.name })) ?? corpora.filter((corpus) => corpus.kind === "bible").map((corpus) => ({ code: corpus.id, name: corpus.title }));
  const books = useQuery({ queryKey: keys.books(translation), queryFn: async () => (await listLocalBooks(translation)) ?? bible.books(translation.toLowerCase()) });
  return (
    <Screen>
      <Text variant="eyebrow">Read</Text>
      <Text variant="display">{books.data?.translation.name ?? "Bible"}</Text>
      <Text variant="muted">Choose a translation and a book, then a chapter.</Text>
      {choices.length > 1 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }} accessibilityRole="tablist">
          {choices.map((choice) => (
            <Pressable key={choice.code} onPress={() => setTranslation(choice.code)} accessibilityRole="tab" accessibilityState={{ selected: choice.code === translation }} accessibilityLabel={choice.name} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: choice.code === translation ? colors.ink : colors.border, backgroundColor: choice.code === translation ? colors.ink : "transparent" }}>
              <Text style={{ fontSize: 13, color: choice.code === translation ? colors.background : colors.muted }}>{choice.code}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {books.isPending && <Text variant="muted">Loading…</Text>}
      {books.isError && <Notice message="The books could not be loaded. Connect, or download the translation from More › Offline copies." action={{ label: "Try again", onPress: () => void books.refetch() }} />}
      {GROUPS.map((group) => (
        (books.data?.books.some(group.match) ?? false) && <View key={group.label} style={{ gap: spacing.sm }}>
          <Text variant="eyebrow" style={{ color: colors.muted, marginTop: spacing.sm }}>{group.label}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {books.data?.books.filter(group.match).map((book) => (
              <Link key={book.slug} href={{ pathname: "/bible/[translation]/[book]", params: { translation: translation.toLowerCase(), book: book.slug } }} asChild>
                <Pressable style={({ pressed }) => ({ width: "48%", flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 })}>
                  <View style={{ flex: 1 }}>
                    <Text variant="title" style={{ fontSize: 18 }} numberOfLines={1}>{bookLabel(book)}</Text>
                    {book.localName !== null && <Text variant="muted" style={{ fontSize: 11 }} numberOfLines={1}>{book.name}</Text>}
                  </View>
                  <Text variant="muted" style={{ fontSize: 12 }}>{book.chapterCount}</Text>
                </Pressable>
              </Link>
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}

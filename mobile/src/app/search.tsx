import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Search as SearchIcon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Notice, Screen, Text } from "@/components/ui";
import { search } from "@/lib/api";
import { searchLocal, useCorpora, useIsOnline } from "@/lib/offline";
import { keys } from "@/lib/query";
import { radius, spacing, useColors } from "@/theme";

/** Search verses and hymns by the words. */
export default function SearchScreen() {
  const colors = useColors();
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const online = useIsOnline();
  const { hasAny, isLoaded } = useCorpora();
  const useLocal = hasAny || !online;
  const results = useQuery({ queryKey: [...keys.search(query), useLocal ? "local" : "api"], queryFn: () => (useLocal ? searchLocal(query) : search.all(query)), enabled: isLoaded && query.length >= 2 });
  const verses = results.data?.verses?.results ?? [];
  const hymnHits = results.data?.hymns?.results ?? [];

  return (
    <Screen>
      {useLocal && <Text variant="muted" style={{ fontSize: 12 }}>{hasAny ? "Searching the copy on this device." : "You are offline and nothing is downloaded yet. Open More › Offline copies to keep the words with you."}</Text>}
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
        <SearchIcon size={18} color={colors.muted} />
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => setQuery(text.trim())}
          returnKeyType="search"
          placeholder="A phrase, a reference, a first line"
          placeholderTextColor={colors.muted}
          style={{ flex: 1, paddingVertical: spacing.md, color: colors.ink, fontSize: 16 }}
        />
      </View>
      {results.isPending && query !== "" && <Text variant="muted">Searching…</Text>}
      {results.isError && <Notice message="Search is unavailable right now. Check your connection, or download a translation for offline search." action={{ label: "Try again", onPress: () => void results.refetch() }} />}
      {results.data && verses.length === 0 && hymnHits.length === 0 && <Text variant="muted">Nothing matched “{query}”. Try fewer or more exact words.</Text>}
      {verses.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          <Text variant="eyebrow">Verses</Text>
          {verses.map((hit) => (
            <Link key={`${hit.translation}-${hit.book.slug}-${hit.chapter}-${hit.verse}`} href={{ pathname: "/bible/[translation]/[book]/[chapter]/[verse]", params: { translation: hit.translation.toLowerCase(), book: hit.book.slug, chapter: String(hit.chapter), verse: String(hit.verse) } }} asChild>
              <Pressable style={{ gap: 2 }}><View style={{ flexDirection: "row", alignItems: "baseline", gap: spacing.sm }}><Text variant="title">{hit.reference}</Text><Text variant="eyebrow" style={{ color: colors.muted }}>{hit.translation}</Text></View><Text variant="muted" numberOfLines={2}>{hit.text}</Text></Pressable>
            </Link>
          ))}
        </View>
      )}
      {hymnHits.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          <Text variant="eyebrow">Hymns</Text>
          {hymnHits.map((hit) => (
            <Link key={hit.slug} href={{ pathname: "/hymns/[slug]", params: { slug: hit.slug } }} asChild>
              <Pressable style={{ gap: 2 }}><Text variant="title">{hit.title}</Text><Text variant="muted" numberOfLines={1}>{hit.firstLine}</Text></Pressable>
            </Link>
          ))}
        </View>
      )}
    </Screen>
  );
}

import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, Keyboard, Pressable, View } from "react-native";
import type { HymnalDto, HymnalEntryDto } from "@scriptune/contracts";
import { HymnBoardInput, hymnalShortName } from "@/components/hymns";
import { Notice, Screen, Text } from "@/components/ui";
import { ApiError, hymns } from "@/lib/api";
import { useIsOnline } from "@/lib/offline";
import { keys } from "@/lib/query";
import { fonts, radius, spacing, useColors } from "@/theme";

const PAGE = 100;
const loose = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
type Row = { kind: "section"; key: string; title: string } | { kind: "entry"; key: string; entry: HymnalEntryDto; first: boolean };

/** Entries in book order, with a heading wherever the book starts a new section. */
function toRows(entries: readonly HymnalEntryDto[]): Row[] {
  const rows: Row[] = [];
  let section: string | undefined;
  entries.forEach((entry, index) => {
    if (entry.section !== undefined && entry.section !== section) {
      section = entry.section;
      rows.push({ kind: "section", key: `s-${entry.number}`, title: entry.section });
    }
    rows.push({ kind: "entry", key: `e-${entry.number}-${entry.hymn.slug}`, entry, first: index === 0 || rows[rows.length - 1]?.kind === "section" });
  });
  return rows;
}

function BookPicker({ books, current, onPick }: { books: readonly HymnalDto[]; current: string | null; onPick: (slug: string) => void }) {
  const colors = useColors();
  if (books.length < 2) return null;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }} accessibilityRole="tablist">
      {books.map((book) => {
        const active = book.slug === current;
        return (
          <Pressable key={book.slug} onPress={() => onPick(book.slug)} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={book.title} style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: active ? colors.ink : colors.border, backgroundColor: active ? colors.ink : colors.surface, flexDirection: "row", alignItems: "baseline", gap: 6 }}>
            <Text style={{ fontFamily: fonts.serif, fontSize: 16, color: active ? colors.background : colors.ink }}>{hymnalShortName(book.title)}</Text>
            <Text style={{ fontSize: 11, color: active ? colors.background : colors.muted, opacity: active ? 0.7 : 1 }}>{book.entryCount}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Every hymn in the chosen book, by number, with a hymn board to jump to one. */
export default function HymnsScreen() {
  const colors = useColors();
  const online = useIsOnline();
  const hymnals = useQuery({ queryKey: keys.hymnals(), queryFn: () => hymns.hymnals() });
  const [chosen, setChosen] = useState<string | null>(null);
  const books: HymnalDto[] = hymnals.data?.hymnals ?? [];
  const slug = chosen ?? books[0]?.slug ?? null;
  const current = books.find((book) => book.slug === slug) ?? null;

  const entries = useInfiniteQuery({
    queryKey: [...keys.hymnal(slug ?? ""), "entries"],
    queryFn: ({ pageParam }) => hymns.hymnal(slug ?? "", pageParam, PAGE),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.entries.page < last.entries.totalPages ? last.entries.page + 1 : undefined),
    enabled: slug !== null,
  });
  const rows = useMemo(() => toRows(entries.data?.pages.flatMap((page) => page.entries.items) ?? []), [entries.data]);

  const [number, setNumber] = useState("");
  const jump = useMutation({
    mutationFn: (value: number) => hymns.byNumber(slug ?? "", value),
    onSuccess: (hymn) => { Keyboard.dismiss(); setNumber(""); router.push({ pathname: "/hymns/[slug]", params: { slug: hymn.slug } }); },
  });
  const wanted = Number.parseInt(number, 10);
  const canJump = slug !== null && Number.isInteger(wanted) && wanted > 0 && !jump.isPending;
  const go = () => { if (canJump) jump.mutate(wanted); };
  const jumpError = jump.isError ? (jump.error instanceof ApiError && jump.error.status === 404 ? `There is no hymn ${wanted} in this book.` : "Could not open that hymn. Check your connection and try again.") : null;

  const header = (
    <View style={{ gap: spacing.md, paddingBottom: spacing.sm }}>
      <View>
        <Text variant="eyebrow">Sing</Text>
        <Text variant="display">{current?.title ?? "Hymns"}</Text>
        {current?.publisher && <Text variant="muted" style={{ marginTop: 2 }}>{[current.publisher, current.edition].filter(Boolean).join(" · ")}</Text>}
      </View>
      <BookPicker books={books} current={slug} onPick={(next) => { setChosen(next); setNumber(""); jump.reset(); }} />
      {current && (
        <View style={{ gap: spacing.xs }}>
          <View style={{ flexDirection: "row", alignItems: "stretch", gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <HymnBoardInput book={current.title} value={number} onChangeText={(next) => { setNumber(next.replace(/[^0-9]/g, "")); if (jump.isError) jump.reset(); }} onSubmitEditing={go} placeholder="No." hint={`Hymns 1 to ${current.entryCount}`} />
            </View>
            <Pressable onPress={go} disabled={!canJump} accessibilityRole="button" accessibilityLabel="Open this hymn number" style={({ pressed }) => ({ width: 56, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: canJump ? colors.gold : colors.surface, borderWidth: canJump ? 0 : 1, borderColor: colors.border, opacity: pressed ? 0.8 : 1 })}>
              <ArrowRight size={22} color={canJump ? colors.ink : colors.muted} strokeWidth={2.25} />
            </Pressable>
          </View>
          {jumpError && <Notice compact message={jumpError} />}
        </View>
      )}
      {!online && <Text variant="muted" style={{ fontSize: 12 }}>You are offline. Downloaded hymns still open from Search; the full list needs a connection.</Text>}
      {(hymnals.isPending || (entries.isPending && slug !== null)) && <Text variant="muted">Loading…</Text>}
      {(hymnals.isError || entries.isError) && <Notice message="The hymnal could not be loaded. Check your connection and try again." />}
      {hymnals.data && books.length === 0 && <Text variant="muted">No hymnals yet.</Text>}
    </View>
  );

  return (
    <Screen scroll={false} style={{ paddingBottom: 0 }}>
      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onEndReachedThreshold={0.6}
        onEndReached={() => { if (entries.hasNextPage && !entries.isFetchingNextPage) void entries.fetchNextPage(); }}
        initialNumToRender={24}
        windowSize={7}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        renderItem={({ item }) =>
          item.kind === "section" ? (
            <Text variant="eyebrow" style={{ color: colors.muted, marginTop: spacing.lg, marginBottom: spacing.xs }}>{item.title}</Text>
          ) : (
            <Link href={{ pathname: "/hymns/[slug]", params: { slug: item.entry.hymn.slug } }} asChild>
              <Pressable accessibilityRole="link" accessibilityLabel={`Hymn ${item.entry.number}, ${item.entry.hymn.title}`} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: spacing.md, paddingVertical: 11, borderTopWidth: item.first ? 0 : 1, borderTopColor: colors.border }}>
                  <Text style={{ width: 44, textAlign: "right", fontFamily: fonts.serif, fontSize: 19, color: colors.gold }}>{item.entry.number}</Text>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontFamily: fonts.serif, fontSize: 18 }}>{item.entry.hymn.title}</Text>
                    {item.entry.hymn.firstLine !== null && loose(item.entry.hymn.firstLine) !== loose(item.entry.hymn.title) && <Text variant="muted" numberOfLines={1} style={{ fontSize: 13 }}>{item.entry.hymn.firstLine}</Text>}
                  </View>
                </View>
              </Pressable>
            </Link>
          )
        }
        ListFooterComponent={entries.isFetchingNextPage ? <Text variant="muted" style={{ paddingVertical: spacing.md, textAlign: "center" }}>Loading more…</Text> : null}
      />
    </Screen>
  );
}

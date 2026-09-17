import { useQuery } from "@tanstack/react-query";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { ShareButton } from "@/components/common";
import { HymnBoard } from "@/components/hymns";
import { AddToCollectionButton, NoteEditor, SaveButton } from "@/components/library";
import { Notice, Screen, Text } from "@/components/ui";
import { hymns } from "@/lib/api";
import { readLocalHymn } from "@/lib/offline";
import { keys } from "@/lib/query";
import { fonts, radius, spacing, useColors } from "@/theme";

const LANGUAGE_NAMES: Record<string, string> = { en: "English", yo: "Yorùbá", ig: "Igbo", ha: "Hausa", fr: "Français" };

/** A hymn's words, stanza by stanza, with the hymn board number. */
export default function HymnScreen() {
  const colors = useColors();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const hymn = useQuery({ queryKey: keys.hymn(slug), queryFn: async () => (await readLocalHymn(slug)) ?? hymns.get(slug) });
  const [language, setLanguage] = useState<string | null>(null);
  const texts = hymn.data?.texts ?? [];
  const ordered = [...texts].sort((a, b) => (a.language === "en" ? -1 : b.language === "en" ? 1 : 0));
  const text = ordered.find((entry) => entry.language === language) ?? ordered[0];
  const placement = hymn.data?.placements[0];

  return (
    <Screen>
      <Stack.Screen options={{ title: hymn.data?.title ?? "Hymn" }} />
      {hymn.isPending && <Text variant="muted">Loading…</Text>}
      {hymn.isError && <Notice message="This hymn is not on the device and could not be fetched. Connect, or download the hymnal from the Offline screen." action={{ label: "Try again", onPress: () => void hymn.refetch() }} />}
      {hymn.data && (
        <>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text variant="eyebrow">Hymn</Text>
              <Text variant="display">{hymn.data.title}</Text>
            </View>
            {placement && <HymnBoard book={placement.hymnal.title} number={placement.number} />}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <SaveButton type="hymn" targetKey={hymn.data.slug} />
            <AddToCollectionButton type="hymn" targetKey={hymn.data.slug} />
            <ShareButton title={hymn.data.title} path={`/hymns/${hymn.data.slug}`} />
          </View>
          {ordered.length > 1 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }} accessibilityRole="tablist">
              {ordered.map((entry) => {
                const selected = entry.language === (text?.language ?? "");
                return (
                  <Pressable key={entry.language} onPress={() => setLanguage(entry.language)} accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={LANGUAGE_NAMES[entry.language] ?? entry.language} style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: selected ? colors.ink : colors.border, backgroundColor: selected ? colors.ink : "transparent" }}>
                    <Text style={{ fontSize: 13, color: selected ? colors.background : colors.muted }}>{LANGUAGE_NAMES[entry.language] ?? entry.language.toUpperCase()}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {text?.stanzas.map((stanza, index) => (
            <View key={index} style={{ flexDirection: "row", gap: spacing.md, paddingLeft: stanza.kind === "chorus" ? spacing.lg : 0 }}>
              <Text variant="muted" style={{ width: 24, textAlign: "right", fontVariant: ["tabular-nums"] }}>{stanza.kind === "chorus" ? "" : stanza.number}</Text>
              <View style={{ flex: 1 }}>
                {stanza.kind === "chorus" && <Text variant="eyebrow">Chorus</Text>}
                {stanza.lines.map((line, lineIndex) => <Text key={lineIndex} style={{ fontFamily: fonts.serif, fontSize: 19, lineHeight: 30 }}>{line}</Text>)}
              </View>
            </View>
          ))}
          {hymn.data.scriptureReferences.length > 0 && (
            <View style={{ gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }}>
              <Text variant="eyebrow">Scripture in this hymn</Text>
              <View style={{ borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: "hidden" }}>
                {hymn.data.scriptureReferences.map((reference, index) => (
                  <Link key={reference.reference} href={reference.verseStart === null ? { pathname: "/bible/[translation]/[book]/[chapter]", params: { translation: "kjv", book: reference.book, chapter: String(reference.chapter) } } : { pathname: "/bible/[translation]/[book]/[chapter]/[verse]", params: { translation: "kjv", book: reference.book, chapter: String(reference.chapter), verse: String(reference.verseStart) } }} asChild>
                    <Pressable accessibilityRole="link" style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                      <View style={{ paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: colors.border, gap: 2 }}>
                        <Text variant="title" style={{ fontSize: 17 }}>{reference.reference}</Text>
                        {reference.note !== undefined && <Text variant="muted" style={{ fontSize: 13 }}>{reference.note}</Text>}
                      </View>
                    </Pressable>
                  </Link>
                ))}
              </View>
            </View>
          )}
          <NoteEditor type="hymn" targetKey={hymn.data.slug} />
          {text && <Text variant="muted" style={{ fontSize: 12 }}>{text.rightsStatus === "public-domain" ? "These words are in the public domain." : "Used by permission of the rights holder."}</Text>}
        </>
      )}
    </Screen>
  );
}

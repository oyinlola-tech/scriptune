import { Link } from "expo-router";
import { Pressable, View } from "react-native";
import type { RecognitionCandidate } from "@scriptune/contracts";
import { Text } from "@/components/ui";
import { radius, spacing, useColors } from "@/theme";

/** One match: what it is, how sure we are, and where it leads. */
export function CandidateCard({ candidate, rank }: { candidate: RecognitionCandidate; rank: number }) {
  const colors = useColors();
  const href = candidate.type === "hymn"
    ? { pathname: "/hymns/[slug]", params: { slug: candidate.slug } } as const
    : { pathname: "/bible/[translation]/[book]/[chapter]/[verse]", params: { translation: candidate.translation.toLowerCase(), book: candidate.book, chapter: String(candidate.chapter), verse: String(candidate.verse) } } as const;
  return (
    <Link href={href} asChild>
      <Pressable style={({ pressed }) => ({ padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: rank === 0 ? colors.gold : colors.border, opacity: pressed ? 0.85 : 1, gap: spacing.xs })}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text variant="eyebrow">{candidate.type === "hymn" ? "Hymn" : candidate.translation}</Text>
          <Text variant="muted" style={{ color: candidate.confidence >= 70 ? colors.gold : colors.muted, fontVariant: ["tabular-nums"] }}>{candidate.confidence}% sure</Text>
        </View>
        <Text variant="title">{candidate.type === "hymn" ? candidate.title : candidate.reference}</Text>
        <Text variant="muted" numberOfLines={2}>{candidate.type === "hymn" ? candidate.firstLine : candidate.text}</Text>
      </Pressable>
    </Link>
  );
}

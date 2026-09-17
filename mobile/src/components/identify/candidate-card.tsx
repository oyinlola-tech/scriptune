import { Link } from "expo-router";
import { Pressable, View } from "react-native";
import type { RecognitionCandidate } from "@scriptune/contracts";
import { Text } from "@/components/ui";
import { radius, spacing, useColors } from "@/theme";

const loose = (text: string | null | undefined): string => (text ?? "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

/** The same three words the website uses, at the same thresholds. */
export function confidenceLabel(confidence: number): string {
  if (confidence >= 80) return "Strong match";
  if (confidence >= 50) return "Likely";
  return "Possible";
}

/** One match: what it is, how sure we are, and where it leads. */
export function CandidateCard({ candidate, rank }: { candidate: RecognitionCandidate; rank: number }) {
  const colors = useColors();
  const href = candidate.type === "hymn"
    ? { pathname: "/hymns/[slug]", params: { slug: candidate.slug } } as const
    : { pathname: "/bible/[translation]/[book]/[chapter]/[verse]", params: { translation: candidate.translation.toLowerCase(), book: candidate.book, chapter: String(candidate.chapter), verse: String(candidate.verse) } } as const;
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="link" style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        {/* Layout lives on this View: a Pressable inside Link asChild loses function styles on web. */}
        <View style={{ padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: rank === 0 ? colors.gold : colors.border, gap: spacing.xs }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text variant="eyebrow">{candidate.type === "hymn" ? "Hymn" : candidate.translation}</Text>
          <Text variant="muted" style={{ fontSize: 13, color: candidate.confidence >= 80 ? colors.gold : colors.muted, fontVariant: ["tabular-nums"] }}>{confidenceLabel(candidate.confidence)} · {candidate.confidence}%</Text>
        </View>
        <Text variant="title">{candidate.type === "hymn" ? candidate.title : candidate.reference}</Text>
        {/* Most hymns are known by their first line; saying it twice adds nothing. */}
        {(candidate.type !== "hymn" || loose(candidate.firstLine) !== loose(candidate.title)) && <Text variant="muted" numberOfLines={2}>{candidate.type === "hymn" ? candidate.firstLine : candidate.text}</Text>}
        </View>
      </Pressable>
    </Link>
  );
}

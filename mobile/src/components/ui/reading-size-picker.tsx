import { Pressable, View } from "react-native";
import { useSettings, type ReadingSize } from "@/lib/settings";
import { fonts, radius, spacing, useColors } from "@/theme";
import { ReadingText } from "./reading-text";
import { Text } from "./text";

const OPTIONS: { value: ReadingSize; label: string; glyph: number }[] = [
  { value: "small", label: "Small", glyph: 13 },
  { value: "medium", label: "Medium", glyph: 16 },
  { value: "large", label: "Large", glyph: 19 },
  { value: "xlarge", label: "Extra large", glyph: 22 },
];

/** Four sizes for hymn and scripture text, each shown as the letter it will set, with a sample line beneath. */
export function ReadingSizePicker() {
  const colors = useColors();
  const readingSize = useSettings((state) => state.readingSize);
  const setReadingSize = useSettings((state) => state.setReadingSize);
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="eyebrow" style={{ color: colors.muted }}>Reading size</Text>
      <View style={{ flexDirection: "row", gap: spacing.xs, backgroundColor: colors.surface, borderRadius: radius.pill, padding: 3, borderWidth: 1, borderColor: colors.border }} accessibilityRole="radiogroup" accessibilityLabel="Reading size">
        {OPTIONS.map((option) => {
          const selected = option.value === readingSize;
          return (
            <Pressable key={option.value} onPress={() => setReadingSize(option.value)} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={option.label} style={{ flex: 1, height: 40, justifyContent: "center", alignItems: "center", borderRadius: radius.pill, backgroundColor: selected ? colors.ink : "transparent" }}>
              <Text style={{ fontFamily: fonts.serif, fontSize: option.glyph, lineHeight: option.glyph + 4, color: selected ? colors.background : colors.muted }}>A</Text>
            </Pressable>
          );
        })}
      </View>
      <ReadingText accessibilityLabel="Sample of the chosen size">The Lord is my shepherd; I shall not want.</ReadingText>
    </View>
  );
}

import type { TranslationSummaryDto } from "@scriptune/contracts";
import { View } from "react-native";
import { Text } from "@/components/ui";
import { spacing, useColors } from "@/theme";

/** The copyright line an openly licensed translation asks to have shown beside its text. */
export function TranslationNotice({ translation }: { translation: TranslationSummaryDto }) {
  const colors = useColors();
  // Falsy, not just null: a copy downloaded before the field existed has no notice at all.
  if (!translation.notice) return null;
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, marginTop: spacing.sm }}>
      <Text variant="muted" style={{ fontSize: 12, lineHeight: 18 }}>{translation.notice}</Text>
    </View>
  );
}

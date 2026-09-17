import { useQuery } from "@tanstack/react-query";
import { Pressable, ScrollView } from "react-native";
import { Text } from "@/components/ui";
import { bible } from "@/lib/api";
import { useIsOnline } from "@/lib/offline";
import { radius, spacing, useColors } from "@/theme";

/** A row of translation codes; tapping one reads the same place in that translation. */
export function TranslationSwitcher({ current, onChoose }: { current: string; onChoose: (code: string) => void }) {
  const colors = useColors();
  const online = useIsOnline();
  const translations = useQuery({ queryKey: ["bible", "translations"], queryFn: () => bible.translations(), enabled: online, staleTime: 60 * 60 * 1000 });
  const choices = translations.data?.translations ?? [];
  if (choices.length < 2) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingVertical: 2 }} accessibilityRole="tablist" accessibilityLabel="Translations">
      {choices.map((choice) => {
        const active = choice.code.toUpperCase() === current.toUpperCase();
        return (
          <Pressable key={choice.code} onPress={() => { if (!active) onChoose(choice.code.toLowerCase()); }} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={choice.name} hitSlop={6} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: active ? colors.ink : colors.border, backgroundColor: active ? colors.ink : "transparent" }}>
            <Text style={{ fontSize: 13, color: active ? colors.background : colors.muted }}>{choice.code}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

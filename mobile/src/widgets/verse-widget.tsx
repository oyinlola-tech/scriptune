import { verseForDate } from "@scriptune/contracts";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { palette } from "@/theme/tokens";

/** A wide widget with today's verse. Tapping opens the passage in the app. */
export function VerseWidget({ dark = false }: { dark?: boolean }) {
  const colors = dark ? palette.dark : palette.light;
  const verse = verseForDate();
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: `scriptune://bible/${verse.translation.toLowerCase()}/${verse.book}/${verse.chapter}/${verse.verse}` }}
      accessibilityLabel={`Verse of the day, ${verse.reference}`}
      style={{ height: "match_parent", width: "match_parent", backgroundColor: colors.surface, borderRadius: 24, justifyContent: "center", padding: 16 }}
    >
      <TextWidget text="VERSE OF THE DAY" style={{ fontSize: 10, fontWeight: "600", color: colors.gold, marginBottom: 8 }} />
      <TextWidget text={`“${verse.text}”`} maxLines={4} style={{ fontSize: 15, color: colors.ink, marginBottom: 8 }} />
      <TextWidget text={`${verse.reference} · ${verse.translation}`} style={{ fontSize: 12, color: colors.muted }} />
    </FlexWidget>
  );
}

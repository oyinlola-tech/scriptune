import { FlexWidget, SvgWidget, TextWidget } from "react-native-android-widget";
import { palette } from "@/theme/tokens";

const SEARCH_SVG = (color: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;

/** A wide widget shaped like the app's search field. Tapping opens the Search tab. */
export function SearchWidget({ dark = false }: { dark?: boolean }) {
  const colors = dark ? palette.dark : palette.light;
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: "scriptune://search" }}
      accessibilityLabel="Search hymns and verses in Scriptune"
      style={{ height: "match_parent", width: "match_parent", backgroundColor: colors.surface, borderRadius: 24, justifyContent: "center", padding: 14 }}
    >
      <TextWidget text="SCRIPTUNE" style={{ fontSize: 10, fontWeight: "600", color: colors.gold, letterSpacing: 0.2, marginBottom: 8 }} />
      <FlexWidget style={{ flexDirection: "row", alignItems: "center", width: "match_parent", borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 }}>
        <SvgWidget svg={SEARCH_SVG(colors.muted)} style={{ width: 18, height: 18, marginRight: 10 }} />
        <TextWidget text="Search hymns and verses" style={{ fontSize: 15, color: colors.muted }} />
      </FlexWidget>
    </FlexWidget>
  );
}

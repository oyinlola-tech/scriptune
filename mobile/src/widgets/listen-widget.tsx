import { FlexWidget, SvgWidget, TextWidget } from "react-native-android-widget";
import { palette } from "@/theme/tokens";

const MIC_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${palette.light.background}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`;

/** A small square widget: the ink listening disc. Tapping opens the app and starts listening. */
export function ListenWidget({ dark = false }: { dark?: boolean }) {
  const colors = dark ? palette.dark : palette.light;
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: "scriptune://listen" }}
      accessibilityLabel="Listen with Scriptune"
      style={{ height: "match_parent", width: "match_parent", backgroundColor: colors.surface, borderRadius: 24, justifyContent: "center", alignItems: "center", padding: 12 }}
    >
      <FlexWidget style={{ width: 84, height: 84, borderRadius: 42, borderWidth: 3, borderColor: colors.gold, justifyContent: "center", alignItems: "center" }}>
        <FlexWidget style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: colors.ink, justifyContent: "center", alignItems: "center" }}>
          <SvgWidget svg={MIC_SVG} style={{ width: 28, height: 28 }} />
        </FlexWidget>
      </FlexWidget>
      <TextWidget text="Listen" style={{ fontSize: 13, fontWeight: "600", color: colors.ink, marginTop: 8 }} />
      <TextWidget text="Hymn or verse" style={{ fontSize: 11, color: colors.muted }} />
    </FlexWidget>
  );
}

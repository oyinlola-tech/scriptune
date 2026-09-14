import { View } from "react-native";
import { Text } from "@/components/ui";
import { fonts, useColors } from "@/theme";

/** The listening disc at rest: ink circle inside a dashed gold dial. */
export function ListenIllustration() {
  const colors = useColors();
  return (
    <View style={{ width: 200, height: 200, alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "absolute", width: 200, height: 200, borderRadius: 100, borderWidth: 5, borderColor: colors.gold, borderStyle: "dashed", opacity: 0.6 }} />
      <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 26, height: 46, borderRadius: 13, backgroundColor: colors.background }} />
      </View>
    </View>
  );
}

/** A hymn board slat and a verse line: what a match looks like. */
export function ReadIllustration() {
  const colors = useColors();
  return (
    <View style={{ width: 240, gap: 14, alignItems: "center" }}>
      <View style={{ alignItems: "center", backgroundColor: colors.ink, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, minWidth: 92 }}>
        <Text style={{ color: colors.background, fontSize: 9, letterSpacing: 2, opacity: 0.7 }}>SS&S</Text>
        <Text style={{ color: colors.background, fontFamily: fonts.serif, fontSize: 40, lineHeight: 44 }}>533</Text>
      </View>
      <Text style={{ fontFamily: fonts.serif, fontSize: 20, lineHeight: 28, textAlign: "center" }}>Amazing grace! how sweet the sound,{"\n"}That saved a wretch like me!</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Text variant="eyebrow">John 3:16</Text>
        <Text variant="muted" style={{ fontSize: 11 }}>·</Text>
        <Text variant="eyebrow">Psalm 23</Text>
      </View>
    </View>
  );
}

/** Three little cards: saved, a collection, a downloaded corpus. */
export function KeepIllustration() {
  const colors = useColors();
  const card = { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, width: 220 };
  return (
    <View style={{ gap: 10, alignItems: "center" }}>
      <View style={[card, { borderColor: colors.gold }]}><Text variant="eyebrow">Saved</Text><Text variant="title">It is well with my soul</Text></View>
      <View style={card}><Text variant="eyebrow">Collection</Text><Text variant="title">Sunday, 20 September</Text><Text variant="muted">4 hymns · 2 readings</Text></View>
      <View style={card}><Text variant="eyebrow">On this device</Text><Text variant="title">King James Version</Text><Text variant="muted">31,102 verses, no connection needed</Text></View>
    </View>
  );
}

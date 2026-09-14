import { GIVING_WIDGET_COLORS, LEGAL_CONTACT, PROJECT_LINKS, givingWidgetUrl } from "@scriptune/contracts";
import * as WebBrowser from "expo-web-browser";
import { Bug, ChevronRight, GitBranch, Heart, Lightbulb, Mail, type LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { Linking, Pressable, View, useColorScheme } from "react-native";
import { Button, Notice, Screen, Text } from "@/components/ui";
import { radius, spacing, useColors } from "@/theme";

const GITHUB_ROWS: { href: string; icon: LucideIcon; title: string; text: string }[] = [
  { href: PROJECT_LINKS.reportProblem, icon: Bug, title: "Report a problem", text: "A hymn that will not identify, a verse in the wrong place, a crash. Say what you did and what happened." },
  { href: PROJECT_LINKS.suggest, icon: Lightbulb, title: "Suggest something", text: "A hymnal your church sings from, a translation, a feature you wish were there." },
  { href: PROJECT_LINKS.github, icon: GitBranch, title: "Read or improve the code", text: "Scriptune is open source. Fork it, fix it, send a pull request." },
];

/** Opens a link in the in-app browser sheet, falling back to the system browser. */
async function open(url: string, colors: { ink: string; background: string }): Promise<boolean> {
  try {
    const result = await WebBrowser.openBrowserAsync(url, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET, toolbarColor: colors.background, controlsColor: colors.ink, dismissButtonStyle: "close" });
    return result.type !== "cancel" || true;
  } catch {
    return Linking.openURL(url).then(() => true, () => false);
  }
}

function LinkRow({ href, icon: Icon, title, text, first, onFail }: { href: string; icon: LucideIcon; title: string; text: string; first: boolean; onFail: () => void }) {
  const colors = useColors();
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={`${title}. ${text}`} onPress={() => { void open(href, colors).then((ok) => { if (!ok) onFail(); }); }} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.md, paddingVertical: 12, paddingHorizontal: spacing.md, borderTopWidth: first ? 0 : 1, borderTopColor: colors.border }}>
        <Icon size={18} color={colors.gold} strokeWidth={2} style={{ marginTop: 3 }} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="title" style={{ fontSize: 18 }}>{title}</Text>
          <Text variant="muted" style={{ fontSize: 13, lineHeight: 18 }}>{text}</Text>
        </View>
        <ChevronRight size={18} color={colors.muted} style={{ marginTop: 4 }} />
      </View>
    </Pressable>
  );
}

/** Two ways to help: build it on GitHub, or keep it running with a gift. Same page as the website. */
export default function SupportScreen() {
  const colors = useColors();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const [failed, setFailed] = useState(false);
  const [opening, setOpening] = useState(false);
  const give = async () => {
    setOpening(true);
    // The giving page carries the app's own colours in either theme.
    const ok = await open(givingWidgetUrl(scheme).replace(PROJECT_LINKS.giveEmbed, PROJECT_LINKS.give), { ink: GIVING_WIDGET_COLORS[scheme].color, background: GIVING_WIDGET_COLORS[scheme].cardBg });
    setOpening(false);
    if (!ok) setFailed(true);
  };
  return (
    <Screen>
      <View>
        <Text variant="eyebrow">Support</Text>
        <Text variant="display">Keep the singing going</Text>
        <Text variant="muted" style={{ marginTop: spacing.xs }}>Scriptune is built by one person for churches that sing. There are two ways to help, and both matter.</Text>
      </View>
      {failed && <Notice message="That page could not be opened on this device." action={{ label: "Dismiss", onPress: () => setFailed(false) }} />}

      <View style={{ gap: spacing.sm }}>
        <Text variant="eyebrow" style={{ color: colors.muted }}>Help build it</Text>
        <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, overflow: "hidden" }}>
          {GITHUB_ROWS.map((row, index) => <LinkRow key={row.href} {...row} first={index === 0} onFail={() => setFailed(true)} />)}
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text variant="eyebrow" style={{ color: colors.muted }}>Help keep it running</Text>
        <View style={{ padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: spacing.sm }}>
          <Text variant="title">A gift of any size</Text>
          <Text variant="muted">Identifying a hymn costs a little every time: the servers, the database and the speech-to-text behind the microphone. There are no adverts and no paid tier, so gifts are what pay for it. One-off or monthly, whatever suits.</Text>
          <Button label={opening ? "Opening…" : "Support Scriptune"} icon={Heart} disabled={opening} onPress={() => void give()} style={{ marginTop: spacing.xs, alignSelf: "flex-start" }} />
        </View>
      </View>

      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(`mailto:${LEGAL_CONTACT.email}`).catch(() => setFailed(true))} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Mail size={16} color={colors.muted} />
          <Text variant="muted">Prefer email? <Text style={{ textDecorationLine: "underline", color: colors.ink }}>{LEGAL_CONTACT.email}</Text></Text>
        </View>
      </Pressable>
    </Screen>
  );
}

import Constants from "expo-constants";
import { Link, type Href } from "expo-router";
import { ChevronRight, CloudDownload, LibraryBig, LogIn, Search, Settings2, type LucideIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Screen, Text } from "@/components/ui";
import { useAuthStore } from "@/lib/auth";
import { fonts, radius, spacing, useColors } from "@/theme";

/** A paper tile: icon, name, one line on what it is for. Two to a row. */
function Tile({ href, icon: Icon, title, blurb }: { href: Href; icon: LucideIcon; title: string; blurb: string }) {
  const colors = useColors();
  return (
    <View style={{ flexBasis: "47%", flexGrow: 1 }}>
      <Link href={href} asChild>
      <Pressable accessibilityRole="link" accessibilityLabel={`${title}. ${blurb}`} style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.7 : 1 })}>
        <View style={{ flex: 1, minHeight: 132, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: "space-between", gap: spacing.md }}>
          <Icon size={22} color={colors.gold} strokeWidth={1.75} />
          <View style={{ gap: 2 }}>
            <Text style={{ fontFamily: fonts.serif, fontSize: 20 }}>{title}</Text>
            <Text variant="muted" style={{ fontSize: 13, lineHeight: 18 }}>{blurb}</Text>
          </View>
        </View>
      </Pressable>
      </Link>
    </View>
  );
}

/** Who is signed in, or an invitation to. */
function AccountCard() {
  const colors = useColors();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  if (status === "member") {
    const label = user?.name ?? user?.email ?? "";
    return (
      <Link href="/settings" asChild>
        <Pressable accessibilityRole="link" accessibilityLabel={`Account, ${label}. Opens settings`} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.ink }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold }}>
            <Text style={{ color: colors.ink, fontFamily: fonts.serif, fontSize: 22 }}>{label.charAt(0).toUpperCase() || "?"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.background }} numberOfLines={1}>{label}</Text>
            <Text style={{ color: colors.background, opacity: 0.65, fontSize: 13 }}>Your library follows you to every device.</Text>
          </View>
          <ChevronRight size={18} color={colors.background} />
          </View>
        </Pressable>
      </Link>
    );
  }
  return (
    <Link href="/auth/login" asChild>
      <Pressable accessibilityRole="link" accessibilityLabel="Sign in" style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: colors.goldSoft }}>
          <LogIn size={18} color={colors.ink} strokeWidth={1.9} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.serif, fontSize: 18 }}>{status === "loading" ? "Checking your session…" : "Sign in"}</Text>
          <Text variant="muted" style={{ fontSize: 13 }}>Keep hymns, verses and notes on every device.</Text>
        </View>
        <ChevronRight size={18} color={colors.muted} />
        </View>
      </Pressable>
    </Link>
  );
}

/** Everything that is not a tab, one tap away. */
export default function MoreScreen() {
  const colors = useColors();
  const status = useAuthStore((state) => state.status);
  const version = Constants.expoConfig?.version ?? "";
  return (
    <Screen>
      <View>
        <Text variant="eyebrow">More</Text>
        <Text variant="display">Everything else</Text>
      </View>
      <AccountCard />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        <Tile href="/search" icon={Search} title="Search" blurb="A phrase, a reference, or a first line." />
        <Tile href="/library" icon={LibraryBig} title="Library" blurb={status === "member" ? "Saved, collections, notes, history." : "What you identified on this device."} />
        <Tile href="/offline" icon={CloudDownload} title="Offline copies" blurb="Keep the words with you without signal." />
        <Tile href="/settings" icon={Settings2} title="Settings" blurb="Listening, appearance, account." />
      </View>
      <View style={{ marginTop: spacing.lg, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.md }}>
        <Text variant="muted" style={{ fontSize: 12 }}>Scriptune{version ? ` ${version}` : ""}</Text>
        <Link href={{ pathname: "/legal/[doc]", params: { doc: "terms" } }} asChild><Pressable accessibilityRole="link"><Text variant="muted" style={{ fontSize: 12, textDecorationLine: "underline" }}>Terms</Text></Pressable></Link>
        <Link href={{ pathname: "/legal/[doc]", params: { doc: "privacy" } }} asChild><Pressable accessibilityRole="link"><Text variant="muted" style={{ fontSize: 12, textDecorationLine: "underline" }}>Privacy</Text></Pressable></Link>
        <Link href={{ pathname: "/legal/[doc]", params: { doc: "copyright" } }} asChild><Pressable accessibilityRole="link"><Text variant="muted" style={{ fontSize: 12, textDecorationLine: "underline", color: colors.muted }}>Copyright</Text></Pressable></Link>
      </View>
    </Screen>
  );
}

import { Link, router } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, ScrollView, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeepIllustration, ListenIllustration, ReadIllustration } from "@/components/onboarding/illustrations";
import { Button, Text } from "@/components/ui";
import { useOnboarding } from "@/lib/onboarding";
import { spacing, useColors } from "@/theme";

const SLIDES = [
  { eyebrow: "Hear it", title: "Hold the disc while the singing lasts", body: "Point your phone at the choir or the pulpit and keep your finger on the disc; Scriptune listens for as long as you hold it, up to fifteen seconds. Let go and it compares what it heard with every hymn and verse it knows, then shows the best matches, with how sure it is.", Illustration: ListenIllustration },
  { eyebrow: "Know it", title: "The words, the number, the passage", body: "Open a match to read the whole hymn with its number on the board, or the verse with the chapter around it. Can't record? Type the few words you remember, or search.", Illustration: ReadIllustration },
  { eyebrow: "Keep it", title: "Save it, and take it with you", body: "Save hymns and verses, group them into collections for a service, and write private notes. Download the words to your phone and everything but listening works without a connection. An account is optional.", Illustration: KeepIllustration },
] as const;

/** Three screens, one idea each, then in. Shown once per device. */
export default function OnboardingScreen() {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const complete = useOnboarding((state) => state.complete);
  const scroller = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };
  const goTo = (next: number) => scroller.current?.scrollTo({ x: next * width, animated: true });
  const finish = async () => {
    await complete();
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
        <Text variant="eyebrow">Scriptune</Text>
        {!last && <Pressable onPress={() => void finish()} hitSlop={12} accessibilityRole="button"><Text variant="muted">Skip</Text></Pressable>}
      </View>
      <ScrollView ref={scroller} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScroll} style={{ flex: 1 }}>
        {SLIDES.map((slide) => (
          <View key={slide.eyebrow} style={{ width, flex: 1, paddingHorizontal: spacing.lg, justifyContent: "center", gap: spacing.lg }}>
            <View style={{ alignItems: "center", minHeight: 240, justifyContent: "center" }}><slide.Illustration /></View>
            <View style={{ gap: spacing.sm }}>
              <Text variant="eyebrow">{slide.eyebrow}</Text>
              <Text variant="display">{slide.title}</Text>
              <Text variant="muted">{slide.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md }}>
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }} accessibilityLabel={`Screen ${index + 1} of ${SLIDES.length}`}>
          {SLIDES.map((slide, dot) => <View key={slide.eyebrow} style={{ width: dot === index ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: dot === index ? colors.gold : colors.border }} />)}
        </View>
        <Button label={last ? "Get started" : "Next"} onPress={() => (last ? void finish() : goTo(index + 1))} />
        {last && (
          <Text variant="muted" style={{ textAlign: "center", fontSize: 12 }}>
            By continuing you agree to the <Link href="/legal/terms" style={{ textDecorationLine: "underline", color: colors.ink }}>Terms</Link> and <Link href="/legal/privacy" style={{ textDecorationLine: "underline", color: colors.ink }}>Privacy Policy</Link>.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

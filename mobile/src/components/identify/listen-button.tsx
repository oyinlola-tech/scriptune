import * as Haptics from "expo-haptics";
import { Mic, Square } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Pressable, View } from "react-native";
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { Text } from "@/components/ui";
import { useColors } from "@/theme";
import type { RecorderStatus } from "@/lib/recorder/use-recorder";

/** A hold shorter than this heard nothing worth sending: the clip is dropped and the hint asks for a longer hold. */
const MIN_HOLD_MS = 800;
/** How long that hint stays up. */
const HINT_MS = 4_000;

/**
 * The listening disc: an ink circle in a gold ring that turns while listening.
 * Held down it listens, like a walkie-talkie; letting go sends the clip. A
 * clip that started on its own (widget, shortcut, or listen on opening) has no
 * finger on it, so a tap ends that one.
 */
export function ListenButton({ status, onStart, onStop, onCancel, onHoldChange }: { status: RecorderStatus; onStart: () => void; onStop: () => void; onCancel: () => void; /** True while a finger is on the disc, so the page can hold still under it. */ onHoldChange?: (holding: boolean) => void }) {
  const colors = useColors();
  const recording = status === "recording";
  const busy = status === "requesting" || status === "processing";
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);

  // Press-and-hold is a poor fit for a screen reader, whose activation is a
  // single gesture: with one running, the disc goes back to tap on, tap off.
  const [screenReader, setScreenReader] = useState(false);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isScreenReaderEnabled().then((on) => { if (alive) setScreenReader(on); }).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener("screenReaderChanged", setScreenReader);
    return () => { alive = false; subscription.remove(); };
  }, []);

  // The finger currently on the disc. A ref for the decisions (a release can
  // land in the same frame as the press), mirrored into state for the label.
  const hold = useRef<{ at: number; released: boolean } | null>(null);
  const [holding, setHoldingState] = useState(false);
  const [tooShort, setTooShort] = useState(false);
  const holdChanged = useRef(onHoldChange);
  useEffect(() => { holdChanged.current = onHoldChange; });
  const setHolding = useCallback((on: boolean) => {
    setHoldingState(on);
    holdChanged.current?.(on);
  }, []);

  useEffect(() => {
    if (!tooShort) return undefined;
    const timer = setTimeout(() => setTooShort(false), HINT_MS);
    return () => clearTimeout(timer);
  }, [tooShort]);

  const endHold = useCallback((at: number) => {
    hold.current = null;
    setHolding(false);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Date.now() - at < MIN_HOLD_MS) {
      setTooShort(true);
      onCancel();
    } else {
      onStop();
    }
  }, [onCancel, onStop, setHolding]);

  const release = useCallback(() => {
    const held = hold.current;
    if (held === null || held.released) return;
    // Still asking for the microphone, or already finished on its own: remember
    // the release and settle it below, once the recorder has landed somewhere.
    if (status !== "recording") {
      held.released = true;
      return;
    }
    endHold(held.at);
  }, [endHold, status]);

  // Settles a hold whenever the recorder moves on: only a real change counts,
  // since the callbacks below are fresh on every render of the screen.
  const settled = useRef(status);
  useEffect(() => {
    if (settled.current === status) return;
    settled.current = status;
    const held = hold.current;
    if (held === null) return;
    if (held.released) {
      // The finger came off while the microphone was still starting.
      if (status === "recording") endHold(held.at);
      else if (status !== "requesting") { hold.current = null; setHolding(false); }
      return;
    }
    // Still held, but the clip ended on its own: the fifteen-second cap, or a
    // refused microphone. The disc is disabled then and will send no release.
    if (status === "processing" || status === "idle" || status === "denied") {
      hold.current = null;
      setHolding(false);
    }
  }, [endHold, setHolding, status]);

  const press = () => {
    if (busy) return;
    if (screenReader) {
      if (recording) onStop(); else onStart();
      return;
    }
    if (recording) {
      // Started without a finger on it; this tap ends it.
      if (hold.current === null) onStop();
      return;
    }
    setTooShort(false);
    hold.current = { at: Date.now(), released: false };
    setHolding(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onStart();
  };

  useEffect(() => {
    if (recording) {
      rotation.value = withRepeat(withTiming(360, { duration: 14_000, easing: Easing.linear }), -1);
      pulse.value = withRepeat(withTiming(1.08, { duration: 900 }), -1, true);
    } else {
      cancelAnimation(rotation);
      cancelAnimation(pulse);
      rotation.value = withTiming(0);
      pulse.value = withTiming(1);
    }
  }, [recording, rotation, pulse]);

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
  const discStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const label =
    recording ? (holding ? "Listening… let go when it has heard enough" : "Listening… tap to stop") :
    busy ? "One moment" :
    status === "denied" ? "Microphone blocked. Allow it in Settings, or type the words." :
    tooShort ? "That was a tap. Keep holding while it listens." :
    screenReader ? "Tap to listen" : "Hold to listen";
  const action = screenReader ? (recording ? "Stop listening" : "Start listening") : recording ? "Listening" : "Hold to listen";

  return (
    <View style={{ alignItems: "center", gap: 20 }}>
      <View style={{ width: 232, height: 232, alignItems: "center", justifyContent: "center" }}>
        <Animated.View style={[{ position: "absolute", width: 232, height: 232, borderRadius: 116, borderWidth: 6, borderColor: colors.gold, borderStyle: "dashed", opacity: recording ? 1 : 0.45 }, ringStyle]} />
        <Animated.View style={discStyle}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={action}
            accessibilityHint={screenReader ? undefined : "Hold the button while the music plays, then let go."}
            onPressIn={press}
            onPressOut={release}
            // Keep the hold alive when the finger wanders off the disc a little.
            pressRetentionOffset={{ top: 60, bottom: 60, left: 60, right: 60 }}
            disabled={busy}
            style={({ pressed }) => ({ width: 168, height: 168, borderRadius: 84, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.85 : busy ? 0.6 : 1 })}
          >
            {busy ? <ActivityIndicator size="large" color={colors.background} /> : recording ? <Square size={44} color={colors.background} fill={colors.background} /> : <Mic size={56} color={colors.background} strokeWidth={1.75} />}
          </Pressable>
        </Animated.View>
      </View>
      <Text variant="muted" style={{ textAlign: "center", color: recording ? colors.gold : colors.muted, maxWidth: 260 }}>{label}</Text>
    </View>
  );
}

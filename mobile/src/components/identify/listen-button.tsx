import * as Haptics from "expo-haptics";
import { Mic, Square } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, View } from "react-native";
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
export function ListenButton({ status, heardMs, onStart, onStop, onCancel, onHoldChange }: { status: RecorderStatus; /** How much audio the recorder has captured so far. */ heardMs: () => number; onStart: () => void; onStop: () => void; onCancel: () => void; /** True while a finger is on the disc, so the page can hold still under it. */ onHoldChange?: (holding: boolean) => void }) {
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

  // True while a finger is on the disc. A ref for the decisions, since a release
  // can land in the same frame as the press; mirrored into state for the label.
  const hold = useRef(false);
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

  const release = useCallback(() => {
    if (!hold.current) return;
    hold.current = false;
    setHolding(false);
    if (status === "recording") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Measured on the recorder, not from the press: asking for permission and
      // preparing takes a moment, and it is the length of the recording that
      // decides whether there is anything worth sending.
      if (heardMs() < MIN_HOLD_MS) { setTooShort(true); onCancel(); } else onStop();
      return;
    }
    // Let go before the microphone was ready: nothing was heard, and the
    // recorder drops the clip it is still starting.
    if (status === "requesting") { setTooShort(true); onCancel(); return; }
    // Anything else (the fifteen-second cap, a refused microphone) the recorder
    // has already settled on its own; this release has nothing left to do.
  }, [heardMs, onCancel, onStop, status, setHolding]);

  const press = () => {
    // A second finger, or a press while the last clip is still being identified.
    if (hold.current || status === "processing") return;
    if (screenReader) {
      if (recording) onStop(); else onStart();
      return;
    }
    if (recording) {
      // Listening with no finger on it (the widget, a shortcut, or listening on
      // opening): this tap ends that one.
      onStop();
      return;
    }
    setTooShort(false);
    hold.current = true;
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
          <View
            accessible
            accessibilityRole="button"
            accessibilityLabel={action}
            accessibilityHint={screenReader ? undefined : "Hold the button while the music plays, then let go."}
            onAccessibilityTap={() => { if (recording) onStop(); else if (status !== "processing") onStart(); }}
            // The responder system, not Pressable: only this way can the disc
            // refuse to hand the touch to the page under it. A Pressable loses a
            // held finger to the ScrollView at the first pixel of drag, which
            // scrolls the page and cuts the clip before it has heard anything.
            onStartShouldSetResponder={() => status !== "processing"}
            onMoveShouldSetResponder={() => false}
            onResponderTerminationRequest={() => false}
            onResponderGrant={press}
            onResponderRelease={release}
            onResponderTerminate={release}
            style={{ width: 168, height: 168, borderRadius: 84, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center", opacity: holding ? 0.85 : busy ? 0.6 : 1 }}
          >
            {busy ? <ActivityIndicator size="large" color={colors.background} /> : recording ? <Square size={44} color={colors.background} fill={colors.background} /> : <Mic size={56} color={colors.background} strokeWidth={1.75} />}
          </View>
        </Animated.View>
      </View>
      <Text variant="muted" style={{ textAlign: "center", color: recording ? colors.gold : colors.muted, maxWidth: 260 }}>{label}</Text>
    </View>
  );
}

import { Mic, Square } from "lucide-react-native";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { Text } from "@/components/ui";
import { useColors } from "@/theme";
import type { RecorderStatus } from "@/lib/recorder/use-recorder";

/** The listening disc: an ink circle in a gold ring that turns while listening. */
export function ListenButton({ status, onStart, onStop }: { status: RecorderStatus; onStart: () => void; onStop: () => void }) {
  const colors = useColors();
  const recording = status === "recording";
  const busy = status === "requesting" || status === "processing";
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);

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
  const label = recording ? "Listening… tap to stop" : busy ? "One moment" : status === "denied" ? "Microphone blocked. Allow it in Settings, or type the words." : "Tap to listen";

  return (
    <View style={{ alignItems: "center", gap: 20 }}>
      <View style={{ width: 232, height: 232, alignItems: "center", justifyContent: "center" }}>
        <Animated.View style={[{ position: "absolute", width: 232, height: 232, borderRadius: 116, borderWidth: 6, borderColor: colors.gold, borderStyle: "dashed", opacity: recording ? 1 : 0.45 }, ringStyle]} />
        <Animated.View style={discStyle}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={recording ? "Stop listening" : "Start listening"}
            onPress={recording ? onStop : onStart}
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

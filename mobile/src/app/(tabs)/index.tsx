import { useMutation } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Keyboard, Pressable, TextInput, View } from "react-native";
import { verseForDate, type RecognitionResultDto } from "@scriptune/contracts";
import { CandidateCard, ListenButton } from "@/components/identify";
import { Button, Notice, Screen, Text } from "@/components/ui";
import { ApiError, library, recognition, verseKey } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { useGuestHistory } from "@/lib/history";
import { recognizeLocal, useCorpora, useIsOnline, useOfflineModel } from "@/lib/offline";
import { Link, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSettings } from "@/lib/settings";
import { useRecorder } from "@/lib/recorder/use-recorder";
import { useLocalRecorder } from "@/lib/recorder/use-local-recorder";
import type { LocalTranscript } from "@/lib/recorder/local-transcriber";
import { fonts, radius, spacing, useColors } from "@/theme";

/** The home tab is the tool: listen, or type the words. */
export default function IdentifyScreen() {
  const colors = useColors();
  const [result, setResult] = useState<RecognitionResultDto | null>(null);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isMember = useAuthStore((state) => state.status === "member");
  const addGuestHistory = useGuestHistory((state) => state.add);
  const finish = (next: RecognitionResultDto) => {
    setResult(next);
    setError(null);
    const best = next.best;
    const target = best === null ? {} : best.type === "hymn" ? { type: "hymn" as const, key: best.slug } : { type: "verse" as const, key: verseKey(best.translation, best.book, best.chapter, best.verse) };
    const entry = { kind: "identify" as const, mode: next.mode.toLowerCase(), query: next.transcript, attemptId: next.attemptId, ...target };
    if (isMember) void library.addHistory(entry).catch(() => undefined);
    else addGuestHistory({ ...entry, label: best === null ? `No match for “${next.transcript}”` : best.type === "hymn" ? best.title : best.reference });
    void Haptics.notificationAsync(next.best ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
  };
  const fail = (cause: unknown) => setError(cause instanceof ApiError ? cause.message : "Could not reach Scriptune. Check your connection and try again.");

  const fromAudio = useMutation({ mutationFn: (file: { uri: string; name: string; type: string }) => recognition.audio(file), onSuccess: finish, onError: fail });
  const online = useIsOnline();
  const { hasAny } = useCorpora();
  const fromText = useMutation({ mutationFn: (text: string) => (hasAny ? recognizeLocal(text) : recognition.text(text)), onSuccess: finish, onError: fail });
  const onClip = useCallback(async (file: { uri: string; name: string; type: string }) => { await fromAudio.mutateAsync(file).catch(() => undefined); }, [fromAudio]);
  const recorder = useRecorder(onClip);
  // With no connection, a downloaded Whisper model hears the clip on this device
  // and the words go through the same on-device search as typed text.
  const { hasModel } = useOfflineModel();
  const fromLocalAudio = useMutation({ mutationFn: (text: string) => recognizeLocal(text), onSuccess: finish, onError: fail });
  const onLocalTranscript = useCallback(async ({ text }: LocalTranscript) => {
    if (text.length < 2) { setError("No words were heard. Try again closer to the singing."); return; }
    await fromLocalAudio.mutateAsync(text).catch(() => undefined);
  }, [fromLocalAudio]);
  const localRecorder = useLocalRecorder(onLocalTranscript, setError);
  // Which microphone path is in use. Chosen when listening starts and held until
  // that recorder is idle again, so a connection change mid-clip cannot swap the
  // button out from under a running recording or start a second capture.
  const [active, setActive] = useState<"server" | "device" | null>(null);
  const path = active ?? (online ? "server" : hasModel ? "device" : null);
  useEffect(() => {
    if (active === "server" && recorder.status === "idle") setActive(null);
    if (active === "device" && localRecorder.status === "idle") setActive(null);
  }, [active, recorder.status, localRecorder.status]);
  const startListening = () => {
    if (path === "server") { setActive("server"); void recorder.start(); }
    else if (path === "device") { setActive("device"); void localRecorder.start(); }
  };

  // Start listening on demand: from the widget or shortcut (scriptune://listen), or on
  // every launch and return to the foreground when the person turned that on.
  const { listen } = useLocalSearchParams<{ listen?: string }>();
  const autoListen = useSettings((state) => state.autoListen);
  const focused = useRef(false);
  // Armed once per arrival on this tab. Reset on blur and on going to the
  // background, so listening starts exactly once per visit, not on every
  // render (the recorder's 10 Hz state updates would otherwise loop it).
  const armed = useRef(false);
  const startRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    startRef.current = () => {
      if (active === null && recorder.status === "idle" && localRecorder.status === "idle") startListening();
    };
  });
  useFocusEffect(useCallback(() => {
    focused.current = true;
    const fromWidget = listen === "1";
    if (fromWidget) router.setParams({ listen: undefined });
    if (!armed.current && (fromWidget || autoListen)) {
      armed.current = true;
      startRef.current();
    }
    return () => {
      focused.current = false;
      armed.current = false;
    };
  }, [listen, autoListen]));
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next !== "active") {
        armed.current = false;
      } else if (autoListen && focused.current && !armed.current) {
        armed.current = true;
        startRef.current();
      }
    });
    return () => subscription.remove();
  }, [autoListen]);

  return (
    <Screen>
      <View style={{ alignItems: "center", gap: spacing.sm, marginTop: spacing.lg }}>
        <Text variant="eyebrow">Scriptune</Text>
        <Text variant="display" style={{ textAlign: "center" }}>What are you looking for?</Text>
        <Text variant="muted" style={{ textAlign: "center", maxWidth: 300 }}>A hymn the choir just started. A verse the preacher quoted. Let it listen and find out.</Text>
      </View>
      <View style={{ marginVertical: spacing.lg }}>
        {path === "server" ? (
          <ListenButton status={recorder.status} onStart={startListening} onStop={() => void recorder.stop()} />
        ) : path === "device" ? (
          <View style={{ gap: spacing.sm }}>
            <ListenButton status={localRecorder.status} onStart={startListening} onStop={() => void localRecorder.stop()} />
            <Text variant="muted" style={{ textAlign: "center", fontSize: 13 }}>Offline: listening on this device{hasAny ? "" : ". Download the words too, so there is something to match."}</Text>
          </View>
        ) : (
          <View style={{ alignItems: "center", gap: spacing.sm, paddingVertical: spacing.lg }}>
            <Text variant="title" style={{ textAlign: "center" }}>Listening needs a connection</Text>
            <Text variant="muted" style={{ textAlign: "center", maxWidth: 300 }}>{hasAny ? "Type the words below instead, or turn on offline listening so the phone can hear them itself." : "Type the words below, or download the words and offline listening for next time."}</Text>
            <Link href="/offline" asChild><Button label="Offline copies" variant="outline" /></Link>
          </View>
        )}
      </View>
      <View style={{ gap: spacing.sm }}>
        <TextInput
          value={typed}
          onChangeText={setTyped}
          placeholder="Or type the words you remember"
          placeholderTextColor={colors.muted}
          multiline
          returnKeyType="done"
          submitBehavior="blurAndSubmit"
          onSubmitEditing={() => { if (typed.trim().length >= 3 && !fromText.isPending) fromText.mutate(typed.trim()); }}
          style={{ minHeight: 72, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, fontSize: 16 }}
        />
        <Button label={fromText.isPending ? "Identifying…" : "Identify the words"} disabled={typed.trim().length < 3 || fromText.isPending} onPress={() => { Keyboard.dismiss(); fromText.mutate(typed.trim()); }} />
      </View>
      {result === null && <VerseOfDay />}
      {error && <Notice message={error} action={{ label: "Dismiss", onPress: () => setError(null) }} />}
      {result && (
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <Text variant="eyebrow">{result.candidates.length === 0 ? "No match" : result.attemptId.startsWith("local-") ? "Best matches, from this device" : "Best matches"}</Text>
          {result.transcript !== "" && <Text variant="muted">Heard: “{result.transcript}”</Text>}
          {result.candidates.length === 0 && <Text variant="muted">Nothing close enough. Try a longer clip, or type a few exact words.</Text>}
          {result.candidates.map((candidate, index) => <CandidateCard key={`${candidate.type}-${index}`} candidate={candidate} rank={index} />)}
        </View>
      )}
    </Screen>
  );
}

/** Today's verse, a quiet card under the tool. Tapping opens the passage. */
function VerseOfDay() {
  const colors = useColors();
  const verse = verseForDate();
  return (
    <Link href={{ pathname: "/bible/[translation]/[book]/[chapter]/[verse]", params: { translation: verse.translation.toLowerCase(), book: verse.book, chapter: String(verse.chapter), verse: String(verse.verse) } }} asChild>
      <Pressable accessibilityRole="link" accessibilityLabel={`Verse of the day, ${verse.reference}`} style={{ marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: spacing.xs }}>
        <Text variant="eyebrow">Verse of the day</Text>
        <Text style={{ fontFamily: fonts.serif, fontSize: 18, lineHeight: 26 }}>{verse.text}</Text>
        <Text variant="muted" style={{ fontSize: 13 }}>{verse.reference} · {verse.translation}</Text>
      </Pressable>
    </Link>
  );
}

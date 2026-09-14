import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, Mic, RefreshCw, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Platform, View } from "react-native";
import { Button, Notice, Screen, Text } from "@/components/ui";
import { bible, hymns } from "@/lib/api";
import { OFFLINE_MODEL, downloadHymnal, downloadOfflineModel, downloadTranslation, removeCorpus, removeOfflineModel, useCorpora, useInvalidateCorpora, useInvalidateOfflineModel, useIsOnline, useOfflineModel, type DownloadProgress, type ModelProgress } from "@/lib/offline";
import { releaseLocalTranscriber } from "@/lib/recorder/local-transcriber";
import { toast } from "@/lib/toast";
import { radius, spacing, useColors } from "@/theme";

function progressLabel(progress: DownloadProgress | null): string | null {
  if (progress === null) return null;
  if (progress.phase === "fetching") return "Downloading…";
  if (progress.phase === "storing") return `Storing ${Math.round((progress.done / progress.total) * 100)}%`;
  return "Done";
}

/** A thin gold bar that fills as bytes arrive. */
function ProgressBar({ fraction, label }: { fraction: number; label: string }) {
  const colors = useColors();
  return (
    <View style={{ gap: 6 }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(fraction * 100) }} accessibilityLabel={label}>
      <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: "hidden" }}>
        <View style={{ width: `${Math.max(2, Math.min(100, fraction * 100))}%`, height: "100%", backgroundColor: colors.gold }} />
      </View>
      <Text variant="muted" style={{ fontSize: 13 }}>{label}</Text>
    </View>
  );
}

function CorpusRow({ title, detail, downloaded, busy, progress, onDownload, onRemove, online }: { title: string; detail: string; downloaded: boolean; busy: boolean; progress: string | null; online: boolean; onDownload: () => void; onRemove: () => void }) {
  const colors = useColors();
  return (
    <View style={{ padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: downloaded ? colors.gold : colors.border, backgroundColor: colors.surface, gap: spacing.sm }}>
      <Text variant="title">{title}</Text>
      <Text variant="muted">{progress ?? detail}</Text>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        {downloaded ? <Button label="Remove from device" icon={Trash2} variant="outline" disabled={busy} onPress={onRemove} /> : <Button label={online ? "Download" : "Needs a connection"} icon={Download} disabled={busy || !online} onPress={onDownload} />}
        {downloaded && online && <Button label="Update" icon={RefreshCw} variant="ghost" disabled={busy} onPress={onDownload} />}
      </View>
    </View>
  );
}

/** The on-device speech-to-text model: download once, listen anywhere. */
function ListeningRow({ online, busy: othersBusy }: { online: boolean; busy: boolean }) {
  const colors = useColors();
  const { hasModel, isLoaded } = useOfflineModel();
  const invalidate = useInvalidateOfflineModel();
  const [progress, setProgress] = useState<ModelProgress | null>(null);
  const download = useMutation({
    mutationFn: () => downloadOfflineModel(setProgress),
    onSuccess: () => toast.success("Offline listening is ready."),
    onError: () => toast.error("The model did not finish downloading. Check your connection and try again."),
    onSettled: () => { setProgress(null); void invalidate(); },
  });
  const remove = useMutation({
    mutationFn: async () => { await releaseLocalTranscriber(); await removeOfflineModel(); },
    onSuccess: () => { toast.success("Offline listening removed."); void invalidate(); },
    onError: () => toast.error("Could not remove the model. Try again."),
  });
  const busy = othersBusy || download.isPending || remove.isPending;
  const megabytes = Math.round(OFFLINE_MODEL.bytes / 1_000_000);
  if (Platform.OS === "web") {
    return <Notice tone="info" message="Offline listening is only available in the Scriptune app for iPhone and Android." />;
  }
  return (
    <View style={{ padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: hasModel ? colors.gold : colors.border, backgroundColor: colors.surface, gap: spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Mic size={18} color={colors.gold} strokeWidth={2} />
        <Text variant="title">Offline listening</Text>
      </View>
      {progress !== null && progress.phase === "downloading" ? (
        <ProgressBar fraction={progress.done / progress.total} label={`Downloading ${Math.round(progress.done / 1_000_000)} of ${Math.round(progress.total / 1_000_000)} MB`} />
      ) : (
        <Text variant="muted">{hasModel ? `The phone hears hymns and verses itself, in any language, with no connection. ${megabytes} MB on this device.` : `Lets the phone hear hymns and verses itself when there is no connection, in any language. A one-time ${megabytes} MB download. Online, the server's larger model is still used.`}</Text>
      )}
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        {hasModel ? (
          <Button label="Remove from device" icon={Trash2} variant="outline" disabled={busy || !isLoaded} onPress={() => remove.mutate()} />
        ) : (
          <Button label={download.isPending ? "Downloading…" : online ? "Turn on" : "Needs a connection"} icon={Download} disabled={busy || !online || !isLoaded} onPress={() => download.mutate()} />
        )}
      </View>
    </View>
  );
}

/** Choose what to keep on the device. Downloaded corpora read, search and identify without a connection. */
export default function OfflineScreen() {
  const colors = useColors();
  const online = useIsOnline();
  const { corpora } = useCorpora();
  const invalidate = useInvalidateCorpora();
  const [progress, setProgress] = useState<Record<string, DownloadProgress | null>>({});
  const translations = useQuery({ queryKey: ["bible", "translations"], queryFn: () => bible.translations(), enabled: online });
  const hymnals = useQuery({ queryKey: ["hymnals"], queryFn: () => hymns.hymnals(), enabled: online });

  const download = useMutation({
    mutationFn: async (target: { kind: "bible" | "hymnal"; id: string }) => {
      const report = (next: DownloadProgress) => setProgress((current) => ({ ...current, [target.id]: next }));
      if (target.kind === "bible") await downloadTranslation(target.id, report);
      else await downloadHymnal(target.id, report);
    },
    onError: () => toast.error("That download did not finish. Check your connection and try again."),
    onSettled: (_data, _error, target) => { setProgress((current) => ({ ...current, [target.id]: null })); void invalidate(); },
  });
  const remove = useMutation({
    mutationFn: (target: { kind: "bible" | "hymnal"; id: string }) => removeCorpus(target.kind, target.id),
    onSuccess: () => void invalidate(),
    onError: () => toast.error("Could not remove that from the device. Try again."),
  });
  const busy = download.isPending || remove.isPending;
  const downloadedIds = new Set(corpora.map((corpus) => `${corpus.kind}:${corpus.id}`));

  const bibleRows = translations.data?.translations.map((translation) => ({ kind: "bible" as const, id: translation.code, title: `${translation.name} (${translation.code})`, detail: "Every verse. About 5 MB." }))
    ?? corpora.filter((corpus) => corpus.kind === "bible").map((corpus) => ({ kind: "bible" as const, id: corpus.id, title: corpus.title, detail: `${corpus.item_count.toLocaleString()} verses on this device.` }));
  const hymnalRows = hymnals.data?.hymnals.map((hymnal) => ({ kind: "hymnal" as const, id: hymnal.slug, title: hymnal.title, detail: `${hymnal.entryCount.toLocaleString()} hymns with their words. About 1.5 MB.` }))
    ?? corpora.filter((corpus) => corpus.kind === "hymnal").map((corpus) => ({ kind: "hymnal" as const, id: corpus.id, title: corpus.title, detail: `${corpus.item_count.toLocaleString()} hymns on this device.` }));

  return (
    <Screen>
      <Text variant="eyebrow">Offline</Text>
      <Text variant="display">Keep the words with you</Text>
      <Text variant="muted">Downloaded translations and hymnals read, search and identify without a connection. Add offline listening and the phone can hear them too.</Text>
      {!online && <Notice tone="offline" message="You are offline. Anything already downloaded keeps working." />}
      <Text variant="eyebrow" style={{ color: colors.muted, marginTop: spacing.sm }}>Listening</Text>
      <ListeningRow online={online} busy={busy} />
      <Text variant="eyebrow" style={{ color: colors.muted, marginTop: spacing.sm }}>Words</Text>
      {[...bibleRows, ...hymnalRows].map((row) => {
        const downloaded = downloadedIds.has(`${row.kind}:${row.id}`);
        const stored = corpora.find((corpus) => corpus.kind === row.kind && corpus.id === row.id);
        return (
          <CorpusRow
            key={`${row.kind}:${row.id}`}
            title={row.title}
            detail={stored ? `${stored.item_count.toLocaleString()} ${row.kind === "bible" ? "verses" : "hymns"} on this device, downloaded ${new Date(stored.downloaded_at).toLocaleDateString()}.` : row.detail}
            downloaded={downloaded}
            busy={busy}
            online={online}
            progress={progressLabel(progress[row.id] ?? null)}
            onDownload={() => download.mutate({ kind: row.kind, id: row.id })}
            onRemove={() => remove.mutate({ kind: row.kind, id: row.id })}
          />
        );
      })}
      {(translations.isError || hymnals.isError) && online && <Notice message="The list of translations and hymnals could not be loaded." action={{ label: "Try again", onPress: () => { void translations.refetch(); void hymnals.refetch(); } }} />}
    </Screen>
  );
}

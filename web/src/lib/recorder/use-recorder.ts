"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderStatus = "idle" | "requesting" | "recording" | "processing" | "denied" | "unsupported";

export interface RecorderOptions {
  /** Stop automatically after this many milliseconds. */
  maxDurationMs?: number;
  onClip: (blob: Blob) => void | Promise<void>;
}

const PREFERRED_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return PREFERRED_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

/**
 * Microphone capture with the browser's MediaRecorder. Exposes a live level
 * for the listening animation and hands the finished clip to `onClip`.
 */
export function useRecorder(options: RecorderOptions) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [level, setLevel] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const frameRef = useRef<number>(0);
  const startedAtRef = useRef<number>(0);
  const onClipRef = useRef(options.onClip);
  useEffect(() => {
    onClipRef.current = options.onClip;
  }, [options.onClip]);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setLevel(0);
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder !== null && recorder.state === "recording") {
      recorder.stop();
    }
  }, []);

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setStatus("unsupported");
      return;
    }
    setStatus("requesting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      setStatus("denied");
      return;
    }
    streamRef.current = stream;
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType === undefined ? undefined : { mimeType });
    recorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      cleanup();
      setStatus("processing");
      try {
        await onClipRef.current(blob);
      } finally {
        setStatus("idle");
      }
    };

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    audioContext.createMediaStreamSource(stream).connect(analyser);
    const samples = new Uint8Array(analyser.frequencyBinCount);
    const maxDuration = options.maxDurationMs ?? 15_000;
    startedAtRef.current = performance.now();
    const tick = () => {
      analyser.getByteTimeDomainData(samples);
      let sum = 0;
      for (const sample of samples) {
        const centered = (sample - 128) / 128;
        sum += centered * centered;
      }
      setLevel(Math.min(1, Math.sqrt(sum / samples.length) * 4));
      const elapsed = performance.now() - startedAtRef.current;
      setElapsedMs(elapsed);
      if (elapsed >= maxDuration) {
        stop();
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    recorder.start(250);
    setStatus("recording");
    setElapsedMs(0);
    frameRef.current = requestAnimationFrame(tick);
    recorder.addEventListener("stop", () => { if (audioContext.state !== "closed") void audioContext.close(); }, { once: true });
  }, [cleanup, options.maxDurationMs, stop]);

  useEffect(() => cleanup, [cleanup]);

  return { status, level, elapsedMs, start, stop, isRecording: status === "recording" };
}

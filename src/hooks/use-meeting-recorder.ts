"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { v4 as uuid } from "uuid";
import type { Segment } from "@/lib/types";

// Minimal TS declarations for Web Speech API (not in default lib.dom.d.ts)
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}
interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
type SpeechRecognitionCtor = new () => ISpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

export interface UseRecorderOptions {
  language?: string;
  onSegment?: (segment: Segment) => void;
}

export function useMeetingRecorder(opts: UseRecorderOptions = {}) {
  const language = opts.language ?? "es-ES";
  const store = useAppStore();
  const {
    isRecording,
    currentSpeaker,
    addLiveSegment,
    updateInterim,
    setLiveDuration,
    stopRecording,
  } = store;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<number[]>(new Array(28).fill(0));
  const [isSupported, setIsSupported] = useState(true);

  // Build Web Speech recognition instance
  const buildRecognition = useCallback((): ISpeechRecognition | null => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return null;
    const rec = new Ctor();
    rec.lang = language;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const alt = res[0];
        if (res.isFinal) {
          const text = alt.transcript.trim();
          if (text.length > 0) {
            const seg: Segment = {
              id: uuid(),
              meetingId: store.currentMeetingId ?? "live",
              speaker: store.currentSpeaker,
              text,
              startTime: (Date.now() - startTimeRef.current) / 1000,
              endTime: (Date.now() - startTimeRef.current) / 1000,
              confidence: alt.confidence ?? 0.9,
            };
            addLiveSegment(seg);
            opts.onSegment?.(seg);
          }
        } else {
          interim += alt.transcript;
        }
      }
      updateInterim(interim);
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      console.warn("Speech recognition error:", e.error);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError(
          "Permiso de micrófono denegado. Habilita el acceso en el navegador."
        );
      } else if (e.error === "no-speech") {
        // benign, will restart onend
      } else if (e.error === "aborted") {
        // user stopped
      } else {
        setError(`Error de transcripción: ${e.error}`);
      }
    };

    rec.onend = () => {
      // Auto-restart if still recording (Chrome stops after ~60s of silence)
      if (mediaRecorderRef.current?.state === "recording") {
        try {
          rec.start();
        } catch {
          /* ignore */
        }
      }
    };

    return rec;
  }, [language, store.currentMeetingId, store.currentSpeaker, addLiveSegment, updateInterim, opts]);

  // Visualize audio levels
  const visualize = useRef(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const buffer = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(buffer);
    const bars = 28;
    const step = Math.floor(buffer.length / bars);
    const newLevels: number[] = [];
    for (let i = 0; i < bars; i++) {
      const v = buffer[i * step] / 255;
      newLevels.push(v);
    }
    setLevels(newLevels);
    animationFrameRef.current = requestAnimationFrame(() => visualize.current());
  });

  const start = useCallback(
    async (title: string) => {
      setError(null);
      setAudioBlob(null);

      // Check support
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setError("Tu navegador no soporta grabación de audio.");
        setIsSupported(false);
        return false;
      }
      const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
      if (!Ctor) {
        setError(
          "Tu navegador no soporta transcripción con IA. Usa Chrome o Edge en Android."
        );
        setIsSupported(false);
        return false;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamRef.current = stream;

        // Audio context for visualization
        const ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
        visualize.current();

        // MediaRecorder for audio backup
        const mr = new MediaRecorder(stream);
        chunksRef.current = [];
        mr.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        mr.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          setAudioBlob(blob);
        };
        mr.start(1000);
        mediaRecorderRef.current = mr;

        // Speech recognition
        const rec = buildRecognition();
        if (rec) {
          rec.start();
          recognitionRef.current = rec;
        }

        startTimeRef.current = Date.now();
        store.startRecording(title);
        timerRef.current = setInterval(() => {
          setLiveDuration((Date.now() - startTimeRef.current) / 1000);
        }, 1000);

        return true;
      } catch (err) {
        console.error(err);
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("Permission") || msg.includes("denied")) {
          setError("Permiso de micrófono denegado. Actívalo en los ajustes del navegador.");
        } else {
          setError(`No se pudo iniciar la grabación: ${msg}`);
        }
        return false;
      }
    },
    [buildRecognition, setLiveDuration, store]
  );

  const stop = useCallback(async (): Promise<{ audioBlob: Blob | null; duration: number }> => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      await new Promise<void>((resolve) => {
        const mr = mediaRecorderRef.current!;
        mr.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          setAudioBlob(blob);
          resolve();
        };
        mr.stop();
      });
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const duration = (Date.now() - startTimeRef.current) / 1000;
    setLevels(new Array(28).fill(0));
    stopRecording();
    return { audioBlob: audioBlob, duration };
  }, [audioBlob, stopRecording]);

  const changeSpeaker = useCallback(
    (speaker: string) => {
      store.setSpeaker(speaker);
    },
    [store]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* ignore */
        }
      }
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return {
    isRecording,
    isSupported,
    error,
    levels,
    interim: store.interimText,
    duration: store.liveDuration,
    segments: store.liveSegments,
    start,
    stop,
    changeSpeaker,
    currentSpeaker,
    audioBlob,
    clearError: () => setError(null),
  };
}

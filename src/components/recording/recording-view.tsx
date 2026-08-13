"use client";

import { useEffect, useState } from "react";
import { useMeetingRecorder } from "@/hooks/use-meeting-recorder";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Mic,
  Square,
  UserPlus,
  Users,
  AlertCircle,
  Check,
} from "lucide-react";
import { formatDuration, speakerColor, speakerInitial } from "@/lib/utils2";
import { toast } from "sonner";

export function RecordingView() {
  const { setView, resetLive, settings } = useAppStore();
  const recorder = useMeetingRecorder({
    language: settings.language,
  });

  const [title, setTitle] = useState("");
  const [phase, setPhase] = useState<"setup" | "recording" | "saving">("setup");
  const [attendees, setAttendees] = useState<{ name: string; email?: string }[]>([]);
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [showAttendees, setShowAttendees] = useState(false);

  // Auto-scroll transcript
  useEffect(() => {
    const el = document.getElementById("live-transcript");
    if (el) el.scrollTop = el.scrollHeight;
  }, [recorder.segments, recorder.interim]);

  async function handleStart() {
    if (!title.trim()) {
      toast.error("Pon un título a la reunión");
      return;
    }
    const ok = await recorder.start(title.trim());
    if (ok) setPhase("recording");
  }

  async function handleStop() {
    setPhase("saving");
    const { audioBlob, duration } = await recorder.stop();

    // Build meeting payload
    const segments = recorder.segments.map((s, i) => ({
      speaker: s.speaker,
      text: s.text,
      startTime: i === 0 ? 0 : recorder.segments[i - 1].endTime,
      endTime: s.endTime,
      confidence: s.confidence,
    }));

    if (segments.length === 0) {
      toast.warning(
        "No se capturó transcripción. Verifica los permisos del micrófono."
      );
    }

    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          duration: Math.floor(duration),
          status: segments.length > 0 ? "transcribed" : "completed",
          language: settings.language,
          attendees,
          segments,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      toast.success("Reunión guardada");
      resetLive();
      setView("dashboard");

      // Auto-summarize
      if (settings.autoSummarize && segments.length > 0 && data.meeting?.id) {
        toast.info("Generando resumen con IA...");
        try {
          const sumRes = await fetch("/api/summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: title.trim(),
              segments,
              language: settings.language,
            }),
          });
          const sumData = await sumRes.json();
          if (sumRes.ok) {
            await fetch(`/api/meetings/${data.meeting.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: "summarized",
                summary: sumData.summary,
                keyPoints: sumData.keyPoints,
                actionItems: sumData.actionItems,
              }),
            });
            toast.success("Resumen generado");
          }
        } catch {
          toast.warning("No se pudo generar el resumen IA");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Error al guardar");
      setPhase("recording");
    }

    void audioBlob;
  }

  function addAttendee() {
    if (!attendeeName.trim()) return;
    setAttendees([
      ...attendees,
      { name: attendeeName.trim(), email: attendeeEmail.trim() || undefined },
    ]);
    setAttendeeName("");
    setAttendeeEmail("");
  }

  function removeAttendee(idx: number) {
    setAttendees(attendees.filter((_, i) => i !== idx));
  }

  // Setup view
  if (phase === "setup") {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2"
          onClick={() => setView("dashboard")}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">
            Nueva reunión
          </h1>
          <p className="text-muted-foreground text-sm">
            Configura el título y los asistentes antes de empezar a grabar.
          </p>
        </div>

        <Card className="p-6 mb-4">
          <label className="text-sm font-medium mb-2 block">
            Título de la reunión
          </label>
          <Input
            autoFocus
            placeholder="Ej. Reunión semanal de equipo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11"
            onKeyDown={(e) => e.key === "Enter" && handleStart()}
          />

          <div className="mt-5">
            <button
              onClick={() => setShowAttendees(!showAttendees)}
              className="text-sm font-medium flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Users className="w-4 h-4" />
              Asistentes ({attendees.length})
              <span className="text-xs">— opcional</span>
            </button>
            {showAttendees && (
              <div className="mt-3 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Nombre"
                    value={attendeeName}
                    onChange={(e) => setAttendeeName(e.target.value)}
                    className="h-10"
                    onKeyDown={(e) => e.key === "Enter" && attendeeEmail && addAttendee()}
                  />
                  <Input
                    type="email"
                    placeholder="email@empresa.com (opcional)"
                    value={attendeeEmail}
                    onChange={(e) => setAttendeeEmail(e.target.value)}
                    className="h-10 sm:flex-1"
                    onKeyDown={(e) => e.key === "Enter" && addAttendee()}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={addAttendee}
                    className="h-10"
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Añadir
                  </Button>
                </div>
                {attendees.length > 0 && (
                  <div className="space-y-1.5">
                    {attendees.map((a, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${speakerColor(a.name)}`}>
                            {a.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{a.name}</p>
                            {a.email && (
                              <p className="text-xs text-muted-foreground">{a.email}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttendee(i)}
                          className="h-7 text-xs text-muted-foreground hover:text-destructive"
                        >
                          Quitar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {recorder.error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{recorder.error}</span>
          </div>
        )}

        <Button
          onClick={handleStart}
          disabled={!title.trim()}
          size="lg"
          className="w-full h-14 text-base bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-lg shadow-indigo-500/30"
        >
          <Mic className="w-5 h-5 mr-2" />
          Empezar a grabar
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-3">
          Necesitarás conceder permiso de micrófono. Funciona mejor en Chrome o Edge.
        </p>
      </div>
    );
  }

  // Saving view
  if (phase === "saving") {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-4 animate-pulse">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-semibold mb-1">Guardando reunión…</h2>
        <p className="text-sm text-muted-foreground">
          Procesando {recorder.segments.length} segmentos de transcripción
          {settings.autoSummarize && " y generando resumen IA"}.
        </p>
      </div>
    );
  }

  // Recording view
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 recording-pulse" />
            Grabando
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{title}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono font-bold tabular-nums">
            {formatDuration(recorder.duration)}
          </div>
          <p className="text-xs text-muted-foreground">
            {recorder.segments.length} segmentos
          </p>
        </div>
      </div>

      {/* Waveform */}
      <Card className="p-6 mb-4 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 dark:from-indigo-950/20 dark:to-violet-950/20">
        <div className="flex items-end justify-center gap-1 h-24">
          {recorder.levels.map((lvl, i) => (
            <div
              key={i}
              className="w-1.5 sm:w-2 rounded-full bg-gradient-to-t from-indigo-500 to-violet-400 transition-all duration-75"
              style={{
                height: `${Math.max(8, lvl * 100)}%`,
                opacity: recorder.isRecording ? 1 : 0.3,
              }}
            />
          ))}
        </div>
      </Card>

      {/* Speaker selector */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto custom-scroll pb-1">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Habla ahora:
        </span>
        {["Hablante 1", "Hablante 2", "Hablante 3", "Hablante 4"].map((sp) => {
          const matched = attendees.find((a, i) => `Hablante ${i + 1}` === sp);
          const label = matched ? matched.name : sp;
          return (
            <button
              key={sp}
              onClick={() => recorder.changeSpeaker(sp)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                recorder.currentSpeaker === sp
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Live transcript */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Transcripción en tiempo real
          </span>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            En vivo
          </Badge>
        </div>
        <div
          id="live-transcript"
          className="max-h-[40vh] min-h-[200px] overflow-y-auto custom-scroll p-4 space-y-3"
        >
          {recorder.segments.length === 0 && !recorder.interim && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Esperando que alguien hable…
            </div>
          )}
          {recorder.segments.map((s, i) => (
            <div key={s.id ?? i} className="flex gap-2.5 animate-in fade-in">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${speakerColor(s.speaker)}`}
              >
                {speakerInitial(s.speaker)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium">
                    {attendees.find((_, idx) => `Hablante ${idx + 1}` === s.speaker)?.name ?? s.speaker}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDuration(s.startTime)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{s.text}</p>
              </div>
            </div>
          ))}
          {recorder.interim && (
            <div className="flex gap-2.5 opacity-60">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${speakerColor(recorder.currentSpeaker)}`}
              >
                {speakerInitial(recorder.currentSpeaker)}
              </div>
              <div className="flex-1">
                <span className="text-xs font-medium">
                  {attendees.find((_, idx) => `Hablante ${idx + 1}` === recorder.currentSpeaker)?.name ?? recorder.currentSpeaker}
                </span>
                <p className="text-sm italic">{recorder.interim}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Stop button */}
      <Button
        onClick={handleStop}
        size="lg"
        className="w-full mt-4 h-14 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
      >
        <Square className="w-5 h-5 mr-2 fill-current" />
        Detener y guardar
      </Button>
    </div>
  );
}

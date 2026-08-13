"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Mail, X, Send, AlertCircle, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import type { Meeting, Segment, Attendee } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  meeting: Meeting | null;
  segments: Segment[];
  attendees: Attendee[];
}

export function EmailDialog({ open, onClose, meeting, segments, attendees }: Props) {
  const { settings, setView } = useAppStore();
  const [to, setTo] = useState<string[]>([]);
  const [toInput, setToInput] = useState("");
  const [cc, setCc] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open && meeting) {
      setSubject(`Transcripción: ${meeting.title}`);
      // Pre-fill recipients from attendees with email
      const emails = attendees
        .map((a) => a.email)
        .filter((e): e is string => !!e && e.includes("@"));
      setTo(emails);
      setMessage(
        `Hola,\n\nAdjunto la transcripción de la reunión "${meeting.title}" celebrada el ${new Date(meeting.date).toLocaleDateString("es-ES")}.\n\nSaludos.`
      );
    }
  }, [open, meeting, attendees]);

  function addTo(field: "to" | "cc") {
    const email = (field === "to" ? toInput : ccInput).trim();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Email no válido");
      return;
    }
    if (field === "to") {
      if (!to.includes(email)) setTo([...to, email]);
      setToInput("");
    } else {
      if (!cc.includes(email)) setCc([...cc, email]);
      setCcInput("");
    }
  }

  function removeTo(email: string) {
    setTo(to.filter((e) => e !== email));
  }
  function removeCc(email: string) {
    setCc(cc.filter((e) => e !== email));
  }

  async function handleSend() {
    if (!meeting) return;
    if (to.length === 0) {
      toast.error("Añade al menos un destinatario");
      return;
    }
    if (!settings.smtp) {
      toast.error("Configura SMTP en Ajustes antes de enviar emails");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId: meeting.id,
          to,
          cc,
          subject,
          customMessage: message,
          smtp: settings.smtp,
          meeting: {
            title: meeting.title,
            date: meeting.date,
            duration: meeting.duration,
            summary: meeting.summary,
            keyPoints: meeting.keyPoints,
            actionItems: meeting.actionItems,
            segments: segments.map((s) => ({
              speaker: s.speaker,
              text: s.text,
              startTime: s.startTime,
            })),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar");
      toast.success(`Email enviado a ${to.length} destinatario(s)`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Error al enviar email");
    } finally {
      setSending(false);
    }
  }

  function goToSettings() {
    onClose();
    setView("settings");
  }

  const hasSmtp = !!settings.smtp;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto custom-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-500" />
            Enviar transcripción por email
          </DialogTitle>
          <DialogDescription>
            Comparte la transcripción, resumen y acciones de la reunión.
          </DialogDescription>
        </DialogHeader>

        {!hasSmtp && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                Configura tu cuenta de email SMTP para poder enviar.
              </p>
              <Button size="sm" variant="outline" onClick={goToSettings}>
                <SettingsIcon className="w-3.5 h-3.5 mr-1" />
                Ir a Ajustes
              </Button>
            </div>
          </div>
        )}

        {/* To */}
        <div className="space-y-2">
          <Label>Para</Label>
          {to.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-muted/50">
              {to.map((email) => (
                <Badge
                  key={email}
                  variant="secondary"
                  className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                >
                  {email}
                  <button
                    onClick={() => removeTo(email)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="destinatario@email.com"
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTo("to"))}
              className="h-9"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => addTo("to")}
              className="h-9"
            >
              Añadir
            </Button>
          </div>
        </div>

        {/* CC */}
        <div className="space-y-2">
          <Label className="text-xs">CC (opcional)</Label>
          {cc.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-muted/50">
              {cc.map((email) => (
                <Badge key={email} variant="secondary">
                  {email}
                  <button onClick={() => removeCc(email)} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="copia@email.com"
              value={ccInput}
              onChange={(e) => setCcInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTo("cc"))}
              className="h-9"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => addTo("cc")}
              className="h-9"
            >
              Añadir
            </Button>
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <Label htmlFor="subject">Asunto</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="message">Mensaje personalizado</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={sending}>
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || to.length === 0 || !hasSmtp}
            className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando…
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar a {to.length} {to.length === 1 ? "persona" : "personas"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

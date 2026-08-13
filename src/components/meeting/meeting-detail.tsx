"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Mail,
  Download,
  FileText,
  ListChecks,
  CheckSquare,
  Tag,
  Plus,
  Sparkles,
  Users,
  Clock,
  Calendar,
  Edit3,
  Check,
  X,
} from "lucide-react";
import {
  formatDuration,
  formatTimestamp,
  formatDate,
  speakerColor,
  speakerInitial,
} from "@/lib/utils2";
import { toast } from "sonner";
import { EmailDialog } from "@/components/meeting/email-dialog";
import type { Meeting, Segment, Attendee, ActionItem } from "@/lib/types";

export function MeetingDetail() {
  const {
    selectedMeeting: meeting,
    selectedSegments: segments,
    selectedAttendees: attendees,
    setView,
  } = useAppStore();

  const [showEmail, setShowEmail] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [newAction, setNewAction] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [localMeeting, setLocalMeeting] = useState<Meeting | null>(null);
  const [searchInTranscript, setSearchInTranscript] = useState("");

  useEffect(() => {
    if (meeting) {
      setLocalMeeting(meeting);
      setTags(meeting.tags || []);
      setActionItems(meeting.actionItems || []);
      setTitleDraft(meeting.title);
    }
  }, [meeting]);

  if (!localMeeting) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center text-muted-foreground">
        Cargando reunión…
      </div>
    );
  }

  async function saveTitle() {
    if (!localMeeting) return;
    const newTitle = titleDraft.trim();
    if (!newTitle) return;
    await fetch(`/api/meetings/${localMeeting.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    setLocalMeeting({ ...localMeeting, title: newTitle });
    setEditingTitle(false);
    toast.success("Título actualizado");
  }

  async function addTag() {
    if (!localMeeting) return;
    const t = tagInput.trim();
    if (!t || tags.includes(t)) return;
    const newTags = [...tags, t];
    setTags(newTags);
    setTagInput("");
    await fetch(`/api/meetings/${localMeeting.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: newTags }),
    });
  }

  async function removeTag(t: string) {
    if (!localMeeting) return;
    const newTags = tags.filter((x) => x !== t);
    setTags(newTags);
    await fetch(`/api/meetings/${localMeeting.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: newTags }),
    });
  }

  async function addAction() {
    if (!localMeeting) return;
    const text = newAction.trim();
    if (!text) return;
    const newItems = [...actionItems, { text, done: false }];
    setActionItems(newItems);
    setNewAction("");
    await fetch(`/api/meetings/${localMeeting.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionItems: newItems }),
    });
  }

  async function toggleAction(idx: number) {
    if (!localMeeting) return;
    const newItems = actionItems.map((a, i) =>
      i === idx ? { ...a, done: !a.done } : a
    );
    setActionItems(newItems);
    await fetch(`/api/meetings/${localMeeting.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionItems: newItems }),
    });
  }

  async function deleteAction(idx: number) {
    if (!localMeeting) return;
    const newItems = actionItems.filter((_, i) => i !== idx);
    setActionItems(newItems);
    await fetch(`/api/meetings/${localMeeting.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionItems: newItems }),
    });
  }

  async function regenerateSummary() {
    if (!localMeeting) return;
    setSummarizing(true);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: localMeeting.title,
          segments: segments.map((s) => ({
            speaker: s.speaker,
            text: s.text,
            startTime: s.startTime,
          })),
          language: localMeeting.language,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetch(`/api/meetings/${localMeeting.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "summarized",
          summary: data.summary,
          keyPoints: data.keyPoints,
          actionItems: data.actionItems,
        }),
      });
      setLocalMeeting({
        ...localMeeting,
        summary: data.summary,
        keyPoints: data.keyPoints,
        status: "summarized",
      });
      setActionItems(data.actionItems);
      toast.success("Resumen regenerado");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Error al regenerar");
    } finally {
      setSummarizing(false);
    }
  }

  async function exportFormat(format: "txt" | "markdown" | "html") {
    if (!localMeeting) return;
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: localMeeting.id, format }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const content = atob(data.content);
      const blob = new Blob([content], { type: data.mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`Exportado como ${format.toUpperCase()}`);
      setShowExport(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al exportar");
    }
  }

  // Highlight matches in transcript search
  const filteredSegments = searchInTranscript.trim()
    ? segments.filter((s) =>
        s.text.toLowerCase().includes(searchInTranscript.toLowerCase())
      )
    : segments;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2"
        onClick={() => setView("dashboard")}
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Volver
      </Button>

      {/* Title */}
      <div className="mb-4">
        {editingTitle ? (
          <div className="flex gap-2 items-center">
            <Input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              className="h-9 text-2xl font-bold"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && saveTitle()}
            />
            <Button size="sm" onClick={saveTitle}>
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditingTitle(false);
                setTitleDraft(localMeeting.title);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {localMeeting.title}
            </h1>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setEditingTitle(true)}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-4">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(localMeeting.date)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {formatDuration(localMeeting.duration)}
        </span>
        {attendees.length > 0 && (
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {attendees.length} asistente{attendees.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 items-center mb-6">
        {tags.map((t) => (
          <Badge
            key={t}
            variant="secondary"
            className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
          >
            <Tag className="w-3 h-3 mr-1" />
            {t}
            <button onClick={() => removeTag(t)} className="ml-1">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <div className="flex items-center gap-1">
          <Input
            placeholder="Añadir etiqueta…"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTag()}
            className="h-7 w-32 text-xs"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          onClick={() => setShowEmail(true)}
          className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white"
        >
          <Mail className="w-4 h-4 mr-2" />
          Enviar por email
        </Button>
        <Button variant="outline" onClick={() => setShowExport(!showExport)}>
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
        <Button
          variant="outline"
          onClick={regenerateSummary}
          disabled={summarizing || segments.length === 0}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {summarizing ? "Generando…" : "Regenerar resumen IA"}
        </Button>
      </div>

      {showExport && (
        <Card className="p-4 mb-6">
          <p className="text-sm font-medium mb-3">Elige formato de exportación:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button variant="secondary" onClick={() => exportFormat("txt")}>
              <FileText className="w-4 h-4 mr-2" />
              TXT
            </Button>
            <Button variant="secondary" onClick={() => exportFormat("markdown")}>
              <FileText className="w-4 h-4 mr-2" />
              Markdown
            </Button>
            <Button variant="secondary" onClick={() => exportFormat("html")}>
              <FileText className="w-4 h-4 mr-2" />
              HTML
            </Button>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="summary">
        <TabsList className="w-full justify-start mb-4 overflow-x-auto custom-scroll">
          <TabsTrigger value="summary" className="flex-shrink-0">
            <Sparkles className="w-4 h-4 mr-1.5" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="transcript" className="flex-shrink-0">
            <FileText className="w-4 h-4 mr-1.5" />
            Transcripción
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex-shrink-0">
            <CheckSquare className="w-4 h-4 mr-1.5" />
            Acciones
          </TabsTrigger>
          <TabsTrigger value="attendees" className="flex-shrink-0">
            <Users className="w-4 h-4 mr-1.5" />
            Asistentes
          </TabsTrigger>
        </TabsList>

        {/* Summary tab */}
        <TabsContent value="summary" className="space-y-4">
          {localMeeting.summary ? (
            <>
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-semibold text-sm">Resumen ejecutivo</h3>
                </div>
                <p className="text-sm leading-relaxed text-foreground">
                  {localMeeting.summary}
                </p>
              </Card>

              {localMeeting.keyPoints && localMeeting.keyPoints.length > 0 && (
                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <ListChecks className="w-4 h-4 text-indigo-500" />
                    <h3 className="font-semibold text-sm">Puntos clave</h3>
                  </div>
                  <ul className="space-y-2">
                    {localMeeting.keyPoints.map((p, i) => (
                      <li key={i} className="flex gap-2.5 text-sm">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{p}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {actionItems.length > 0 && (
                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckSquare className="w-4 h-4 text-indigo-500" />
                    <h3 className="font-semibold text-sm">Acciones pendientes</h3>
                  </div>
                  <ul className="space-y-2">
                    {actionItems.map((a, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <button
                          onClick={() => toggleAction(i)}
                          className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                            a.done
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-muted-foreground/40 hover:border-primary"
                          }`}
                        >
                          {a.done && <Check className="w-3 h-3" />}
                        </button>
                        <span
                          className={`flex-1 leading-relaxed ${
                            a.done ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {a.text}
                          {a.assignee && (
                            <Badge
                              variant="secondary"
                              className="ml-2 text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                            >
                              → {a.assignee}
                            </Badge>
                          )}
                        </span>
                        <button
                          onClick={() => deleteAction(i)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-8 text-center">
              <Sparkles className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-1">Sin resumen todavía</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Genera un resumen automático con IA a partir de la transcripción.
              </p>
              <Button
                onClick={regenerateSummary}
                disabled={summarizing || segments.length === 0}
                className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {summarizing ? "Generando…" : "Generar resumen IA"}
              </Button>
              {segments.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Esta reunión no tiene transcripción.
                </p>
              )}
            </Card>
          )}
        </TabsContent>

        {/* Transcript tab */}
        <TabsContent value="transcript">
          <Card className="overflow-hidden">
            <div className="p-3 border-b bg-muted/30">
              <Input
                placeholder="Buscar en transcripción…"
                value={searchInTranscript}
                onChange={(e) => setSearchInTranscript(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="max-h-[60vh] overflow-y-auto custom-scroll p-4 space-y-3">
              {filteredSegments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {segments.length === 0
                    ? "Sin transcripción disponible."
                    : "Sin resultados para tu búsqueda."}
                </div>
              ) : (
                filteredSegments.map((s, i) => (
                  <div
                    key={s.id ?? i}
                    className={`flex gap-3 ${searchInTranscript ? "rounded-lg p-2 -mx-2 hover:bg-muted/40" : ""}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${speakerColor(s.speaker)}`}
                    >
                      {speakerInitial(s.speaker)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium">
                          {attendees.find((_, idx) => `Hablante ${idx + 1}` === s.speaker)?.name ?? s.speaker}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatTimestamp(s.startTime)}
                        </span>
                        {s.confidence > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            · {Math.round(s.confidence * 100)}%
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed">{s.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Actions tab */}
        <TabsContent value="actions">
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Acciones pendientes</h3>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Nueva acción pendiente…"
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addAction()}
                className="h-9"
              />
              <Button size="sm" onClick={addAction}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {actionItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No hay acciones pendientes.
              </p>
            ) : (
              <ul className="space-y-2">
                {actionItems.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm p-2 rounded-lg hover:bg-muted/40"
                  >
                    <button
                      onClick={() => toggleAction(i)}
                      className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        a.done
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-muted-foreground/40 hover:border-primary"
                      }`}
                    >
                      {a.done && <Check className="w-3 h-3" />}
                    </button>
                    <span
                      className={`flex-1 leading-relaxed ${
                        a.done ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {a.text}
                      {a.assignee && (
                        <Badge
                          variant="secondary"
                          className="ml-2 text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                        >
                          → {a.assignee}
                        </Badge>
                      )}
                    </span>
                    <button
                      onClick={() => deleteAction(i)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        {/* Attendees tab */}
        <TabsContent value="attendees">
          <Card className="p-5">
            <h3 className="font-semibold mb-3">
              Asistentes ({attendees.length})
            </h3>
            {attendees.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No se registraron asistentes.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attendees.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/40"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${speakerColor(a.name)}`}
                    >
                      {a.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{a.name}</p>
                      {a.email && (
                        <p className="text-xs text-muted-foreground truncate">
                          {a.email}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      Hablante {i + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <EmailDialog
        open={showEmail}
        onClose={() => setShowEmail(false)}
        meeting={localMeeting}
        segments={segments}
        attendees={attendees}
      />
    </div>
  );
}

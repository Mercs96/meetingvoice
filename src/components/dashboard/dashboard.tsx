"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  AudioLines,
  Search,
  Plus,
  Clock,
  Users,
  FileText,
  Tag,
  Trash2,
  ChevronRight,
  Calendar,
} from "lucide-react";
import {
  formatDuration,
  formatRelative,
  parseTags,
} from "@/lib/utils2";
import type { Meeting } from "@/lib/types";

export function Dashboard() {
  const {
    meetings,
    setMeetings,
    searchQuery,
    setSearch,
    filterTag,
    setFilterTag,
    selectMeeting,
    setView,
  } = useAppStore();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadMeetings();
  }, []);

  async function loadMeetings() {
    try {
      const res = await fetch("/api/meetings");
      const data = await res.json();
      if (data.meetings) setMeetings(data.meetings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Collect all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    meetings.forEach((m) => m.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [meetings]);

  const filtered = useMemo(() => {
    let list = meetings;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.summary?.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q)
      );
    }
    if (filterTag) {
      list = list.filter((m) => m.tags.includes(filterTag));
    }
    return list;
  }, [meetings, searchQuery, filterTag]);

  async function openMeeting(m: Meeting) {
    try {
      const res = await fetch(`/api/meetings/${m.id}`);
      const data = await res.json();
      if (data.meeting) {
        selectMeeting(data.meeting, data.meeting.segments, data.meeting.attendees);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteMeeting(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("¿Eliminar esta reunión y su transcripción?")) return;
    await fetch(`/api/meetings/${id}`, { method: "DELETE" });
    setMeetings(meetings.filter((m) => m.id !== id));
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">
          Tus reuniones
        </h1>
        <p className="text-muted-foreground text-sm">
          Graba, transcribe y comparte tus reuniones — 100% gratis y open source.
        </p>
      </div>

      {/* Search + New */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar reuniones, contenido o resúmenes..."
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 bg-card"
          />
        </div>
        <Button
          size="lg"
          className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-md shadow-indigo-500/30 h-11"
          onClick={() => setView("recording")}
        >
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Grabar</span>
        </Button>
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="flex gap-2 mb-5 overflow-x-auto custom-scroll pb-1">
          <button
            onClick={() => setFilterTag(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              !filterTag
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            Todas
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                filterTag === tag
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              <Tag className="w-3 h-3" />
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<FileText className="w-4 h-4" />}
          label="Reuniones"
          value={String(meetings.length)}
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Horas grabadas"
          value={(meetings.reduce((a, m) => a + m.duration, 0) / 3600).toFixed(1)}
        />
        <StatCard
          icon={<Users className="w-4 h-4" />}
          label="Transcritas"
          value={String(meetings.filter((m) => m.status === "transcribed" || m.status === "summarized").length)}
        />
        <StatCard
          icon={<Tag className="w-4 h-4" />}
          label="Etiquetas"
          value={String(allTags.length)}
        />
      </div>

      {/* Meetings list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="h-5 bg-muted rounded w-1/3 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2 mb-3" />
              <div className="h-3 bg-muted rounded w-1/4" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onNew={() => setView("recording")} />
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <Card
              key={m.id}
              onClick={() => openMeeting(m)}
              className="p-5 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-base truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {m.title}
                    </h3>
                    <StatusBadge status={m.status} />
                  </div>
                  {m.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                      {m.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatRelative(m.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(m.duration)}
                    </span>
                    {m.attendees?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {m.attendees.length}
                      </span>
                    )}
                  </div>
                  {m.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {m.tags.slice(0, 4).map((t) => (
                        <Badge
                          key={t}
                          variant="secondary"
                          className="text-[10px] py-0 h-5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => deleteMeeting(m.id, e)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-500 transition-colors" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-1 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    recording: { label: "Grabando", cls: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300" },
    completed: { label: "Completada", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
    transcribed: { label: "Transcrita", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
    summarized: { label: "Resumida", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
    failed: { label: "Fallida", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  };
  const s = map[status] ?? map.completed;
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <Card className="p-12 text-center border-dashed">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
        <AudioLines className="w-8 h-8 text-white" />
      </div>
      <h3 className="font-semibold text-lg mb-1">Sin reuniones aún</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
        Graba tu primera reunión, transcríbela automáticamente con IA y compártela
        por correo con quienes quieras.
      </p>
      <Button
        onClick={onNew}
        className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white"
      >
        <AudioLines className="w-4 h-4 mr-2" />
        Grabar primera reunión
      </Button>
    </Card>
  );
}

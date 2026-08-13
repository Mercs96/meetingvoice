"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Mail,
  Globe,
  Mic,
  Sparkles,
  Server,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import type { AppSettings, SmtpSettings } from "@/lib/types";

export function SettingsView() {
  const { setView, settings, setSettings } = useAppStore();
  const [local, setLocal] = useState<AppSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      const s = data.settings || {};
      const smtpStr = s.smtp;
      let smtp: SmtpSettings | null = null;
      if (smtpStr) {
        try {
          smtp = JSON.parse(smtpStr);
        } catch {
          /* ignore */
        }
      }
      const merged: AppSettings = {
        language: (s.language as "es-ES" | "en-US") || "es-ES",
        defaultSpeakerLabel: s.defaultSpeakerLabel || "Hablante 1",
        autoSummarize: s.autoSummarize === undefined ? true : s.autoSummarize === "true",
        smtp,
      };
      setLocal(merged);
      setSettings(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoaded(true);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: local.language,
          defaultSpeakerLabel: local.defaultSpeakerLabel,
          autoSummarize: String(local.autoSummarize),
          smtp: local.smtp ? JSON.stringify(local.smtp) : "",
        }),
      });
      setSettings(local);
      toast.success("Ajustes guardados");
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  function updateSmtp(field: keyof SmtpSettings, value: string | number | boolean) {
    setLocal({
      ...local,
      smtp: { ...(local.smtp ?? emptySmtp), [field]: value } as SmtpSettings,
    });
  }

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
          Ajustes
        </h1>
        <p className="text-muted-foreground text-sm">
          Configura idioma, motor de transcripción y correo SMTP.
        </p>
      </div>

      {!loaded ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-3" />
              <div className="h-9 bg-muted rounded w-full mb-2" />
              <div className="h-9 bg-muted rounded w-full" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Language */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-indigo-500" />
              <h3 className="font-semibold text-sm">Idioma</h3>
            </div>
            <Label className="text-xs mb-1.5 block">Idioma de transcripción</Label>
            <Select
              value={local.language}
              onValueChange={(v) =>
                setLocal({ ...local, language: v as "es-ES" | "en-US" })
              }
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es-ES">Español (España)</SelectItem>
                <SelectItem value="es-AR">Español (Argentina)</SelectItem>
                <SelectItem value="es-MX">Español (México)</SelectItem>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="en-GB">English (UK)</SelectItem>
                <SelectItem value="fr-FR">Français</SelectItem>
                <SelectItem value="de-DE">Deutsch</SelectItem>
                <SelectItem value="it-IT">Italiano</SelectItem>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
              </SelectContent>
            </Select>
          </Card>

          {/* Transcription */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Mic className="w-4 h-4 text-indigo-500" />
              <h3 className="font-semibold text-sm">Transcripción</h3>
            </div>
            <Label className="text-xs mb-1.5 block">Etiqueta de hablante por defecto</Label>
            <Input
              value={local.defaultSpeakerLabel}
              onChange={(e) =>
                setLocal({ ...local, defaultSpeakerLabel: e.target.value })
              }
              className="h-10 mb-4"
            />
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Resumen automático con IA
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Genera resumen y acciones al terminar cada grabación.
                </p>
              </div>
              <Switch
                checked={local.autoSummarize}
                onCheckedChange={(c) => setLocal({ ...local, autoSummarize: c })}
              />
            </div>
          </Card>

          {/* SMTP Email */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-4 h-4 text-indigo-500" />
              <h3 className="font-semibold text-sm">Configuración SMTP</h3>
              {local.smtp && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Configurado
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Usa tu cuenta de Gmail, Outlook u otro proveedor. La contraseña se
              guarda solo en este dispositivo.
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 block">Servidor SMTP</Label>
                  <Input
                    placeholder="smtp.gmail.com"
                    value={local.smtp?.host ?? ""}
                    onChange={(e) => updateSmtp("host", e.target.value)}
                    className="h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Puerto</Label>
                  <Input
                    type="number"
                    placeholder="465"
                    value={local.smtp?.port ?? ""}
                    onChange={(e) => updateSmtp("port", parseInt(e.target.value) || 0)}
                    className="h-10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 block">Usuario</Label>
                  <Input
                    placeholder="tu@email.com"
                    value={local.smtp?.user ?? ""}
                    onChange={(e) => updateSmtp("user", e.target.value)}
                    className="h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">
                    Contraseña / App password
                  </Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={local.smtp?.pass ?? ""}
                    onChange={(e) => updateSmtp("pass", e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 block">Email remitente</Label>
                  <Input
                    placeholder="tu@email.com"
                    value={local.smtp?.from ?? ""}
                    onChange={(e) => updateSmtp("from", e.target.value)}
                    className="h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Nombre remitente</Label>
                  <Input
                    placeholder="Tu Nombre"
                    value={local.smtp?.fromName ?? ""}
                    onChange={(e) => updateSmtp("fromName", e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <div>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5" />
                    Conexión segura (SSL/TLS)
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Actívalo para puertos 465. Desactívalo para 587 (STARTTLS).
                  </p>
                </div>
                <Switch
                  checked={local.smtp?.secure ?? true}
                  onCheckedChange={(c) => updateSmtp("secure", c)}
                />
              </div>
            </div>

            {/* Provider hints */}
            <div className="mt-4 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
              <p className="font-medium mb-1">Configuraciones populares:</p>
              <p>• Gmail: smtp.gmail.com · puerto 465 · SSL ✓ (usa "App Password")</p>
              <p>• Outlook: smtp.office365.com · puerto 587 · SSL ✗</p>
              <p>• Yahoo: smtp.mail.yahoo.com · puerto 465 · SSL ✓</p>
              <a
                href="https://support.google.com/accounts/answer/185833"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1 font-medium hover:underline"
              >
                Cómo crear App Password de Gmail
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </Card>

          <Button
            onClick={save}
            disabled={saving}
            size="lg"
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Guardando…" : "Guardar ajustes"}
          </Button>
        </div>
      )}
    </div>
  );
}

const emptySmtp: SmtpSettings = {
  host: "",
  port: 465,
  user: "",
  pass: "",
  from: "",
  fromName: "",
  secure: true,
};

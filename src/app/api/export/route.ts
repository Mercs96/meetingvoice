import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseTags, formatDuration, formatTimestamp, formatDate } from "@/lib/utils2";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { meetingId, format = "txt" } = body as {
      meetingId: string;
      format?: "txt" | "markdown" | "html";
    };

    const m = await db.meeting.findUnique({
      where: { id: meetingId },
      include: { segments: { orderBy: { startTime: "asc" } }, attendees: true },
    });
    if (!m) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    const tags = parseTags(m.tags);
    const keyPoints = m.keyPoints ? JSON.parse(m.keyPoints) : null;
    const actionItems = m.actionItems ? JSON.parse(m.actionItems) : null;

    let content = "";
    let mime = "text/plain";
    let ext = "txt";

    if (format === "txt") {
      content = toText(m, tags, keyPoints, actionItems);
      mime = "text/plain;charset=utf-8";
      ext = "txt";
    } else if (format === "markdown") {
      content = toMarkdown(m, tags, keyPoints, actionItems);
      mime = "text/markdown;charset=utf-8";
      ext = "md";
    } else if (format === "html") {
      content = toHtml(m, tags, keyPoints, actionItems);
      mime = "text/html;charset=utf-8";
      ext = "html";
    }

    const base64 = Buffer.from(content, "utf-8").toString("base64");
    const filename = `${m.title.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_")}.${ext}`;

    return NextResponse.json({
      content: base64,
      filename,
      mime,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al exportar" }, { status: 500 });
  }
}

function toText(
  m: {
    title: string;
    description: string | null;
    date: Date;
    duration: number;
    language: string;
    summary: string | null;
    segments: { speaker: string; text: string; startTime: number }[];
    attendees: { name: string; email: string | null }[];
  },
  tags: string[],
  keyPoints: string[] | null,
  actionItems: { text: string; assignee?: string; done?: boolean }[] | null
): string {
  const lines: string[] = [];
  lines.push(`TRANSCRIPCIÓN DE REUNIÓN`);
  lines.push(`========================`);
  lines.push(`Título: ${m.title}`);
  if (m.description) lines.push(`Descripción: ${m.description}`);
  lines.push(`Fecha: ${formatDate(m.date.toISOString())}`);
  lines.push(`Duración: ${formatDuration(m.duration)}`);
  lines.push(`Idioma: ${m.language}`);
  if (tags.length) lines.push(`Etiquetas: ${tags.join(", ")}`);
  if (m.attendees.length) {
    lines.push(`Asistentes: ${m.attendees.map((a) => a.name).join(", ")}`);
  }
  lines.push("");
  if (m.summary) {
    lines.push(`RESUMEN`);
    lines.push(`-------`);
    lines.push(m.summary);
    lines.push("");
  }
  if (keyPoints && keyPoints.length) {
    lines.push(`PUNTOS CLAVE`);
    lines.push(`------------`);
    keyPoints.forEach((p, i) => lines.push(`${i + 1}. ${p}`));
    lines.push("");
  }
  if (actionItems && actionItems.length) {
    lines.push(`ACCIONES PENDIENTES`);
    lines.push(`-------------------`);
    actionItems.forEach((a, i) =>
      lines.push(`${i + 1}. ${a.text}${a.assignee ? ` (→ ${a.assignee})` : ""}`)
    );
    lines.push("");
  }
  lines.push(`TRANSCRIPCIÓN COMPLETA`);
  lines.push(`----------------------`);
  m.segments.forEach((s) => {
    lines.push(`[${formatTimestamp(s.startTime)}] ${s.speaker}: ${s.text}`);
  });
  lines.push("");
  lines.push("Generado con MeetingVoice — open source & gratuito");
  return lines.join("\n");
}

function toMarkdown(
  m: {
    title: string;
    description: string | null;
    date: Date;
    duration: number;
    language: string;
    summary: string | null;
    segments: { speaker: string; text: string; startTime: number }[];
    attendees: { name: string; email: string | null }[];
  },
  tags: string[],
  keyPoints: string[] | null,
  actionItems: { text: string; assignee?: string; done?: boolean }[] | null
): string {
  const lines: string[] = [];
  lines.push(`# ${m.title}`);
  lines.push("");
  if (m.description) lines.push(`> ${m.description}`);
  lines.push("");
  lines.push(`- **Fecha:** ${formatDate(m.date.toISOString())}`);
  lines.push(`- **Duración:** ${formatDuration(m.duration)}`);
  lines.push(`- **Idioma:** ${m.language}`);
  if (tags.length) lines.push(`- **Etiquetas:** ${tags.map((t) => `\`${t}\``).join(", ")}`);
  if (m.attendees.length) {
    lines.push(`- **Asistentes:** ${m.attendees.map((a) => a.name).join(", ")}`);
  }
  lines.push("");
  if (m.summary) {
    lines.push(`## Resumen`);
    lines.push("");
    lines.push(m.summary);
    lines.push("");
  }
  if (keyPoints && keyPoints.length) {
    lines.push(`## Puntos clave`);
    lines.push("");
    keyPoints.forEach((p) => lines.push(`- ${p}`));
    lines.push("");
  }
  if (actionItems && actionItems.length) {
    lines.push(`## Acciones pendientes`);
    lines.push("");
    actionItems.forEach((a) => {
      const check = a.done ? "[x]" : "[ ]";
      const assignee = a.assignee ? ` **→ ${a.assignee}**` : "";
      lines.push(`- ${check} ${a.text}${assignee}`);
    });
    lines.push("");
  }
  lines.push(`## Transcripción completa`);
  lines.push("");
  m.segments.forEach((s) => {
    lines.push(`**${s.speaker}** _[${formatTimestamp(s.startTime)}]_`);
    lines.push("");
    lines.push(s.text);
    lines.push("");
  });
  lines.push("---");
  lines.push("_Generado con MeetingVoice — open source & gratuito_");
  return lines.join("\n");
}

function toHtml(
  m: {
    title: string;
    description: string | null;
    date: Date;
    duration: number;
    language: string;
    summary: string | null;
    segments: { speaker: string; text: string; startTime: number }[];
    attendees: { name: string; email: string | null }[];
  },
  tags: string[],
  keyPoints: string[] | null,
  actionItems: { text: string; assignee?: string; done?: boolean }[] | null
): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const speakerColor = (s: string): string => {
    const colors = ["#6366F1", "#0EA5E9", "#10B981", "#F59E0B", "#EC4899"];
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return colors[h % colors.length];
  };

  const summaryH = m.summary
    ? `<h2 style="color:#4F46E5;">📋 Resumen</h2><p style="color:#374151;line-height:1.6;">${esc(m.summary)}</p>`
    : "";
  const kpH =
    keyPoints && keyPoints.length
      ? `<h2 style="color:#4F46E5;">⭐ Puntos clave</h2><ul>${keyPoints
          .map((p) => `<li>${esc(p)}</li>`)
          .join("")}</ul>`
      : "";
  const aiH =
    actionItems && actionItems.length
      ? `<h2 style="color:#4F46E5;">✅ Acciones pendientes</h2><ul>${actionItems
          .map(
            (a) =>
              `<li>${a.done ? "✓" : "☐"} ${esc(a.text)}${
                a.assignee ? ` <strong style="color:#6366F1;">→ ${esc(a.assignee)}</strong>` : ""
              }</li>`
          )
          .join("")}</ul>`
      : "";
  const segH = m.segments.length
    ? `<h2 style="color:#4F46E5;">💬 Transcripción completa</h2><div style="background:#F9FAFB;border-radius:8px;padding:16px;">${m.segments
        .map(
          (s) =>
            `<div style="padding:8px 0;border-bottom:1px solid #f0f0f0;"><div style="margin-bottom:4px;"><span style="background:${speakerColor(s.speaker)};color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;">${esc(s.speaker)}</span> <span style="color:#9CA3AF;font-size:11px;">${formatTimestamp(s.startTime)}</span></div><div style="color:#1F2937;">${esc(s.text)}</div></div>`
        )
        .join("")}</div>`
    : "";

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${esc(m.title)}</title></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:700px;margin:0 auto;padding:24px;color:#1F2937;">
<h1 style="color:#4F46E5;margin-bottom:8px;">${esc(m.title)}</h1>
<p style="color:#6B7280;">📅 ${formatDate(m.date.toISOString())} · ⏱️ ${formatDuration(m.duration)} · 🌐 ${esc(m.language)}</p>
${tags.length ? `<p><strong>Etiquetas:</strong> ${tags.map((t) => `<span style="background:#EEF2FF;color:#4F46E5;padding:2px 8px;border-radius:10px;font-size:12px;margin-right:4px;">${esc(t)}</span>`).join("")}</p>` : ""}
${m.attendees.length ? `<p><strong>Asistentes:</strong> ${m.attendees.map((a) => esc(a.name)).join(", ")}</p>` : ""}
<hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
${summaryH}
${kpH}
${aiH}
${segH}
<p style="margin-top:32px;color:#9CA3AF;font-size:12px;text-align:center;">Generado con MeetingVoice — open source & gratuito</p>
</body></html>`;
}

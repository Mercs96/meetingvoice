import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import { formatDuration, formatTimestamp, formatDate } from "@/lib/utils2";

interface SegmentInput {
  speaker: string;
  text: string;
  startTime: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      meetingId,
      to,
      cc = [],
      subject,
      customMessage = "",
      smtp,
      meeting, // optional full meeting object with segments & summary
    } = body as {
      meetingId: string;
      to: string[];
      cc?: string[];
      subject: string;
      customMessage?: string;
      smtp: { host: string; port: number; user: string; pass: string; from: string; fromName: string; secure: boolean };
      meeting?: {
        title: string;
        date: string;
        duration: number;
        summary?: string | null;
        keyPoints?: string[] | null;
        actionItems?: { text: string; assignee?: string; done?: boolean }[] | null;
        segments?: SegmentInput[];
      };
    };

    if (!Array.isArray(to) || to.length === 0) {
      return NextResponse.json({ error: "Faltan destinatarios" }, { status: 400 });
    }
    if (!smtp?.host || !smtp?.user || !smtp?.pass) {
      return NextResponse.json(
        { error: "Falta configuración SMTP. Ve a Ajustes → Email." },
        { status: 400 }
      );
    }

    // Fetch meeting if not provided
    let m = meeting;
    if (!m && meetingId) {
      const found = await db.meeting.findUnique({
        where: { id: meetingId },
        include: { segments: { orderBy: { startTime: "asc" } } },
      });
      if (found) {
        m = {
          title: found.title,
          date: found.date.toISOString(),
          duration: found.duration,
          summary: found.summary,
          keyPoints: found.keyPoints ? JSON.parse(found.keyPoints) : null,
          actionItems: found.actionItems ? JSON.parse(found.actionItems) : null,
          segments: found.segments.map((s) => ({
            speaker: s.speaker,
            text: s.text,
            startTime: s.startTime,
          })),
        };
      }
    }
    if (!m) {
      return NextResponse.json({ error: "Reunión no encontrada" }, { status: 404 });
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: { user: smtp.user, pass: smtp.pass },
    });

    const html = buildEmailHtml(m, customMessage);
    const text = buildEmailText(m, customMessage);

    const info = await transporter.sendMail({
      from: `"${smtp.fromName}" <${smtp.from}>`,
      to: to.join(", "),
      cc: cc.length ? cc.join(", ") : undefined,
      subject: subject || `Transcripción de reunión: ${m.title}`,
      text,
      html,
    });

    // Log emails
    if (meetingId) {
      const preview = text.substring(0, 200);
      await Promise.all(
        to.map((email) =>
          db.emailLog.create({
            data: {
              meetingId,
              toEmail: email,
              subject: subject || `Transcripción de reunión: ${m!.title}`,
              bodyPreview: preview,
              status: "sent",
            },
          })
        )
      );
    }

    return NextResponse.json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error("Email API error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Error al enviar email: ${msg}` },
      { status: 500 }
    );
  }
}

function buildEmailText(
  m: {
    title: string;
    date: string;
    duration: number;
    summary?: string | null;
    keyPoints?: string[] | null;
    actionItems?: { text: string; assignee?: string; done?: boolean }[] | null;
    segments?: SegmentInput[];
  },
  customMessage: string
): string {
  const lines: string[] = [];
  lines.push(`TRANSCRIPCIÓN DE REUNIÓN`);
  lines.push(`========================`);
  lines.push(`Título: ${m.title}`);
  lines.push(`Fecha: ${formatDate(m.date)}`);
  lines.push(`Duración: ${formatDuration(m.duration)}`);
  lines.push("");
  if (customMessage) {
    lines.push(`Mensaje del organizador:`);
    lines.push(customMessage);
    lines.push("");
  }
  if (m.summary) {
    lines.push(`RESUMEN`);
    lines.push(`-------`);
    lines.push(m.summary);
    lines.push("");
  }
  if (m.keyPoints && m.keyPoints.length) {
    lines.push(`PUNTOS CLAVE`);
    lines.push(`------------`);
    m.keyPoints.forEach((p, i) => lines.push(`${i + 1}. ${p}`));
    lines.push("");
  }
  if (m.actionItems && m.actionItems.length) {
    lines.push(`ACCIONES PENDIENTES`);
    lines.push(`-------------------`);
    m.actionItems.forEach((a, i) =>
      lines.push(`${i + 1}. ${a.text}${a.assignee ? ` (→ ${a.assignee})` : ""}`)
    );
    lines.push("");
  }
  if (m.segments && m.segments.length) {
    lines.push(`TRANSCRIPCIÓN COMPLETA`);
    lines.push(`----------------------`);
    m.segments.forEach((s) => {
      lines.push(`[${formatTimestamp(s.startTime)}] ${s.speaker}: ${s.text}`);
    });
    lines.push("");
  }
  lines.push("");
  lines.push("Enviado con MeetingVoice — open source & gratuito");
  return lines.join("\n");
}

function buildEmailHtml(
  m: {
    title: string;
    date: string;
    duration: number;
    summary?: string | null;
    keyPoints?: string[] | null;
    actionItems?: { text: string; assignee?: string; done?: boolean }[] | null;
    segments?: SegmentInput[];
  },
  customMessage: string
): string {
  const speakerColor = (s: string): string => {
    const colors = ["#6366F1", "#0EA5E9", "#10B981", "#F59E0B", "#EC4899"];
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return colors[h % colors.length];
  };

  const summaryHtml = m.summary
    ? `<tr><td style="padding:24px 0;border-top:1px solid #eee;">
        <h2 style="margin:0 0 12px;color:#4F46E5;font-size:16px;">📋 Resumen</h2>
        <p style="margin:0;color:#374151;line-height:1.6;">${escapeHtml(m.summary)}</p>
      </td></tr>`
    : "";

  const keyPointsHtml =
    m.keyPoints && m.keyPoints.length
      ? `<tr><td style="padding:24px 0;border-top:1px solid #eee;">
          <h2 style="margin:0 0 12px;color:#4F46E5;font-size:16px;">⭐ Puntos clave</h2>
          <ul style="margin:0;padding-left:20px;color:#374151;line-height:1.7;">
            ${m.keyPoints.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}
          </ul>
        </td></tr>`
      : "";

  const actionItemsHtml =
    m.actionItems && m.actionItems.length
      ? `<tr><td style="padding:24px 0;border-top:1px solid #eee;">
          <h2 style="margin:0 0 12px;color:#4F46E5;font-size:16px;">✅ Acciones pendientes</h2>
          <ul style="margin:0;padding-left:20px;color:#374151;line-height:1.7;">
            ${m.actionItems
              .map(
                (a) =>
                  `<li>${escapeHtml(a.text)}${
                    a.assignee ? ` <strong style="color:#6366F1;">→ ${escapeHtml(a.assignee)}</strong>` : ""
                  }</li>`
              )
              .join("")}
          </ul>
        </td></tr>`
      : "";

  const transcriptHtml =
    m.segments && m.segments.length
      ? `<tr><td style="padding:24px 0;border-top:1px solid #eee;">
          <h2 style="margin:0 0 12px;color:#4F46E5;font-size:16px;">💬 Transcripción completa</h2>
          <div style="background:#F9FAFB;border-radius:8px;padding:16px;">
            ${m.segments
              .map(
                (s) =>
                  `<div style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                      <span style="background:${speakerColor(s.speaker)};color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;">${escapeHtml(s.speaker)}</span>
                      <span style="color:#9CA3AF;font-size:11px;">${formatTimestamp(s.startTime)}</span>
                    </div>
                    <div style="color:#1F2937;font-size:14px;line-height:1.5;">${escapeHtml(s.text)}</div>
                  </div>`
              )
              .join("")}
          </div>
        </td></tr>`
      : "";

  const customHtml = customMessage
    ? `<tr><td style="padding:16px 0 24px;">
        <div style="background:#EEF2FF;border-left:3px solid #6366F1;padding:12px 16px;border-radius:4px;">
          <p style="margin:0;color:#374151;line-height:1.6;">${escapeHtml(customMessage)}</p>
        </div>
      </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;min-width:100%;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;max-width:600px;width:100%;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:32px 32px 0;">
              <div style="background:linear-gradient(135deg,#6366F1 0%,#8B5CF6 100%);border-radius:10px;padding:20px 24px;">
                <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">${escapeHtml(m.title)}</h1>
                <p style="margin:6px 0 0;color:#E0E7FF;font-size:13px;">📅 ${formatDate(m.date)} · ⏱️ ${formatDuration(m.duration)}</p>
              </div>
            </td>
          </tr>
          <tr><td style="padding:0 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${customHtml}
              ${summaryHtml}
              ${keyPointsHtml}
              ${actionItemsHtml}
              ${transcriptHtml}
            </table>
          </td></tr>
          <tr><td style="padding:24px 32px 32px;">
            <p style="margin:0;text-align:center;color:#9CA3AF;font-size:12px;">Enviado con MeetingVoice — open source & gratuito</p>
          </td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

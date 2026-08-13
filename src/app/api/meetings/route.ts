import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseTags } from "@/lib/utils2";

export async function GET() {
  try {
    const meetings = await db.meeting.findMany({
      orderBy: { date: "desc" },
      include: {
        _count: { select: { segments: true, attendees: true } },
      },
    });
    const result = meetings.map((m) => ({
      ...m,
      tags: parseTags(m.tags),
      keyPoints: m.keyPoints ? JSON.parse(m.keyPoints) : null,
      actionItems: m.actionItems ? JSON.parse(m.actionItems) : null,
    }));
    return NextResponse.json({ meetings: result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al listar reuniones" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description = null,
      duration = 0,
      status = "completed",
      language = "es-ES",
      tags = [],
      summary = null,
      keyPoints = null,
      actionItems = null,
      segments = [],
      attendees = [],
    } = body || {};

    if (!title) {
      return NextResponse.json({ error: "Falta el título" }, { status: 400 });
    }

    const meeting = await db.meeting.create({
      data: {
        title,
        description,
        duration,
        status,
        language,
        tags: JSON.stringify(tags),
        summary,
        keyPoints: keyPoints ? JSON.stringify(keyPoints) : null,
        actionItems: actionItems ? JSON.stringify(actionItems) : null,
        segments: {
          create: segments.map(
            (s: { speaker?: string; text: string; startTime?: number; endTime?: number; confidence?: number }) => ({
              speaker: s.speaker ?? "Hablante 1",
              text: s.text,
              startTime: s.startTime ?? 0,
              endTime: s.endTime ?? 0,
              confidence: s.confidence ?? 0.9,
            })
          ),
        },
        attendees: attendees.length
          ? {
              create: attendees.map(
                (a: { name: string; email?: string | null; role?: string | null }) => ({
                  name: a.name,
                  email: a.email ?? null,
                  role: a.role ?? null,
                })
              ),
            }
          : undefined,
      },
      include: { segments: true, attendees: true },
    });

    return NextResponse.json({ meeting });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al crear reunión" }, { status: 500 });
  }
}

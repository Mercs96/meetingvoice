import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseTags } from "@/lib/utils2";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const m = await db.meeting.findUnique({
      where: { id },
      include: {
        segments: { orderBy: { startTime: "asc" } },
        attendees: true,
        emails: { orderBy: { sentAt: "desc" } },
      },
    });
    if (!m) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    return NextResponse.json({
      meeting: {
        ...m,
        tags: parseTags(m.tags),
        keyPoints: m.keyPoints ? JSON.parse(m.keyPoints) : null,
        actionItems: m.actionItems ? JSON.parse(m.actionItems) : null,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al obtener reunión" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (typeof body.title === "string") data.title = body.title;
    if (typeof body.description === "string") data.description = body.description;
    if (typeof body.duration === "number") data.duration = body.duration;
    if (typeof body.status === "string") data.status = body.status;
    if (typeof body.language === "string") data.language = body.language;
    if (Array.isArray(body.tags)) data.tags = JSON.stringify(body.tags);
    if (typeof body.summary === "string") data.summary = body.summary;
    if (Array.isArray(body.keyPoints)) data.keyPoints = JSON.stringify(body.keyPoints);
    if (Array.isArray(body.actionItems)) data.actionItems = JSON.stringify(body.actionItems);

    const updated = await db.meeting.update({
      where: { id },
      data,
    });
    return NextResponse.json({
      meeting: {
        ...updated,
        tags: parseTags(updated.tags),
        keyPoints: updated.keyPoints ? JSON.parse(updated.keyPoints) : null,
        actionItems: updated.actionItems ? JSON.parse(updated.actionItems) : null,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.meeting.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}

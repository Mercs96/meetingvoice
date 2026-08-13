import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const rows = await db.setting.findMany();
    const settings: Record<string, string> = {};
    rows.forEach((r) => (settings[r.key] = r.value));
    return NextResponse.json({ settings });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al obtener ajustes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, string>;
    const keys = Object.keys(body);
    await Promise.all(
      keys.map((k) =>
        db.setting.upsert({
          where: { key: k },
          update: { value: body[k] },
          create: { key: k, value: body[k] },
        })
      )
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al guardar ajustes" }, { status: 500 });
  }
}

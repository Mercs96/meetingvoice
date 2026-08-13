import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

interface SegmentInput {
  speaker: string;
  text: string;
  startTime: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, segments, language = "es-ES" } = body as {
      title: string;
      segments: SegmentInput[];
      language?: string;
    };

    if (!segments || segments.length === 0) {
      return NextResponse.json(
        { error: "Sin segmentos para resumir" },
        { status: 400 }
      );
    }

    // Build transcript text with speaker + timestamp
    const transcript = segments
      .map(
        (s, i) =>
          `[${i + 1}] ${s.speaker} (${Math.floor(s.startTime)}s): ${s.text}`
      )
      .join("\n");

    const langName = language.startsWith("es") ? "español" : "inglés";

    const prompt = `Eres un asistente que analiza reuniones. A partir de la transcripción, genera en ${langName}:
1. Un resumen ejecutivo de 3-5 frases que capture el propósito, los temas tratados y las conclusiones principales.
2. Una lista de 3 a 8 puntos clave (key points) — cada uno en una sola frase.
3. Una lista de acciones pendientes (action items), cada una con el formato: {"text": "...", "assignee": "nombre o vacío", "done": false}. Si no hay acciones claras, devuelve [].

Devuelve EXCLUSIVAMENTE un JSON válido con esta forma:
{"summary": "...", "keyPoints": ["...", "..."], "actionItems": [{"text": "...", "assignee": "...", "done": false}]}

Transcripción de la reunión "${title}":
${transcript}`;

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente profesional de análisis de reuniones. Respondes SOLO con JSON válido, sin markdown, sin explicaciones.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content ?? "";
    let parsed: { summary: string; keyPoints: string[]; actionItems: { text: string; assignee?: string; done?: boolean }[] };

    try {
      // Try to parse directly; if it has markdown fence, strip
      const clean = content
        .replace(/^```(?:json)?/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      parsed = JSON.parse(clean);
    } catch {
      // Try to extract first JSON object
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json(
          { error: "No se pudo parsear el resumen IA", raw: content },
          { status: 500 }
        );
      }
      parsed = JSON.parse(match[0]);
    }

    return NextResponse.json({
      summary: parsed.summary ?? "",
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    });
  } catch (err) {
    console.error("Summary API error:", err);
    return NextResponse.json(
      { error: "Error al generar el resumen" },
      { status: 500 }
    );
  }
}

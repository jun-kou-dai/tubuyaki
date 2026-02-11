import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { transformTubuyaki } from "@/lib/llm-engine";

// POST: 新規つぶやき作成 → LLM変換
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rawText } = body;

    if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
      return NextResponse.json(
        { error: "rawText is required" },
        { status: 400 }
      );
    }

    // 1. まず生テキストでレコード作成（status: processing）
    const record = await prisma.tubuyaki.create({
      data: {
        rawText: rawText.trim(),
        status: "processing",
      },
    });

    // 2. LLM変換（API Keyが設定されている場合のみ）
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const result = await transformTubuyaki(
          rawText.trim(),
          apiKey
        );

        const updated = await prisma.tubuyaki.update({
          where: { id: record.id },
          data: {
            cleanText: result.cleanText,
            intent: JSON.stringify(result.intent),
            entities: JSON.stringify(result.entities),
            summary3lines: result.summary3lines,
            ideas: JSON.stringify(result.ideas),
            nextAction: result.nextAction,
            confidence: result.confidence,
            context: result.context,
            status: "done",
          },
        });

        return NextResponse.json(formatRecord(updated), { status: 201 });
      } catch (llmError) {
        // LLMエラー時もレコードは保存（status: error）
        await prisma.tubuyaki.update({
          where: { id: record.id },
          data: { status: "error" },
        });

        return NextResponse.json(
          {
            ...formatRecord(record),
            warning: "LLM processing failed. Raw text saved.",
          },
          { status: 201 }
        );
      }
    }

    // APIキー未設定の場合はpendingのまま保存
    await prisma.tubuyaki.update({
      where: { id: record.id },
      data: { status: "pending" },
    });

    return NextResponse.json(
      {
        ...formatRecord({ ...record, status: "pending" }),
        warning: "GEMINI_API_KEY not configured. Raw text saved without LLM processing.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/tubuyaki error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: 今日のつぶやき一覧（デフォルト）or 全件
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    const where = all
      ? {}
      : {
          createdAt: {
            gte: startOfDay(new Date()),
          },
        };

    const records = await prisma.tubuyaki.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(records.map(formatRecord));
  } catch (error) {
    console.error("GET /api/tubuyaki error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatRecord(record: any) {
  return {
    id: record.id,
    rawText: record.rawText,
    cleanText: record.cleanText,
    intent: record.intent ? JSON.parse(record.intent) : [],
    entities: record.entities ? JSON.parse(record.entities) : null,
    summary3lines: record.summary3lines,
    ideas: record.ideas ? JSON.parse(record.ideas) : [],
    nextAction: record.nextAction,
    confidence: record.confidence,
    context: record.context,
    feedback: record.feedback,
    feedbackDetail: record.feedbackDetail,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

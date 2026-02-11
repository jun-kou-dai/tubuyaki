import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: 検索（テキスト検索 + 意図タグ + 期間フィルタ）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const intent = searchParams.get("intent");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // テキスト検索（raw_text, clean_text, summary, ideas, next_action）
    if (q) {
      where.OR = [
        { rawText: { contains: q } },
        { cleanText: { contains: q } },
        { summary3lines: { contains: q } },
        { ideas: { contains: q } },
        { nextAction: { contains: q } },
      ];
    }

    // 意図タグフィルタ
    if (intent) {
      where.intent = { contains: intent };
    }

    // 期間フィルタ
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const records = await prisma.tubuyaki.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(
      records.map((record) => ({
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
      }))
    );
  } catch (error) {
    console.error("GET /api/tubuyaki/search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

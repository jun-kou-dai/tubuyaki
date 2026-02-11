import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: 個別取得
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await prisma.tubuyaki.findUnique({ where: { id } });

    if (!record) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(formatRecord(record));
  } catch (error) {
    console.error("GET /api/tubuyaki/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: フィードバック更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { feedback, feedbackDetail } = body;

    if (feedback && !["thumbs_up", "thumbs_down"].includes(feedback)) {
      return NextResponse.json(
        { error: "feedback must be thumbs_up or thumbs_down" },
        { status: 400 }
      );
    }

    if (
      feedbackDetail &&
      !["intent", "summary", "suggestion", "idea"].includes(feedbackDetail)
    ) {
      return NextResponse.json(
        { error: "feedbackDetail must be intent, summary, suggestion, or idea" },
        { status: 400 }
      );
    }

    const record = await prisma.tubuyaki.update({
      where: { id },
      data: {
        ...(feedback !== undefined && { feedback }),
        ...(feedbackDetail !== undefined && { feedbackDetail }),
      },
    });

    return NextResponse.json(formatRecord(record));
  } catch (error) {
    console.error("PATCH /api/tubuyaki/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: 削除
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.tubuyaki.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/tubuyaki/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
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

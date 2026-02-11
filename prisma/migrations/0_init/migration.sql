-- CreateTable
CREATE TABLE "tubuyaki" (
    "id" TEXT NOT NULL,
    "raw_text" TEXT NOT NULL,
    "clean_text" TEXT,
    "intent" TEXT,
    "entities" TEXT,
    "summary_3lines" TEXT,
    "ideas" TEXT,
    "next_action" TEXT,
    "confidence" DOUBLE PRECISION DEFAULT 0,
    "context" TEXT DEFAULT 'unknown',
    "feedback" TEXT,
    "feedback_detail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tubuyaki_pkey" PRIMARY KEY ("id")
);

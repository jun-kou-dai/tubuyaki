-- CreateTable
CREATE TABLE "tubuyaki" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raw_text" TEXT NOT NULL,
    "clean_text" TEXT,
    "intent" TEXT,
    "entities" TEXT,
    "summary_3lines" TEXT,
    "ideas" TEXT,
    "next_action" TEXT,
    "confidence" REAL DEFAULT 0,
    "context" TEXT DEFAULT 'unknown',
    "feedback" TEXT,
    "feedback_detail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

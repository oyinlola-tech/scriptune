
-- CreateEnum
CREATE TYPE "RecognitionMode" AS ENUM ('BIBLE', 'HYMN', 'AUTO');

-- CreateEnum
CREATE TYPE "RecognitionInput" AS ENUM ('AUDIO', 'TEXT');

-- CreateTable
CREATE TABLE "recognition_attempts" (
    "id" UUID NOT NULL,
    "mode" "RecognitionMode" NOT NULL,
    "input_type" "RecognitionInput" NOT NULL,
    "language" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "normalized_text" TEXT NOT NULL,
    "provider" TEXT,
    "provider_confidence" DOUBLE PRECISION,
    "provider_latency_ms" INTEGER,
    "audio_mime_type" TEXT,
    "audio_bytes" INTEGER,
    "candidates" JSONB NOT NULL,
    "top_result_type" TEXT,
    "top_result_key" TEXT,
    "confidence" INTEGER,
    "total_duration_ms" INTEGER NOT NULL,
    "user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recognition_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recognition_attempts_created_at_idx" ON "recognition_attempts"("created_at");


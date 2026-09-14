-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateEnum
CREATE TYPE "Testament" AS ENUM ('OLD', 'NEW');

-- CreateTable
CREATE TABLE "bible_translations" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "description" TEXT,
    "rights_status" TEXT NOT NULL,
    "source_name" TEXT NOT NULL,
    "source_url" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "verse_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bible_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bible_books" (
    "id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "testament" "Testament" NOT NULL,
    "chapter_count" INTEGER NOT NULL,

    CONSTRAINT "bible_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
-- search_vector is generated from the verse text so it can never drift from it.
CREATE TABLE "bible_verses" (
    "id" SERIAL NOT NULL,
    "translation_id" UUID NOT NULL,
    "book_id" INTEGER NOT NULL,
    "chapter" INTEGER NOT NULL,
    "verse" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "normalized_text" TEXT NOT NULL,
    "search_vector" tsvector GENERATED ALWAYS AS (to_tsvector('english', "text")) STORED,

    CONSTRAINT "bible_verses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bible_translations_code_key" ON "bible_translations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "bible_books_slug_key" ON "bible_books"("slug");

-- CreateIndex
CREATE INDEX "bible_verses_translation_id_book_id_chapter_idx" ON "bible_verses"("translation_id", "book_id", "chapter");

-- CreateIndex
CREATE UNIQUE INDEX "bible_verses_translation_id_book_id_chapter_verse_key" ON "bible_verses"("translation_id", "book_id", "chapter", "verse");

-- Search indexes: full-text on the generated vector, trigram on the normalized text.
CREATE INDEX "bible_verses_search_vector_idx" ON "bible_verses" USING GIN ("search_vector");
CREATE INDEX "bible_verses_normalized_text_trgm_idx" ON "bible_verses" USING GIN ("normalized_text" gin_trgm_ops);

-- AddForeignKey
ALTER TABLE "bible_verses" ADD CONSTRAINT "bible_verses_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "bible_translations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bible_verses" ADD CONSTRAINT "bible_verses_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "bible_books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

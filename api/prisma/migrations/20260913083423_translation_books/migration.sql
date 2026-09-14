-- AlterTable
ALTER TABLE "bible_books" ADD COLUMN     "deuterocanonical" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "bible_translation_books" (
    "translation_id" UUID NOT NULL,
    "book_id" INTEGER NOT NULL,
    "chapter_count" INTEGER NOT NULL,
    "verse_count" INTEGER NOT NULL,

    CONSTRAINT "bible_translation_books_pkey" PRIMARY KEY ("translation_id","book_id")
);

-- AddForeignKey
ALTER TABLE "bible_translation_books" ADD CONSTRAINT "bible_translation_books_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "bible_translations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bible_translation_books" ADD CONSTRAINT "bible_translation_books_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "bible_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

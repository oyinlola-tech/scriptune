-- A book's name in the translation's own language ("Saamu" for Psalms in Yoruba).
ALTER TABLE "bible_translation_books" ADD COLUMN "local_name" TEXT;

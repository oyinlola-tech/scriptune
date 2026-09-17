-- Verse-to-passage links ("related scriptures"), shared by every translation.
-- The primary key leads with the source verse, so reading a verse's links is one index range scan.
CREATE TABLE "bible_cross_references" (
    "from_book_id" INTEGER NOT NULL,
    "from_chapter" INTEGER NOT NULL,
    "from_verse" INTEGER NOT NULL,
    "to_book_id" INTEGER NOT NULL,
    "to_chapter" INTEGER NOT NULL,
    "to_verse_start" INTEGER NOT NULL,
    "to_verse_end" INTEGER NOT NULL,
    "votes" INTEGER NOT NULL,

    CONSTRAINT "bible_cross_references_pkey" PRIMARY KEY ("from_book_id","from_chapter","from_verse","to_book_id","to_chapter","to_verse_start")
);

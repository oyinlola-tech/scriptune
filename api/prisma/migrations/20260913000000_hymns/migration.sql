
-- CreateEnum
CREATE TYPE "ContributorRole" AS ENUM ('AUTHOR', 'COMPOSER', 'TRANSLATOR', 'ARRANGER');

-- CreateTable
CREATE TABLE "hymn_sources" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "edition" TEXT,
    "license" TEXT NOT NULL,
    "rights_status" TEXT NOT NULL,
    "retrieved_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "hymn_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hymns" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "import_key" TEXT,
    "canonical_title" TEXT NOT NULL,
    "year" INTEGER,
    "meter" TEXT,
    "tune_name" TEXT,
    "rights_status" TEXT NOT NULL,
    "source_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hymns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hymn_texts" (
    "id" UUID NOT NULL,
    "hymn_id" UUID NOT NULL,
    "language" TEXT NOT NULL,
    "variant" TEXT NOT NULL DEFAULT 'default',
    "title" TEXT NOT NULL,
    "stanzas" JSONB NOT NULL,
    "lyrics" TEXT NOT NULL,
    "first_line" TEXT NOT NULL,
    "normalized_lyrics" TEXT NOT NULL,
    "normalized_first_line" TEXT NOT NULL,
    "search_vector" tsvector GENERATED ALWAYS AS (to_tsvector('english', "title" || ' ' || "lyrics")) STORED,
    "rights_status" TEXT NOT NULL,
    "source_id" UUID,

    CONSTRAINT "hymn_texts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hymn_alternate_titles" (
    "id" UUID NOT NULL,
    "hymn_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',

    CONSTRAINT "hymn_alternate_titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hymn_people" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birth_year" INTEGER,
    "death_year" INTEGER,

    CONSTRAINT "hymn_people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hymn_contributors" (
    "id" UUID NOT NULL,
    "hymn_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "role" "ContributorRole" NOT NULL,

    CONSTRAINT "hymn_contributors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hymnals" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "edition" TEXT,
    "year" INTEGER,
    "publisher" TEXT,
    "description" TEXT,
    "rights_status" TEXT NOT NULL,
    "source_id" UUID,

    CONSTRAINT "hymnals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hymnal_entries" (
    "id" UUID NOT NULL,
    "hymnal_id" UUID NOT NULL,
    "hymn_id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "section" TEXT,

    CONSTRAINT "hymnal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hymn_topics" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "hymn_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hymn_topic_links" (
    "hymn_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,

    CONSTRAINT "hymn_topic_links_pkey" PRIMARY KEY ("hymn_id","topic_id")
);

-- CreateTable
CREATE TABLE "hymn_scripture_references" (
    "id" UUID NOT NULL,
    "hymn_id" UUID NOT NULL,
    "book_id" INTEGER NOT NULL,
    "chapter" INTEGER NOT NULL,
    "verse_start" INTEGER,
    "verse_end" INTEGER,
    "note" TEXT,

    CONSTRAINT "hymn_scripture_references_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hymn_sources_slug_key" ON "hymn_sources"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "hymns_slug_key" ON "hymns"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "hymns_import_key_key" ON "hymns"("import_key");

-- CreateIndex
CREATE UNIQUE INDEX "hymn_texts_hymn_id_language_variant_key" ON "hymn_texts"("hymn_id", "language", "variant");

-- CreateIndex
CREATE INDEX "hymn_alternate_titles_hymn_id_idx" ON "hymn_alternate_titles"("hymn_id");

-- CreateIndex
CREATE UNIQUE INDEX "hymn_people_slug_key" ON "hymn_people"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "hymn_contributors_hymn_id_person_id_role_key" ON "hymn_contributors"("hymn_id", "person_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "hymnals_slug_key" ON "hymnals"("slug");

-- CreateIndex
CREATE INDEX "hymnal_entries_hymn_id_idx" ON "hymnal_entries"("hymn_id");

-- CreateIndex
CREATE UNIQUE INDEX "hymnal_entries_hymnal_id_number_key" ON "hymnal_entries"("hymnal_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "hymn_topics_slug_key" ON "hymn_topics"("slug");

-- CreateIndex
CREATE INDEX "hymn_scripture_references_hymn_id_idx" ON "hymn_scripture_references"("hymn_id");

-- CreateIndex
CREATE INDEX "hymn_scripture_references_book_id_chapter_idx" ON "hymn_scripture_references"("book_id", "chapter");

-- Search indexes: full-text on the generated vector, trigram on the normalized lyrics and first line.
CREATE INDEX "hymn_texts_search_vector_idx" ON "hymn_texts" USING GIN ("search_vector");
CREATE INDEX "hymn_texts_normalized_lyrics_trgm_idx" ON "hymn_texts" USING GIN ("normalized_lyrics" gin_trgm_ops);

-- AddForeignKey
ALTER TABLE "hymns" ADD CONSTRAINT "hymns_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "hymn_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hymn_texts" ADD CONSTRAINT "hymn_texts_hymn_id_fkey" FOREIGN KEY ("hymn_id") REFERENCES "hymns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hymn_texts" ADD CONSTRAINT "hymn_texts_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "hymn_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hymn_alternate_titles" ADD CONSTRAINT "hymn_alternate_titles_hymn_id_fkey" FOREIGN KEY ("hymn_id") REFERENCES "hymns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hymn_contributors" ADD CONSTRAINT "hymn_contributors_hymn_id_fkey" FOREIGN KEY ("hymn_id") REFERENCES "hymns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hymn_contributors" ADD CONSTRAINT "hymn_contributors_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "hymn_people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hymnals" ADD CONSTRAINT "hymnals_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "hymn_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hymnal_entries" ADD CONSTRAINT "hymnal_entries_hymnal_id_fkey" FOREIGN KEY ("hymnal_id") REFERENCES "hymnals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hymnal_entries" ADD CONSTRAINT "hymnal_entries_hymn_id_fkey" FOREIGN KEY ("hymn_id") REFERENCES "hymns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hymn_topic_links" ADD CONSTRAINT "hymn_topic_links_hymn_id_fkey" FOREIGN KEY ("hymn_id") REFERENCES "hymns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hymn_topic_links" ADD CONSTRAINT "hymn_topic_links_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "hymn_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hymn_scripture_references" ADD CONSTRAINT "hymn_scripture_references_hymn_id_fkey" FOREIGN KEY ("hymn_id") REFERENCES "hymns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hymn_scripture_references" ADD CONSTRAINT "hymn_scripture_references_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "bible_books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


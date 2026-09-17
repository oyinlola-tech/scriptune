-- Full-text search that ignores accents and tone marks.
--
-- The search vectors were built from the text as written, so the token for
-- "Ọlọ́run" kept its marks and a query typed (or transcribed) without them,
-- "Olorun", never reached the index; it fell through to the trigram stage,
-- which is the expensive one. Folding both sides the same way keeps Yoruba
-- on the fast path. English text is unchanged by the fold apart from case.

-- NFKD splits a letter from its marks; the marks (U+0300 to U+036F) are dropped.
CREATE OR REPLACE FUNCTION scriptune_fold(input text) RETURNS text
    LANGUAGE sql IMMUTABLE PARALLEL SAFE RETURNS NULL ON NULL INPUT
    AS $$ SELECT lower(regexp_replace(normalize(input, NFKD), '[̀-ͯ]', '', 'g')) $$;

DROP INDEX IF EXISTS "bible_verses_search_vector_idx";
ALTER TABLE "bible_verses" DROP COLUMN "search_vector";
ALTER TABLE "bible_verses" ADD COLUMN "search_vector" tsvector GENERATED ALWAYS AS (to_tsvector('english', scriptune_fold("text"))) STORED;
CREATE INDEX "bible_verses_search_vector_idx" ON "bible_verses" USING GIN ("search_vector");

DROP INDEX IF EXISTS "hymn_texts_search_vector_idx";
ALTER TABLE "hymn_texts" DROP COLUMN "search_vector";
ALTER TABLE "hymn_texts" ADD COLUMN "search_vector" tsvector GENERATED ALWAYS AS (to_tsvector('english', scriptune_fold("title" || ' ' || "lyrics"))) STORED;
CREATE INDEX "hymn_texts_search_vector_idx" ON "hymn_texts" USING GIN ("search_vector");

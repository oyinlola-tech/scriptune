-- Tells links a hymnal states apart from links found by comparing a hymn's words with scripture,
-- so the matcher can replace its own work without touching anyone else's.
ALTER TABLE "hymn_scripture_references" ADD COLUMN "origin" TEXT NOT NULL DEFAULT 'editorial';

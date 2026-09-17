-- Related hymns, computed ahead of time by the link:hymns job. The primary key leads with
-- the hymn being read, so its related hymns come back from one short index range scan.
CREATE TABLE "hymn_relations" (
    "hymn_id" UUID NOT NULL,
    "related_hymn_id" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "hymn_relations_pkey" PRIMARY KEY ("hymn_id","related_hymn_id")
);

ALTER TABLE "hymn_relations" ADD CONSTRAINT "hymn_relations_hymn_id_fkey" FOREIGN KEY ("hymn_id") REFERENCES "hymns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hymn_relations" ADD CONSTRAINT "hymn_relations_related_hymn_id_fkey" FOREIGN KEY ("related_hymn_id") REFERENCES "hymns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

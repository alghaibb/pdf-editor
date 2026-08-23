-- AlterTable
ALTER TABLE "document_share" ADD COLUMN "version" INTEGER;

-- Backfill: existing links freeze to the document's current saved version.
UPDATE "document_share" s
SET "version" = d."currentVersion"
FROM "document" d
WHERE s."documentId" = d."id";

-- Any leftover row without a document is unusable.
DELETE FROM "document_share" WHERE "version" IS NULL;

ALTER TABLE "document_share" ALTER COLUMN "version" SET NOT NULL;

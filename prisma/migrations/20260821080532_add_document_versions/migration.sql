-- CreateTable
CREATE TABLE "document_version" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_version_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_version_documentId_version_key" ON "document_version"("documentId", "version");

-- AddForeignKey
ALTER TABLE "document_version" ADD CONSTRAINT "document_version_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: give every existing document a history row for its current
-- version so version history is not empty for pre-existing documents.
INSERT INTO "document_version" ("id", "documentId", "version", "size", "createdAt")
SELECT gen_random_uuid(), d."id", d."currentVersion", d."size", d."updatedAt"
FROM "document" d
WHERE d."currentVersion" > 0;

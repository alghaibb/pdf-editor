-- CreateTable
CREATE TABLE "document_share" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_share_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_share_token_key" ON "document_share"("token");

-- CreateIndex
CREATE INDEX "document_share_documentId_idx" ON "document_share"("documentId");

-- CreateIndex
CREATE INDEX "document_share_expiresAt_idx" ON "document_share"("expiresAt");

-- AddForeignKey
ALTER TABLE "document_share" ADD CONSTRAINT "document_share_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

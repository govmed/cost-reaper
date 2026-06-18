-- Supporting documents attached to an estimate (FR-29 document types).
-- File bytes are stored in-DB (bytea); document_type is validated server-side
-- against the DOCUMENT_TYPE reference set.
CREATE TABLE "estimate_documents" (
    "id" UUID NOT NULL,
    "estimate_id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "description" TEXT,
    "content_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "content" BYTEA NOT NULL,
    "uploaded_by_id" UUID,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estimate_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "estimate_documents_estimate_id_idx" ON "estimate_documents"("estimate_id");

ALTER TABLE "estimate_documents"
  ADD CONSTRAINT "estimate_documents_estimate_id_fkey"
  FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "estimate_documents"
  ADD CONSTRAINT "estimate_documents_uploaded_by_id_fkey"
  FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

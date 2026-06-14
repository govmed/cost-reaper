-- Statement of Work (BR-7): an editable, official document composed from an
-- estimate and printed to an official/legal PDF. Additive — new table only.

-- CreateTable
CREATE TABLE "statements_of_work" (
    "id" UUID NOT NULL,
    "estimate_id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "client_name" TEXT NOT NULL DEFAULT '',
    "provider_name" TEXT NOT NULL DEFAULT '',
    "overview" TEXT NOT NULL DEFAULT '',
    "scope" TEXT NOT NULL DEFAULT '',
    "deliverables" TEXT NOT NULL DEFAULT '',
    "timeline" TEXT NOT NULL DEFAULT '',
    "payment_terms" TEXT NOT NULL DEFAULT '',
    "assumptions" TEXT NOT NULL DEFAULT '',
    "terms_and_conditions" TEXT NOT NULL DEFAULT '',
    "effective_date" TIMESTAMP(3),
    "issued_at" TIMESTAMP(3),
    "totals_snapshot" JSONB,
    "currency_snapshot" TEXT,
    "prepared_by_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "statements_of_work_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "statements_of_work_number_key" ON "statements_of_work"("number");

-- CreateIndex
CREATE INDEX "statements_of_work_estimate_id_idx" ON "statements_of_work"("estimate_id");

-- AddForeignKey
ALTER TABLE "statements_of_work" ADD CONSTRAINT "statements_of_work_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

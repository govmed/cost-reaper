-- FR-15 / FE-25 — versioning: captured baselines (snapshot + denormalized totals) per estimate.

-- CreateTable
CREATE TABLE "baselines" (
    "id" UUID NOT NULL,
    "estimate_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "grand_total" DECIMAL(18,4) NOT NULL,
    "client_price" DECIMAL(18,4) NOT NULL,
    "one_time_total" DECIMAL(18,4) NOT NULL,
    "monthly_total" DECIMAL(18,4) NOT NULL,
    "yearly_total" DECIMAL(18,4) NOT NULL,
    "snapshot_json" JSONB NOT NULL,
    "created_by_email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "baselines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "baselines_estimate_id_idx" ON "baselines"("estimate_id");

-- AddForeignKey
ALTER TABLE "baselines" ADD CONSTRAINT "baselines_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;


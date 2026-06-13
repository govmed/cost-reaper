-- FR-17 / FE-12 — FX rates for multi-currency roll-ups (rate vs base USD).

-- CreateTable
CREATE TABLE "fx_rates" (
    "id" UUID NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "rate_to_base" DECIMAL(18,6) NOT NULL,
    "updated_by_email" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fx_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fx_rates_currency_key" ON "fx_rates"("currency");


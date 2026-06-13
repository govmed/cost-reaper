-- FR-16 / FE-20 — client pricing: estimate-level margin (on cost) and tax (on sell price).

-- AlterTable
ALTER TABLE "estimates" ADD COLUMN     "margin_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tax_percent" DECIMAL(5,2) NOT NULL DEFAULT 0;

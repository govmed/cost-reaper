-- Enterprise cloud catalog: a per-GB unit and a category for grouping (FR-21).

-- AlterEnum
ALTER TYPE "CloudPriceUnit" ADD VALUE 'GB';

-- AlterTable
ALTER TABLE "cloud_prices" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'Compute';

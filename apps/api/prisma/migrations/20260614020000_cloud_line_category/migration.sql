-- Snapshot the cloud price's category onto each cloud line for the category breakdown (FR-21).

-- AlterTable
ALTER TABLE "cloud_compute_line_items" ADD COLUMN     "category" TEXT;

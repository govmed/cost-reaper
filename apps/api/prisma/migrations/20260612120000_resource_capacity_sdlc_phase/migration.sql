-- FR-27 (resource allocation/capacity) + FR-28 (cost per SDLC phase)
-- Adds the SDLC phase enum + tag to all line items, and resource scheduling
-- fields (resource, allocation %, start/end date) to labor lines.

-- CreateEnum
CREATE TYPE "SdlcPhase" AS ENUM ('PLANNING', 'DESIGN', 'DEVELOPMENT', 'TESTING', 'DEPLOYMENT', 'MAINTENANCE');

-- AlterTable
ALTER TABLE "cloud_compute_line_items" ADD COLUMN     "sdlc_phase" "SdlcPhase";

-- AlterTable
ALTER TABLE "labor_line_items" ADD COLUMN     "allocation_percent" DECIMAL(5,2) NOT NULL DEFAULT 100,
ADD COLUMN     "end_date" DATE,
ADD COLUMN     "resource_name" TEXT,
ADD COLUMN     "sdlc_phase" "SdlcPhase",
ADD COLUMN     "start_date" DATE;

-- AlterTable
ALTER TABLE "non_labor_line_items" ADD COLUMN     "sdlc_phase" "SdlcPhase";

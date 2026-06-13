-- FR-29 / FE-54 — make estimate status data-driven (governed by ESTIMATE_STATUS).
-- Convert the enum column to TEXT in place (preserving values + the index), then
-- drop the EstimateStatus enum. Valid statuses now live in the reference table.

ALTER TABLE "estimates" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "estimates" ALTER COLUMN "status" TYPE TEXT USING "status"::text;
ALTER TABLE "estimates" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

DROP TYPE "EstimateStatus";

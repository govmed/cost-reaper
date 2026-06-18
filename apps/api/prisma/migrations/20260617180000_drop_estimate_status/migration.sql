-- Remove the manual estimate "status" — the workflow stage (current_stage_id) is
-- now the single source of truth for an estimate's lifecycle.
DROP INDEX IF EXISTS "estimates_status_idx";
ALTER TABLE "estimates" DROP COLUMN IF EXISTS "status";

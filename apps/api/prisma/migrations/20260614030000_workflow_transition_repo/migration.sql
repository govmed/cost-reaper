-- Workflow + transition repos: a system key + description on each (FR-24).
-- Data-preserving: add nullable, backfill keys for existing rows, then enforce.

-- workflow_definitions
ALTER TABLE "workflow_definitions" ADD COLUMN "description" TEXT;
ALTER TABLE "workflow_definitions" ADD COLUMN "key" TEXT;
UPDATE "workflow_definitions" SET "key" = 'WF-DEFAULT' WHERE "key" IS NULL AND "is_default" = true;
UPDATE "workflow_definitions" SET "key" = 'WF-' || upper(substr(md5(random()::text || id::text), 1, 6)) WHERE "key" IS NULL;
ALTER TABLE "workflow_definitions" ALTER COLUMN "key" SET NOT NULL;
CREATE UNIQUE INDEX "workflow_definitions_key_key" ON "workflow_definitions"("key");

-- workflow_transitions
ALTER TABLE "workflow_transitions" ADD COLUMN "description" TEXT;
ALTER TABLE "workflow_transitions" ADD COLUMN "key" TEXT;
UPDATE "workflow_transitions" SET "key" = 'TR-' || upper(substr(md5(random()::text || id::text), 1, 6)) WHERE "key" IS NULL;
ALTER TABLE "workflow_transitions" ALTER COLUMN "key" SET NOT NULL;
CREATE UNIQUE INDEX "workflow_transitions_key_key" ON "workflow_transitions"("key");

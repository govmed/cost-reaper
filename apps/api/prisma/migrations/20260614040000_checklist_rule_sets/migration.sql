-- Checklist rule sets (FR-25): a system-keyed, labelled collection of rules.
-- Data-preserving: create the set table, seed a default set, then attach every
-- existing rule to it before enforcing NOT NULL on the new FK column.

-- CreateTable
CREATE TABLE "checklist_rule_sets" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_rule_sets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "checklist_rule_sets_key_key" ON "checklist_rule_sets"("key");

-- Seed the default set so existing rules have a home (idempotent re-seed in seed.ts keeps it current).
INSERT INTO "checklist_rule_sets" ("id", "key", "name", "description", "is_default", "is_active", "created_at", "updated_at")
VALUES (
    gen_random_uuid(),
    'RS-DEFAULT',
    'Default checklist',
    'Baseline smart-checklist rules applied to every estimate.',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Attach existing rules to the default set.
ALTER TABLE "checklist_rules" ADD COLUMN "rule_set_id" UUID;
UPDATE "checklist_rules"
   SET "rule_set_id" = (SELECT "id" FROM "checklist_rule_sets" WHERE "key" = 'RS-DEFAULT')
 WHERE "rule_set_id" IS NULL;
ALTER TABLE "checklist_rules" ALTER COLUMN "rule_set_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "checklist_rules_rule_set_id_idx" ON "checklist_rules"("rule_set_id");

-- AddForeignKey
ALTER TABLE "checklist_rules" ADD CONSTRAINT "checklist_rules_rule_set_id_fkey" FOREIGN KEY ("rule_set_id") REFERENCES "checklist_rule_sets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

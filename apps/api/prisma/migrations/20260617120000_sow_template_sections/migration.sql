-- Expand Statement of Work with the full template's narrative sections (BR-7).
-- Additive: each column is TEXT NOT NULL DEFAULT '' so existing rows are unaffected.
ALTER TABLE "statements_of_work"
  ADD COLUMN IF NOT EXISTS "executive_summary" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "customer_understanding" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "out_of_scope" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "solution_overview" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "governance_model" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "roles_responsibilities" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "non_functional_requirements" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "testing_strategy" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "maintenance_support" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "risks_mitigation" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "acceptance_criteria" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "change_control" TEXT NOT NULL DEFAULT '';

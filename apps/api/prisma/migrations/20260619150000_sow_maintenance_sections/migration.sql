-- Implementation & Maintenance SOW: structured SLA / support / warranty / security sections (BR-7).
ALTER TABLE "statements_of_work" ADD COLUMN "sla_tiers" JSONB;
ALTER TABLE "statements_of_work" ADD COLUMN "support_tiers" JSONB;
ALTER TABLE "statements_of_work" ADD COLUMN "warranty_days" INTEGER;
ALTER TABLE "statements_of_work" ADD COLUMN "security_compliance" TEXT NOT NULL DEFAULT '';

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ESTIMATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "RateUnit" AS ENUM ('HOUR', 'DAY');

-- CreateEnum
CREATE TYPE "EstimateStatus" AS ENUM ('DRAFT', 'FINAL');

-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('ONE_TIME', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "CloudProvider" AS ENUM ('AWS', 'GCP', 'AZURE');

-- CreateEnum
CREATE TYPE "CloudPriceUnit" AS ENUM ('HOUR', 'MONTH', 'GB_MONTH', 'REQUEST');

-- CreateEnum
CREATE TYPE "CloudPriceSource" AS ENUM ('CATALOG_SEED', 'AWS_API', 'AZURE_API', 'GCP_API');

-- CreateEnum
CREATE TYPE "NonLaborType" AS ENUM ('FIXED', 'RECURRING');

-- CreateEnum
CREATE TYPE "ChecklistSeverity" AS ENUM ('BLOCKER', 'WARNING', 'INFO');

-- CreateEnum
CREATE TYPE "ChecklistScope" AS ENUM ('ESTIMATE', 'LABOR', 'NONLABOR', 'CLOUD', 'RESOURCE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ESTIMATOR',
    "display_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_cards" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_card_roles" (
    "id" UUID NOT NULL,
    "rate_card_id" UUID NOT NULL,
    "role_name" TEXT NOT NULL,
    "unit" "RateUnit" NOT NULL,
    "rate" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "rate_card_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cloud_prices" (
    "id" UUID NOT NULL,
    "provider" "CloudProvider" NOT NULL,
    "region" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "sku_or_instance" TEXT NOT NULL,
    "unit" "CloudPriceUnit" NOT NULL,
    "unit_price" DECIMAL(18,6) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "source" "CloudPriceSource" NOT NULL DEFAULT 'CATALOG_SEED',
    "effective_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cloud_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "EstimateStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" CHAR(3) NOT NULL,
    "global_upcharge_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "contingency_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "rate_card_id" UUID,
    "owner_id" UUID NOT NULL,
    "workflow_definition_id" UUID,
    "current_stage_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estimates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labor_line_items" (
    "id" UUID NOT NULL,
    "estimate_id" UUID NOT NULL,
    "rate_card_role_id" UUID,
    "description" TEXT,
    "quantity" DECIMAL(18,4) NOT NULL DEFAULT 1,
    "units" DECIMAL(18,4) NOT NULL,
    "rate_snapshot" DECIMAL(18,4) NOT NULL,
    "upcharge_percent_override" DECIMAL(5,2),
    "billing_period" "BillingPeriod" NOT NULL DEFAULT 'ONE_TIME',
    "line_total" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "labor_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "non_labor_line_items" (
    "id" UUID NOT NULL,
    "estimate_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "type" "NonLaborType" NOT NULL DEFAULT 'FIXED',
    "amount" DECIMAL(18,4) NOT NULL,
    "upcharge_percent_override" DECIMAL(5,2),
    "billing_period" "BillingPeriod" NOT NULL DEFAULT 'ONE_TIME',
    "periods" INTEGER NOT NULL DEFAULT 1,
    "line_total" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "non_labor_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cloud_compute_line_items" (
    "id" UUID NOT NULL,
    "estimate_id" UUID NOT NULL,
    "cloud_price_id" UUID,
    "provider" "CloudProvider" NOT NULL,
    "region" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "sku_or_instance" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL DEFAULT 1,
    "usage_hours_per_month" DECIMAL(18,4) NOT NULL DEFAULT 730,
    "unit_price_snapshot" DECIMAL(18,6) NOT NULL,
    "upcharge_percent_override" DECIMAL(5,2),
    "billing_period" "BillingPeriod" NOT NULL DEFAULT 'MONTHLY',
    "line_total" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "cloud_compute_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assumptions" (
    "id" UUID NOT NULL,
    "estimate_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assumptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_definitions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_stages" (
    "id" UUID NOT NULL,
    "workflow_definition_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_initial" BOOLEAN NOT NULL DEFAULT false,
    "is_terminal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "workflow_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_transitions" (
    "id" UUID NOT NULL,
    "workflow_definition_id" UUID NOT NULL,
    "from_stage_id" UUID NOT NULL,
    "to_stage_id" UUID NOT NULL,
    "allowed_role" "Role" NOT NULL,
    "label" TEXT NOT NULL,
    "requires_checklist_pass" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "workflow_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_transition_events" (
    "id" UUID NOT NULL,
    "estimate_id" UUID NOT NULL,
    "from_stage_id" UUID,
    "to_stage_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "note" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_transition_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_rules" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "ChecklistSeverity" NOT NULL DEFAULT 'BLOCKER',
    "scope" "ChecklistScope" NOT NULL DEFAULT 'ESTIMATE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_builtin" BOOLEAN NOT NULL DEFAULT true,
    "config_json" JSONB,

    CONSTRAINT "checklist_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_id" UUID,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "cloud_prices_provider_region_idx" ON "cloud_prices"("provider", "region");

-- CreateIndex
CREATE UNIQUE INDEX "cloud_prices_provider_region_service_sku_or_instance_unit_key" ON "cloud_prices"("provider", "region", "service", "sku_or_instance", "unit");

-- CreateIndex
CREATE INDEX "estimates_owner_id_idx" ON "estimates"("owner_id");

-- CreateIndex
CREATE INDEX "estimates_status_idx" ON "estimates"("status");

-- CreateIndex
CREATE INDEX "labor_line_items_estimate_id_idx" ON "labor_line_items"("estimate_id");

-- CreateIndex
CREATE INDEX "non_labor_line_items_estimate_id_idx" ON "non_labor_line_items"("estimate_id");

-- CreateIndex
CREATE INDEX "cloud_compute_line_items_estimate_id_idx" ON "cloud_compute_line_items"("estimate_id");

-- CreateIndex
CREATE INDEX "assumptions_estimate_id_idx" ON "assumptions"("estimate_id");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_stages_workflow_definition_id_key_key" ON "workflow_stages"("workflow_definition_id", "key");

-- CreateIndex
CREATE INDEX "workflow_transition_events_estimate_id_idx" ON "workflow_transition_events"("estimate_id");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_rules_key_key" ON "checklist_rules"("key");

-- CreateIndex
CREATE INDEX "audit_events_entity_type_entity_id_idx" ON "audit_events"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "rate_cards" ADD CONSTRAINT "rate_cards_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_card_roles" ADD CONSTRAINT "rate_card_roles_rate_card_id_fkey" FOREIGN KEY ("rate_card_id") REFERENCES "rate_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_rate_card_id_fkey" FOREIGN KEY ("rate_card_id") REFERENCES "rate_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_workflow_definition_id_fkey" FOREIGN KEY ("workflow_definition_id") REFERENCES "workflow_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_current_stage_id_fkey" FOREIGN KEY ("current_stage_id") REFERENCES "workflow_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labor_line_items" ADD CONSTRAINT "labor_line_items_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labor_line_items" ADD CONSTRAINT "labor_line_items_rate_card_role_id_fkey" FOREIGN KEY ("rate_card_role_id") REFERENCES "rate_card_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_labor_line_items" ADD CONSTRAINT "non_labor_line_items_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cloud_compute_line_items" ADD CONSTRAINT "cloud_compute_line_items_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cloud_compute_line_items" ADD CONSTRAINT "cloud_compute_line_items_cloud_price_id_fkey" FOREIGN KEY ("cloud_price_id") REFERENCES "cloud_prices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assumptions" ADD CONSTRAINT "assumptions_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_definitions" ADD CONSTRAINT "workflow_definitions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_stages" ADD CONSTRAINT "workflow_stages_workflow_definition_id_fkey" FOREIGN KEY ("workflow_definition_id") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_workflow_definition_id_fkey" FOREIGN KEY ("workflow_definition_id") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_from_stage_id_fkey" FOREIGN KEY ("from_stage_id") REFERENCES "workflow_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_to_stage_id_fkey" FOREIGN KEY ("to_stage_id") REFERENCES "workflow_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transition_events" ADD CONSTRAINT "workflow_transition_events_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transition_events" ADD CONSTRAINT "workflow_transition_events_from_stage_id_fkey" FOREIGN KEY ("from_stage_id") REFERENCES "workflow_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transition_events" ADD CONSTRAINT "workflow_transition_events_to_stage_id_fkey" FOREIGN KEY ("to_stage_id") REFERENCES "workflow_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transition_events" ADD CONSTRAINT "workflow_transition_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


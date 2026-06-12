-- FR-29 / NFR-17 — database-driven reference data platform (EP-13).
-- Generic reference_type / reference_value tables with parent-child self-relation.

-- CreateTable
CREATE TABLE "reference_types" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reference_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_values" (
    "id" UUID NOT NULL,
    "reference_type_id" UUID NOT NULL,
    "parent_id" UUID,
    "code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_builtin" BOOLEAN NOT NULL DEFAULT false,
    "metadata_json" JSONB,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reference_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reference_types_code_key" ON "reference_types"("code");

-- CreateIndex
CREATE INDEX "reference_values_reference_type_id_idx" ON "reference_values"("reference_type_id");

-- CreateIndex
CREATE INDEX "reference_values_parent_id_idx" ON "reference_values"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "reference_values_reference_type_id_code_key" ON "reference_values"("reference_type_id", "code");

-- AddForeignKey
ALTER TABLE "reference_values" ADD CONSTRAINT "reference_values_reference_type_id_fkey" FOREIGN KEY ("reference_type_id") REFERENCES "reference_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_values" ADD CONSTRAINT "reference_values_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "reference_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

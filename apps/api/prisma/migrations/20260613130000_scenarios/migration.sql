-- FR-14 / FE-24 — scenarios: an estimate may be a linked variant of another.

-- AlterTable
ALTER TABLE "estimates" ADD COLUMN     "scenario_of_id" UUID;

-- CreateIndex
CREATE INDEX "estimates_scenario_of_id_idx" ON "estimates"("scenario_of_id");

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_scenario_of_id_fkey" FOREIGN KEY ("scenario_of_id") REFERENCES "estimates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

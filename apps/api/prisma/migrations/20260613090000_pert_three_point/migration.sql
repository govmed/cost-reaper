-- FR-13 / FE-19 — three-point (PERT) estimation for labor lines.
-- Optional optimistic / most-likely / pessimistic units; when all three are set,
-- the line's effective units = (o + 4m + p) / 6.

-- AlterTable
ALTER TABLE "labor_line_items" ADD COLUMN     "units_most_likely" DECIMAL(18,4),
ADD COLUMN     "units_optimistic" DECIMAL(18,4),
ADD COLUMN     "units_pessimistic" DECIMAL(18,4);

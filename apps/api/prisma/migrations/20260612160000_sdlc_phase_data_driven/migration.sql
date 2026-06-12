-- FR-29 / FE-54 — make SDLC phase data-driven.
-- Convert the enum-typed sdlc_phase columns to TEXT, PRESERVING existing values
-- (USING ::text), then drop the now-unused SdlcPhase enum. The set of valid
-- phases now lives in the SDLC_PHASE reference table and is validated server-side.

ALTER TABLE "labor_line_items" ALTER COLUMN "sdlc_phase" TYPE TEXT USING "sdlc_phase"::text;
ALTER TABLE "non_labor_line_items" ALTER COLUMN "sdlc_phase" TYPE TEXT USING "sdlc_phase"::text;
ALTER TABLE "cloud_compute_line_items" ALTER COLUMN "sdlc_phase" TYPE TEXT USING "sdlc_phase"::text;

DROP TYPE "SdlcPhase";

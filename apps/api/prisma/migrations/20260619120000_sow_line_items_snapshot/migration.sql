-- Snapshot the estimate's line items onto a SOW at issue (BR-7) so the issued
-- document is immutable, like the pricing snapshot.
ALTER TABLE "statements_of_work" ADD COLUMN "line_items_snapshot" JSONB;

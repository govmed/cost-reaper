-- Record the caller's IP and optional client location on every audit event (FR-11).
ALTER TABLE "audit_events" ADD COLUMN "ip_address" TEXT;
ALTER TABLE "audit_events" ADD COLUMN "location" TEXT;

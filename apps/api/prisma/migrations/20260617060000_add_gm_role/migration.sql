-- Add the GM (General Manager) role to the Role enum (FR-2, FR-26).
-- GM approves estimates and returns them to draft; it cannot create/edit them.
-- PG 12+ permits ADD VALUE inside a transaction as long as the new value is not
-- used in the same transaction (it isn't here — data is seeded afterwards).
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'GM';

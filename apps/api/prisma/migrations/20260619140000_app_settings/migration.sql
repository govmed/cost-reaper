-- Admin-configurable application settings (e.g. document upload size limit).
CREATE TABLE "app_settings" (
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "updated_by_id" UUID,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);
INSERT INTO "app_settings" ("key", "value") VALUES ('documents.maxUploadMb', '100')
  ON CONFLICT ("key") DO NOTHING;

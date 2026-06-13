-- FR-19 / FE-28 — collaboration comments on estimates.

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "estimate_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "author_email" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comments_estimate_id_idx" ON "comments"("estimate_id");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

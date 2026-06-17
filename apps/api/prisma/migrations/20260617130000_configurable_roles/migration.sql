-- FR-30: data-driven roles & permission-based RBAC.
-- Move role references off the "Role" enum to plain text (validated server-side
-- against the new roles table), then introduce the roles table itself.

-- 1) Detach columns from the enum type.
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE TEXT USING "role"::text;
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'ESTIMATOR';

ALTER TABLE "workflow_transitions" ALTER COLUMN "allowed_role" TYPE TEXT USING "allowed_role"::text;

-- 2) Drop the now-unused enum type.
DROP TYPE "Role";

-- 3) Admin-managed roles (FR-30). Permissions are a text[] of permission keys;
--    the ADMIN role holds {'*'} (allow-all). Built-ins can't be deleted/recoded.
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_builtin" BOOLEAN NOT NULL DEFAULT false,
    "permissions" TEXT[] DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "roles_code_key" ON "roles" ("code");

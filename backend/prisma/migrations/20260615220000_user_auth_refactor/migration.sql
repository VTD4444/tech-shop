-- User auth refactor: fullName, phone, Google OAuth
-- Idempotent: safe to re-run on an already-migrated database

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "full_name" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_id" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'auth_provider'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "auth_provider" TEXT NOT NULL DEFAULT 'local';
  END IF;
END $$;

-- Normalize password column name and allow NULL (Google OAuth users)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    BEGIN
      ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
    EXCEPTION
      WHEN others THEN NULL;
    END;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'passwordHash'
  ) THEN
    ALTER TABLE "users" RENAME COLUMN "passwordHash" TO "password_hash";
    ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'password'
  ) THEN
    ALTER TABLE "users" RENAME COLUMN "password" TO "password_hash";
    ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
  ELSE
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" TEXT;
  END IF;
END $$;

-- Backfill only when rows still have NULL values (skip on re-run)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "users" WHERE "full_name" IS NULL LIMIT 1) THEN
    UPDATE "users" SET "full_name" = "username" WHERE "full_name" IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "users" WHERE "phone" IS NULL LIMIT 1) THEN
    UPDATE "users" SET "phone" = '09' || LPAD("id"::text, 8, '0') WHERE "phone" IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users'
      AND column_name = 'full_name' AND is_nullable = 'YES'
  ) AND NOT EXISTS (SELECT 1 FROM "users" WHERE "full_name" IS NULL LIMIT 1) THEN
    ALTER TABLE "users" ALTER COLUMN "full_name" SET NOT NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_key" ON "users"("phone");
CREATE UNIQUE INDEX IF NOT EXISTS "users_google_id_key" ON "users"("google_id");

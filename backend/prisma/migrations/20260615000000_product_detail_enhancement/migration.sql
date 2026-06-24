-- Product detail enhancement: longDescription, ratings, comments

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "long_description" TEXT;

CREATE TABLE IF NOT EXISTS "product_ratings" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "order_id" BIGINT,
    "rating" INTEGER NOT NULL CHECK ("rating" BETWEEN 1 AND 5),
    "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_ratings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "product_comments" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "parent_id" BIGINT,
    "content" TEXT NOT NULL,
    "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_product_ratings_user_product" ON "product_ratings"("user_id", "product_id");
CREATE INDEX IF NOT EXISTS "idx_product_ratings_product_created" ON "product_ratings"("product_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_product_ratings_product_rating" ON "product_ratings"("product_id", "rating");
CREATE INDEX IF NOT EXISTS "idx_product_comments_product_created" ON "product_comments"("product_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_product_comments_parent" ON "product_comments"("parent_id");
CREATE INDEX IF NOT EXISTS "idx_product_comments_product_status" ON "product_comments"("product_id", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "product_ratings_order_product_unique"
  ON "product_ratings" ("order_id", "product_id")
  WHERE "order_id" IS NOT NULL;

ALTER TABLE "product_ratings" DROP CONSTRAINT IF EXISTS "product_ratings_user_id_fkey";
ALTER TABLE "product_ratings" ADD CONSTRAINT "product_ratings_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_ratings" DROP CONSTRAINT IF EXISTS "product_ratings_product_id_fkey";
ALTER TABLE "product_ratings" ADD CONSTRAINT "product_ratings_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_ratings" DROP CONSTRAINT IF EXISTS "product_ratings_order_id_fkey";
ALTER TABLE "product_ratings" ADD CONSTRAINT "product_ratings_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "product_comments" DROP CONSTRAINT IF EXISTS "product_comments_user_id_fkey";
ALTER TABLE "product_comments" ADD CONSTRAINT "product_comments_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_comments" DROP CONSTRAINT IF EXISTS "product_comments_product_id_fkey";
ALTER TABLE "product_comments" ADD CONSTRAINT "product_comments_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_comments" DROP CONSTRAINT IF EXISTS "product_comments_parent_id_fkey";
ALTER TABLE "product_comments" ADD CONSTRAINT "product_comments_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "product_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- product_reviews dropped after running prisma/scripts/migrate-reviews.ts

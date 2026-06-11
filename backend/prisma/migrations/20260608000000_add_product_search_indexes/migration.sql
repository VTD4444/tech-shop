-- Speed up ILIKE / contains search on product name and description
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "idx_products_name_trgm"
  ON "products" USING GIN ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "idx_products_description_trgm"
  ON "products" USING GIN ("description" gin_trgm_ops);

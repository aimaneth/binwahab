-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "descriptionHtml" TEXT;

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "handle" TEXT;
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_handle_key" UNIQUE ("handle");

-- Update existing collections to have a handle based on their name
UPDATE "Collection" SET "handle" = LOWER(REGEXP_REPLACE("name", '\s+', '-', 'g')) WHERE "handle" IS NULL; 
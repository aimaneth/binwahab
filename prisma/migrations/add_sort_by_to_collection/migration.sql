-- Add sortBy column to Collection table
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "sortBy" TEXT NOT NULL DEFAULT 'MANUAL';

-- Update existing records to use the default value
UPDATE "Collection" SET "sortBy" = 'MANUAL' WHERE "sortBy" IS NULL; 
-- Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS "system_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- Add free_shipping setting if it doesn't exist
INSERT INTO "system_settings" ("key", "value")
VALUES ('free_shipping_enabled', 'false')
ON CONFLICT ("key") DO NOTHING; 
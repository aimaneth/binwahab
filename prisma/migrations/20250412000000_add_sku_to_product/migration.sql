-- Add sku column to Product table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Product' 
        AND column_name = 'sku'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "sku" TEXT UNIQUE;
    END IF;
END $$; 
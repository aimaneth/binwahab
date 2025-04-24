-- CreateSequence
CREATE SEQUENCE IF NOT EXISTS order_year_sequence START 1;

-- CreateTable
CREATE TABLE IF NOT EXISTS "system_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateFunction
CREATE OR REPLACE FUNCTION reset_order_sequence_if_new_year()
RETURNS TRIGGER AS $$
DECLARE
    current_year INTEGER;
    stored_year INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    SELECT CAST(value AS INTEGER)
    INTO stored_year
    FROM system_settings
    WHERE key = 'last_order_sequence_year';
    
    IF NOT FOUND THEN
        stored_year := 0;
    END IF;
    
    IF current_year != stored_year THEN
        ALTER SEQUENCE order_year_sequence RESTART WITH 1;
        
        INSERT INTO system_settings (key, value)
        VALUES ('last_order_sequence_year', current_year::TEXT)
        ON CONFLICT (key) DO UPDATE SET value = current_year::TEXT;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CreateFunction
CREATE OR REPLACE FUNCTION generate_order_id()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_part TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    sequence_part := LPAD(nextval('order_year_sequence')::TEXT, 4, '0');
    RETURN 'BW-' || year_part || '-' || sequence_part;
END;
$$ LANGUAGE plpgsql;

-- CreateTrigger
DROP TRIGGER IF EXISTS check_year_and_reset_sequence ON "Order";
CREATE TRIGGER check_year_and_reset_sequence
    BEFORE INSERT ON "Order"
    FOR EACH ROW
    EXECUTE FUNCTION reset_order_sequence_if_new_year();

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN id SET DEFAULT generate_order_id();

-- Update existing orders
DO $$
DECLARE
    r RECORD;
    new_id TEXT;
    counter INTEGER := 1;
BEGIN
    FOR r IN SELECT * FROM "Order" ORDER BY "createdAt" LOOP
        new_id := 'BW-' || EXTRACT(YEAR FROM r.createdAt)::TEXT || '-' || LPAD(counter::TEXT, 4, '0');
        UPDATE "Order" SET id = new_id WHERE id = r.id;
        counter := counter + 1;
    END LOOP;
END $$; 
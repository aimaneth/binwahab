-- Enable the pgcrypto extension for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_year_sequence START 1;

-- Create settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Function to reset sequence on year change
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

-- Function to generate order ID
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

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS check_year_and_reset_sequence ON "Order";

-- Create trigger for sequence reset
CREATE TRIGGER check_year_and_reset_sequence
    BEFORE INSERT ON "Order"
    FOR EACH ROW
    EXECUTE FUNCTION reset_order_sequence_if_new_year();

-- Update the Order table default
ALTER TABLE "Order" ALTER COLUMN id SET DEFAULT generate_order_id();

-- Insert initial year record
INSERT INTO system_settings (key, value)
VALUES ('last_order_sequence_year', EXTRACT(YEAR FROM CURRENT_DATE)::TEXT)
ON CONFLICT (key) DO UPDATE SET value = EXTRACT(YEAR FROM CURRENT_DATE)::TEXT; 
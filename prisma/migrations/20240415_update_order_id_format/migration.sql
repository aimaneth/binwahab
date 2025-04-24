-- Create a sequence for order numbers that resets each year
CREATE SEQUENCE IF NOT EXISTS order_year_sequence;

-- Function to reset sequence on year change
CREATE OR REPLACE FUNCTION reset_order_sequence_if_new_year()
RETURNS TRIGGER AS $$
DECLARE
  current_year INTEGER;
  stored_year INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Try to get the stored year from a settings table, create if doesn't exist
  BEGIN
    SELECT CAST(value AS INTEGER)
    INTO stored_year
    FROM system_settings
    WHERE key = 'last_order_sequence_year';
  EXCEPTION
    WHEN undefined_table THEN
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
      stored_year := 0;
  END;
  
  -- If year changed or no stored year, reset sequence and update stored year
  IF current_year != stored_year THEN
    ALTER SEQUENCE order_year_sequence RESTART WITH 1;
    
    INSERT INTO system_settings (key, value)
    VALUES ('last_order_sequence_year', current_year::TEXT)
    ON CONFLICT (key) DO UPDATE SET value = current_year::TEXT;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to check and reset sequence on each order
CREATE OR REPLACE TRIGGER check_year_and_reset_sequence
  BEFORE INSERT ON "Order"
  FOR EACH ROW
  EXECUTE FUNCTION reset_order_sequence_if_new_year();

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

-- Backup existing orders
CREATE TABLE "Order_backup" AS SELECT * FROM "Order";

-- Update the Order table to use the new ID format
ALTER TABLE "Order" ALTER COLUMN id SET DEFAULT generate_order_id();

-- Update existing orders with new format (if any)
DO $$
DECLARE
  r RECORD;
  new_id TEXT;
  counter INTEGER := 1;
BEGIN
  FOR r IN SELECT * FROM "Order_backup" ORDER BY "createdAt" LOOP
    new_id := 'BW-' || EXTRACT(YEAR FROM r.createdAt)::TEXT || '-' || LPAD(counter::TEXT, 4, '0');
    UPDATE "Order" SET id = new_id WHERE id = r.id;
    counter := counter + 1;
  END LOOP;
END $$; 
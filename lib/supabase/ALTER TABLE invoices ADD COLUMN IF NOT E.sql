ALTER TABLE invoices ADD COLUMN IF NOT EXISTS manufacturer_name TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS manufacturer_address TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS manufacturer_gst TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS manufacturer_phone TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS manufacturer_email TEXT;
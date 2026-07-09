-- Add missing columns to invoices table for invoice generation feature

-- Basic Invoice Fields
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS iec_code TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS po_number TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS other_references TEXT;

-- Terms & Conditions
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS incoterm TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_terms TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pre_carriage_by TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS place_of_receipt TEXT;

-- Shipping Details
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vessel_flight_no TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS port_of_loading TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS port_of_discharge TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS final_destination TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS country_of_origin TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS country_of_final_destination TEXT;

-- Manufacturer/Exporter Details
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS manufacturer_name TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS manufacturer_address TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS manufacturer_gst TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS manufacturer_phone TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS manufacturer_email TEXT;

-- Buyer Details
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_name TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_company TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_address TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_gst TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_phone TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_email TEXT;

-- Ship To Details
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ship_to_name TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ship_to_company TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ship_to_address TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ship_to_phone TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ship_to_email TEXT;

-- Carrier & Container Details
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS container_no TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS hs_code TEXT;

-- Invoice Items & Totals
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_quantity INTEGER DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_cartons INTEGER DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS gross_weight NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS net_weight NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_cbm NUMERIC(10, 3) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_amount NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_in_words TEXT;

-- Notes
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes_2 TEXT;

-- Status & Tracking
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Email OTP Verification
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.user_otps (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	otp TEXT NOT NULL,
	purpose TEXT NOT NULL DEFAULT 'email_verification',
	expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
	created_at TIMESTAMPTZ DEFAULT now(),
	verified BOOLEAN DEFAULT FALSE,
	attempts INT DEFAULT 0
);

ALTER TABLE public.user_otps
	ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'email_verification';

CREATE INDEX IF NOT EXISTS idx_user_otps_user_id ON public.user_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_user_otps_otp ON public.user_otps(otp);
CREATE INDEX IF NOT EXISTS idx_user_otps_purpose ON public.user_otps(purpose);

NOTIFY pgrst, 'reload schema';

-- Setup Database Schema for QR Table
-- ===================================
-- This creates the "QR" table as specified by the user
-- Run this in Supabase SQL Editor

-- 1. Drop existing table if exists (optional - remove if you want to keep data)
-- DROP TABLE IF EXISTS public."QR" CASCADE;

-- 2. Create the QR table with auto-generated UUID for qr_token
CREATE TABLE public."QR" (
  id text not null,
  nama text null,
  qr_token text DEFAULT gen_random_uuid()::text UNIQUE,
  claimed boolean DEFAULT false,
  claimed_at text null,
  constraint qr_pkey primary key (id)
);

-- 3. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_qr_id ON public."QR"(id);
CREATE INDEX IF NOT EXISTS idx_qr_nama ON public."QR"(nama);
CREATE INDEX IF NOT EXISTS idx_qr_qr_token ON public."QR"(qr_token);
CREATE INDEX IF NOT EXISTS idx_qr_claimed ON public."QR"(claimed);

-- 4. Create Database Function (RPC) for Claim Konsumsi secara aman (Atomic)
-- This prevents race conditions when multiple scanners scan simultaneously
CREATE OR REPLACE FUNCTION claim_konsumsi(token TEXT)
RETURNS TABLE(success BOOLEAN, nama TEXT, message TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
    v_siswa RECORD;
BEGIN
    -- Check if token is a valid UUID format or just an ID
    -- First try to match by qr_token (UUID format)
    UPDATE public."QR"
    SET claimed = TRUE, claimed_at = NOW()::text
    WHERE qr_token = token AND (claimed = FALSE OR claimed IS NULL)
    RETURNING "QR".nama INTO v_siswa;

    IF FOUND THEN
        RETURN QUERY SELECT TRUE, v_siswa.nama, 'Konsumsi berhasil dicatat'::TEXT;
    END IF;

    -- If not found by qr_token, try matching by id (student ID)
    UPDATE public."QR"
    SET claimed = TRUE, claimed_at = NOW()::text
    WHERE id = token AND (claimed = FALSE OR claimed IS NULL)
    RETURNING "QR".nama INTO v_siswa;

    IF FOUND THEN
        RETURN QUERY SELECT TRUE, v_siswa.nama, 'Konsumsi berhasil dicatat'::TEXT;
    END IF;

    -- Check if already claimed by qr_token
    SELECT "QR".nama INTO v_siswa 
    FROM public."QR" 
    WHERE "QR".qr_token = token AND claimed = TRUE;

    IF FOUND THEN
        RETURN QUERY SELECT FALSE, v_siswa.nama, 'Konsumsi sudah diambil sebelumnya!'::TEXT;
    END IF;

    -- Check if already claimed by id
    SELECT "QR".nama INTO v_siswa 
    FROM public."QR" 
    WHERE "QR".id = token AND claimed = TRUE;

    IF FOUND THEN
        RETURN QUERY SELECT FALSE, v_siswa.nama, 'Konsumsi sudah diambil sebelumnya!'::TEXT;
    END IF;

    -- Not found at all
    RETURN QUERY SELECT FALSE, ''::TEXT, 'QR Code / ID tidak valid!'::TEXT;
END;
$$;

-- 5. Optional: Enable Row Level Security (RLS)
-- Uncomment if you want to enable RLS policies
-- ALTER TABLE public."QR" ENABLE ROW LEVEL SECURITY;

-- 6. Optional: Create RLS Policies for anon access
-- These policies allow public read/write access (suitable for event apps)
-- CREATE POLICY "Allow public select"
-- ON public."QR"
-- FOR SELECT
-- TO anon
-- USING (true);

-- CREATE POLICY "Allow public insert"
-- ON public."QR"
-- FOR INSERT
-- TO anon
-- WITH CHECK (true);

-- CREATE POLICY "Allow public update"
-- ON public."QR"
-- FOR UPDATE
-- TO anon
-- USING (true);

-- ========================================
-- Usage Instructions:
-- ========================================
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Go to Settings > API to get your Project URL and anon key
-- 3. Update your .env file with those credentials
-- 4. Run: node scripts/generate-env.mjs
-- 5. Use admin.html to upload CSV data (format: id,nama)
-- 6. The qr_token will be auto-generated for each row on insert
-- 7. Use scan.html to scan QR codes and mark as claimed

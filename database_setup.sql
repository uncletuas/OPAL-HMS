-- OPAL Hospital Management System - Database Setup
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- Create the KV store table for data persistence
CREATE TABLE IF NOT EXISTS kv_store_a210bd47 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

-- Enable Row Level Security (RLS) if needed
-- ALTER TABLE kv_store_a210bd47 ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow authenticated users to access the KV store
-- (Adjust as needed based on your security requirements)
-- CREATE POLICY "Allow authenticated access to kv_store" ON kv_store_a210bd47
--   FOR ALL USING (auth.role() = 'authenticated');

-- Optional: Add an index for better performance on prefix searches
CREATE INDEX IF NOT EXISTS idx_kv_store_key_prefix ON kv_store_a210bd47 (key);

-- Verify the table was created
SELECT 'KV Store table created successfully' as status;
-- Migration: Add missing created_by columns to tables
-- This migration adds the created_by column to tables that are missing it
-- to ensure proper tracking of who created each record

-- Add created_by column to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- Add created_by column to suppliers table  
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- Add created_by column to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- Add created_by column to locations table
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- Update existing records to set created_by to the first admin user (ID: 1)
-- This is a one-time operation for existing data
UPDATE categories SET created_by = 1 WHERE created_by IS NULL;
UPDATE suppliers SET created_by = 1 WHERE created_by IS NULL;
UPDATE customers SET created_by = 1 WHERE created_by IS NULL;
UPDATE locations SET created_by = 1 WHERE created_by IS NULL;

-- Add comments to document the purpose of these columns
COMMENT ON COLUMN categories.created_by IS 'User ID who created this category';
COMMENT ON COLUMN suppliers.created_by IS 'User ID who created this supplier';
COMMENT ON COLUMN customers.created_by IS 'User ID who created this customer';
COMMENT ON COLUMN locations.created_by IS 'User ID who created this location';

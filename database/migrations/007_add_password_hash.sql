-- =====================================================
-- Serrano Tex Inventory Management System
-- Database Migration: Add Password Hash Field
-- Version: 1.0.1
-- Created: 2025-01-31
-- =====================================================

-- Add password_hash column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add comment to document the purpose of this column
COMMENT ON COLUMN users.password_hash IS 'Hashed password for user authentication';

-- Update existing users with a default hashed password (for demo purposes)
-- In production, you would require users to reset their passwords
UPDATE users 
SET password_hash = encode(digest('password123' || 'salt_key_2024', 'sha256'), 'hex')
WHERE password_hash IS NULL;

-- Make password_hash NOT NULL after setting default values
ALTER TABLE users 
ALTER COLUMN password_hash SET NOT NULL;

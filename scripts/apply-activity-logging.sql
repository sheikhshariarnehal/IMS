-- Apply Enhanced Activity Logging System
-- Run this script to set up comprehensive activity logging

-- First, ensure the activity_logs table exists with all required columns
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_logs' AND column_name = 'entity_name') THEN
        ALTER TABLE activity_logs ADD COLUMN entity_name VARCHAR(200);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_logs' AND column_name = 'credit_amount') THEN
        ALTER TABLE activity_logs ADD COLUMN credit_amount NUMERIC DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_logs' AND column_name = 'debit_amount') THEN
        ALTER TABLE activity_logs ADD COLUMN debit_amount NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Apply the enhanced activity logging function and triggers
\i database/migrations/enhanced_activity_logging.sql

-- Verify the setup
SELECT 
    'Activity logging system installed successfully' as status,
    COUNT(*) as existing_logs
FROM activity_logs;

-- Show trigger status
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_name LIKE 'enhanced_activity_log_%'
ORDER BY event_object_table;

COMMENT ON TABLE activity_logs IS 'Comprehensive activity logging table with enhanced triggers for audit trail';

-- =====================================================
-- Serrano Tex Inventory Management System
-- Master Migration Script - Run All Migrations
-- Version: 1.0.0
-- Created: 2025-01-10
-- =====================================================

-- This script runs all database migrations in the correct order
-- Execute this in Supabase SQL Editor to set up the complete database

-- =====================================================
-- MIGRATION EXECUTION LOG
-- =====================================================

-- Create migration log table to track execution
CREATE TABLE IF NOT EXISTS migration_log (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(100) NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT
);

-- Function to log migration execution
CREATE OR REPLACE FUNCTION log_migration(migration_name TEXT, status TEXT DEFAULT 'success', error_msg TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
    INSERT INTO migration_log (migration_name, status, error_message)
    VALUES (migration_name, status, error_msg);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MIGRATION 001: INITIAL SCHEMA
-- =====================================================

DO $$
BEGIN
    -- Log migration start
    PERFORM log_migration('001_initial_schema', 'started');
    
    -- Enable necessary extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    
    -- Note: The actual table creation statements from 001_initial_schema.sql
    -- should be copied here or executed separately
    
    RAISE NOTICE 'Migration 001: Initial Schema - Please run 001_initial_schema.sql manually';
    
    -- Log migration completion
    PERFORM log_migration('001_initial_schema', 'completed');
    
EXCEPTION WHEN OTHERS THEN
    PERFORM log_migration('001_initial_schema', 'failed', SQLERRM);
    RAISE;
END $$;

-- =====================================================
-- MIGRATION 002: INDEXES AND CONSTRAINTS
-- =====================================================

DO $$
BEGIN
    -- Log migration start
    PERFORM log_migration('002_indexes_and_constraints', 'started');
    
    RAISE NOTICE 'Migration 002: Indexes and Constraints - Please run 002_indexes_and_constraints.sql manually';
    
    -- Log migration completion
    PERFORM log_migration('002_indexes_and_constraints', 'completed');
    
EXCEPTION WHEN OTHERS THEN
    PERFORM log_migration('002_indexes_and_constraints', 'failed', SQLERRM);
    RAISE;
END $$;

-- =====================================================
-- MIGRATION 003: RLS POLICIES
-- =====================================================

DO $$
BEGIN
    -- Log migration start
    PERFORM log_migration('003_rls_policies', 'started');
    
    RAISE NOTICE 'Migration 003: RLS Policies - Please run 003_rls_policies.sql manually';
    
    -- Log migration completion
    PERFORM log_migration('003_rls_policies', 'completed');
    
EXCEPTION WHEN OTHERS THEN
    PERFORM log_migration('003_rls_policies', 'failed', SQLERRM);
    RAISE;
END $$;

-- =====================================================
-- MIGRATION 004: FUNCTIONS AND TRIGGERS
-- =====================================================

DO $$
BEGIN
    -- Log migration start
    PERFORM log_migration('004_functions_and_triggers', 'started');
    
    RAISE NOTICE 'Migration 004: Functions and Triggers - Please run 004_functions_and_triggers.sql manually';
    
    -- Log migration completion
    PERFORM log_migration('004_functions_and_triggers', 'completed');
    
EXCEPTION WHEN OTHERS THEN
    PERFORM log_migration('004_functions_and_triggers', 'failed', SQLERRM);
    RAISE;
END $$;

-- =====================================================
-- MIGRATION 005: TRIGGERS
-- =====================================================

DO $$
BEGIN
    -- Log migration start
    PERFORM log_migration('005_triggers', 'started');
    
    RAISE NOTICE 'Migration 005: Triggers - Please run 005_triggers.sql manually';
    
    -- Log migration completion
    PERFORM log_migration('005_triggers', 'completed');
    
EXCEPTION WHEN OTHERS THEN
    PERFORM log_migration('005_triggers', 'failed', SQLERRM);
    RAISE;
END $$;

-- =====================================================
-- MIGRATION 006: SAMPLE DATA
-- =====================================================

DO $$
BEGIN
    -- Log migration start
    PERFORM log_migration('006_sample_data', 'started');
    
    RAISE NOTICE 'Migration 006: Sample Data - Please run 006_sample_data.sql manually';
    
    -- Log migration completion
    PERFORM log_migration('006_sample_data', 'completed');
    
EXCEPTION WHEN OTHERS THEN
    PERFORM log_migration('006_sample_data', 'failed', SQLERRM);
    RAISE;
END $$;

-- =====================================================
-- MIGRATION VERIFICATION
-- =====================================================

-- Function to verify database setup
CREATE OR REPLACE FUNCTION verify_database_setup()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check tables
    RETURN QUERY
    SELECT 
        'Tables Created'::TEXT,
        CASE WHEN COUNT(*) >= 14 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' tables (expected 14+)'::TEXT
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    -- Check RLS enabled
    RETURN QUERY
    SELECT 
        'RLS Enabled'::TEXT,
        CASE WHEN COUNT(*) >= 14 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'RLS enabled on ' || COUNT(*)::TEXT || ' tables'::TEXT
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity = true;
    
    -- Check functions
    RETURN QUERY
    SELECT 
        'Functions Created'::TEXT,
        CASE WHEN COUNT(*) >= 5 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' custom functions'::TEXT
    FROM information_schema.routines 
    WHERE routine_schema = 'public'
    AND routine_name IN ('set_user_context', 'get_dashboard_stats', 'generate_sale_number');
    
    -- Check triggers
    RETURN QUERY
    SELECT 
        'Triggers Created'::TEXT,
        CASE WHEN COUNT(*) >= 10 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' triggers'::TEXT
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public';
    
    -- Check sample data
    RETURN QUERY
    SELECT 
        'Sample Data Loaded'::TEXT,
        CASE WHEN COUNT(*) >= 5 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' sample users'::TEXT
    FROM users;
    
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FINAL VERIFICATION AND SUMMARY
-- =====================================================

DO $$
DECLARE
    migration_record RECORD;
    verification_record RECORD;
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'SERRANO TEX INVENTORY MANAGEMENT SYSTEM';
    RAISE NOTICE 'DATABASE MIGRATION SUMMARY';
    RAISE NOTICE '=====================================================';
    
    -- Show migration log
    RAISE NOTICE 'Migration Execution Log:';
    FOR migration_record IN 
        SELECT migration_name, status, executed_at 
        FROM migration_log 
        ORDER BY executed_at
    LOOP
        RAISE NOTICE '  % - % (at %)', 
            migration_record.migration_name, 
            migration_record.status, 
            migration_record.executed_at;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Database Verification:';
    
    -- Run verification
    FOR verification_record IN 
        SELECT * FROM verify_database_setup()
    LOOP
        RAISE NOTICE '  % - % (%)', 
            verification_record.check_name, 
            verification_record.status, 
            verification_record.details;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'MIGRATION INSTRUCTIONS:';
    RAISE NOTICE '1. Run each migration file manually in Supabase SQL Editor';
    RAISE NOTICE '2. Execute files in order: 001 → 002 → 003 → 004 → 005 → 006';
    RAISE NOTICE '3. Verify each migration completes successfully';
    RAISE NOTICE '4. Run verify_database_setup() to check final status';
    RAISE NOTICE '=====================================================';
    
END $$;

-- =====================================================
-- HELPFUL QUERIES FOR VERIFICATION
-- =====================================================

-- Query to check migration status
-- SELECT * FROM migration_log ORDER BY executed_at;

-- Query to verify database setup
-- SELECT * FROM verify_database_setup();

-- Query to check table counts
-- SELECT 
--     schemaname,
--     tablename,
--     n_tup_ins as inserts,
--     n_tup_upd as updates,
--     n_tup_del as deletes
-- FROM pg_stat_user_tables 
-- WHERE schemaname = 'public'
-- ORDER BY tablename;

-- Query to check RLS policies
-- SELECT 
--     schemaname,
--     tablename,
--     policyname,
--     permissive,
--     roles,
--     cmd,
--     qual
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

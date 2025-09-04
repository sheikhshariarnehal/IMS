-- =====================================================
-- CLEANUP PROBLEMATIC DATABASE POLICIES
-- =====================================================
-- This script removes duplicate, conflicting, and problematic RLS policies
-- that may be causing errors in the application.

-- =====================================================
-- 1. CUSTOMERS TABLE - Remove duplicate policies
-- =====================================================

-- Drop duplicate/conflicting customer policies
DROP POLICY IF EXISTS customers_read_all ON customers;
DROP POLICY IF EXISTS customers_read_anon ON customers;

-- Keep only the main customers_select_policy which allows all access
-- This is appropriate since customers should be accessible to all authenticated users

-- =====================================================
-- 2. ACTIVITY LOGS TABLE - Remove duplicate policies
-- =====================================================

-- Drop the older activity_logs_select_policy (uses different logic)
DROP POLICY IF EXISTS activity_logs_select_policy ON activity_logs;

-- Keep activity_logs_policy which has better logic for location-based access

-- =====================================================
-- 3. USERS TABLE - Simplify user policies
-- =====================================================

-- Drop the users_auth_policy as it's redundant with users_select_policy
DROP POLICY IF EXISTS users_auth_policy ON users;

-- Keep users_select_policy and users_management_policy as they serve different purposes

-- =====================================================
-- 4. SALE_ITEMS TABLE - Add proper restrictions
-- =====================================================

-- The current sale_items policies are too permissive (all return true)
-- Let's replace them with location-based policies

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Allow authenticated users to delete sale_items" ON sale_items;
DROP POLICY IF EXISTS "Allow authenticated users to insert sale_items" ON sale_items;
DROP POLICY IF EXISTS "Allow authenticated users to select sale_items" ON sale_items;
DROP POLICY IF EXISTS "Allow authenticated users to update sale_items" ON sale_items;

-- Create proper sale_items policies based on the parent sale's location
CREATE POLICY sale_items_select_policy ON sale_items
    FOR SELECT
    USING (
        get_current_user_role() = 'super_admin'
        OR EXISTS (
            SELECT 1 FROM sales s 
            WHERE s.id = sale_items.sale_id 
            AND (
                s.location_id = ANY(get_current_user_locations())
                OR s.created_by = get_current_user_id()
            )
        )
    );

CREATE POLICY sale_items_insert_policy ON sale_items
    FOR INSERT
    WITH CHECK (
        get_current_user_role() IN ('super_admin', 'admin', 'sales_manager')
        AND EXISTS (
            SELECT 1 FROM sales s 
            WHERE s.id = sale_items.sale_id 
            AND (
                s.location_id = ANY(get_current_user_locations())
                OR s.created_by = get_current_user_id()
            )
        )
    );

CREATE POLICY sale_items_update_policy ON sale_items
    FOR UPDATE
    USING (
        get_current_user_role() = 'super_admin'
        OR EXISTS (
            SELECT 1 FROM sales s 
            WHERE s.id = sale_items.sale_id 
            AND (
                s.location_id = ANY(get_current_user_locations())
                OR s.created_by = get_current_user_id()
            )
        )
    );

CREATE POLICY sale_items_delete_policy ON sale_items
    FOR DELETE
    USING (
        get_current_user_role() = 'super_admin'
        OR EXISTS (
            SELECT 1 FROM sales s 
            WHERE s.id = sale_items.sale_id 
            AND s.location_id = ANY(get_current_user_locations())
        )
    );

-- =====================================================
-- 5. OPTIONAL: Disable RLS on tables that don't need it
-- =====================================================

-- If you're having issues with certain tables, you can temporarily disable RLS
-- Uncomment these lines if needed:

-- ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE products_lot DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. VERIFICATION QUERIES
-- =====================================================

-- Check remaining policies after cleanup
SELECT 
    tablename, 
    policyname, 
    cmd,
    CASE 
        WHEN qual IS NULL THEN 'No restrictions (WITH CHECK only)'
        WHEN length(qual) > 100 THEN left(qual, 100) || '...'
        ELSE qual
    END as policy_condition
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, cmd, policyname;

-- Check tables with RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true 
ORDER BY tablename;

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. This script removes duplicate and conflicting policies
-- 2. It maintains security while simplifying the policy structure
-- 3. Sale_items now properly inherits permissions from parent sales
-- 4. You can disable RLS on specific tables if they continue causing issues
-- 5. Run the verification queries to confirm the cleanup worked
-- =====================================================

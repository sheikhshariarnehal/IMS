-- =====================================================
-- Serrano Tex Inventory Management System
-- Database Migration: Row Level Security Policies
-- Version: 1.0.0
-- Created: 2025-01-10
-- =====================================================

-- =====================================================
-- 3. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Function to get current user ID from context
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(
        current_setting('app.current_user_id', true)::integer,
        0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = get_current_user_id() 
        AND role = 'super_admin' 
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's assigned locations
CREATE OR REPLACE FUNCTION get_user_locations()
RETURNS INTEGER[] AS $$
DECLARE
    user_locations INTEGER[];
BEGIN
    SELECT ARRAY[assigned_location_id] INTO user_locations
    FROM users 
    WHERE id = get_current_user_id() 
    AND status = 'active';
    
    RETURN COALESCE(user_locations, ARRAY[]::INTEGER[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to location
CREATE OR REPLACE FUNCTION has_location_access(location_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    -- Super admin has access to all locations
    IF is_super_admin() THEN
        RETURN TRUE;
    END IF;
    
    -- Check if location is in user's assigned locations
    RETURN location_id = ANY(get_user_locations());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can view their own record and super admins can view all
CREATE POLICY users_select_policy ON users
    FOR SELECT
    USING (
        id = get_current_user_id() OR 
        is_super_admin()
    );

-- Only super admins can insert users
CREATE POLICY users_insert_policy ON users
    FOR INSERT
    WITH CHECK (is_super_admin());

-- Users can update their own profile, super admins can update all
CREATE POLICY users_update_policy ON users
    FOR UPDATE
    USING (
        id = get_current_user_id() OR 
        is_super_admin()
    );

-- Only super admins can delete users
CREATE POLICY users_delete_policy ON users
    FOR DELETE
    USING (is_super_admin());

-- =====================================================
-- LOCATIONS TABLE POLICIES
-- =====================================================

-- Users can view locations they have access to
CREATE POLICY locations_select_policy ON locations
    FOR SELECT
    USING (
        is_super_admin() OR 
        has_location_access(id)
    );

-- Only super admins can manage locations
CREATE POLICY locations_insert_policy ON locations
    FOR INSERT
    WITH CHECK (is_super_admin());

CREATE POLICY locations_update_policy ON locations
    FOR UPDATE
    USING (is_super_admin());

CREATE POLICY locations_delete_policy ON locations
    FOR DELETE
    USING (is_super_admin());

-- =====================================================
-- CATEGORIES TABLE POLICIES
-- =====================================================

-- All authenticated users can view categories
CREATE POLICY categories_select_policy ON categories
    FOR SELECT
    TO authenticated
    USING (true);

-- Admins and super admins can manage categories
CREATE POLICY categories_insert_policy ON categories
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = get_current_user_id() 
            AND role IN ('super_admin', 'admin') 
            AND status = 'active'
        )
    );

CREATE POLICY categories_update_policy ON categories
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = get_current_user_id() 
            AND role IN ('super_admin', 'admin') 
            AND status = 'active'
        )
    );

CREATE POLICY categories_delete_policy ON categories
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = get_current_user_id() 
            AND role IN ('super_admin', 'admin') 
            AND status = 'active'
        )
    );

-- =====================================================
-- SUPPLIERS TABLE POLICIES
-- =====================================================

-- All authenticated users can view suppliers
CREATE POLICY suppliers_select_policy ON suppliers
    FOR SELECT
    TO authenticated
    USING (true);

-- Admins and super admins can manage suppliers
CREATE POLICY suppliers_insert_policy ON suppliers
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = get_current_user_id() 
            AND role IN ('super_admin', 'admin') 
            AND status = 'active'
        )
    );

CREATE POLICY suppliers_update_policy ON suppliers
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = get_current_user_id() 
            AND role IN ('super_admin', 'admin') 
            AND status = 'active'
        )
    );

CREATE POLICY suppliers_delete_policy ON suppliers
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = get_current_user_id() 
            AND role IN ('super_admin', 'admin') 
            AND status = 'active'
        )
    );

-- =====================================================
-- PRODUCTS TABLE POLICIES
-- =====================================================

-- Users can view products from their assigned locations
CREATE POLICY products_select_policy ON products
    FOR SELECT
    USING (
        is_super_admin() OR 
        has_location_access(location_id)
    );

-- Sales managers and above can add products to their locations
CREATE POLICY products_insert_policy ON products
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = get_current_user_id() 
            AND role IN ('super_admin', 'admin', 'sales_manager') 
            AND status = 'active'
        ) AND (
            is_super_admin() OR 
            has_location_access(location_id)
        )
    );

-- Users can update products in their locations
CREATE POLICY products_update_policy ON products
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = get_current_user_id() 
            AND role IN ('super_admin', 'admin', 'sales_manager') 
            AND status = 'active'
        ) AND (
            is_super_admin() OR 
            has_location_access(location_id)
        )
    );

-- Only admins and super admins can delete products
CREATE POLICY products_delete_policy ON products
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = get_current_user_id() 
            AND role IN ('super_admin', 'admin') 
            AND status = 'active'
        )
    );

-- =====================================================
-- CUSTOMERS TABLE POLICIES
-- =====================================================

-- All authenticated users can view customers
CREATE POLICY customers_select_policy ON customers
    FOR SELECT
    TO authenticated
    USING (true);

-- Sales managers and above can manage customers
CREATE POLICY customers_insert_policy ON customers
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = get_current_user_id() 
            AND role IN ('super_admin', 'admin', 'sales_manager') 
            AND status = 'active'
        )
    );

CREATE POLICY customers_update_policy ON customers
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = get_current_user_id() 
            AND role IN ('super_admin', 'admin', 'sales_manager') 
            AND status = 'active'
        )
    );

CREATE POLICY customers_delete_policy ON customers
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = get_current_user_id()
            AND role IN ('super_admin', 'admin')
            AND status = 'active'
        )
    );

-- =====================================================
-- SALES TABLE POLICIES
-- =====================================================

-- Users can view sales from their assigned locations
CREATE POLICY sales_select_policy ON sales
    FOR SELECT
    USING (
        is_super_admin() OR
        has_location_access(location_id)
    );

-- Sales managers and above can create sales in their locations
CREATE POLICY sales_insert_policy ON sales
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = get_current_user_id()
            AND role IN ('super_admin', 'admin', 'sales_manager')
            AND status = 'active'
        ) AND (
            is_super_admin() OR
            has_location_access(location_id)
        )
    );

-- Users can update sales they created or in their locations
CREATE POLICY sales_update_policy ON sales
    FOR UPDATE
    USING (
        (created_by = get_current_user_id() OR is_super_admin()) AND
        (is_super_admin() OR has_location_access(location_id))
    );

-- Only admins and super admins can delete sales
CREATE POLICY sales_delete_policy ON sales
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = get_current_user_id()
            AND role IN ('super_admin', 'admin')
            AND status = 'active'
        )
    );

-- =====================================================
-- ACTIVITY LOGS POLICIES
-- =====================================================

-- Allow anonymous and authenticated users to insert activity logs
CREATE POLICY activity_logs_insert_policy ON activity_logs
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Users can view their own activity logs, super admins can view all
CREATE POLICY activity_logs_select_policy ON activity_logs
    FOR SELECT
    TO anon, authenticated
    USING (
        user_id = get_current_user_id() OR
        is_super_admin()
    );

-- =====================================================
-- NOTIFICATIONS POLICIES
-- =====================================================

-- Users can view their own notifications
CREATE POLICY notifications_select_policy ON notifications
    FOR SELECT
    USING (user_id = get_current_user_id());

-- System can insert notifications for any user
CREATE POLICY notifications_insert_policy ON notifications
    FOR INSERT
    WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY notifications_update_policy ON notifications
    FOR UPDATE
    USING (user_id = get_current_user_id());

-- =====================================================
-- REMAINING TABLE POLICIES (SIMPLIFIED)
-- =====================================================

-- Product lots - follow product location rules
CREATE POLICY product_lots_policy ON product_lots
    FOR ALL
    USING (
        is_super_admin() OR
        has_location_access(location_id)
    );

-- Sale items - follow sale location rules
CREATE POLICY sale_items_policy ON sale_items
    FOR ALL
    USING (
        is_super_admin() OR
        EXISTS (
            SELECT 1 FROM sales
            WHERE id = sale_id
            AND has_location_access(location_id)
        )
    );

-- Payments - follow sale location rules
CREATE POLICY payments_policy ON payments
    FOR ALL
    USING (
        is_super_admin() OR
        EXISTS (
            SELECT 1 FROM sales
            WHERE id = sale_id
            AND has_location_access(location_id)
        )
    );

-- Transfers - users can see transfers involving their locations
CREATE POLICY transfers_policy ON transfers
    FOR ALL
    USING (
        is_super_admin() OR
        has_location_access(from_location_id) OR
        has_location_access(to_location_id)
    );

-- Sample tracking - follow product location rules
CREATE POLICY sample_tracking_policy ON sample_tracking
    FOR ALL
    USING (
        is_super_admin() OR
        has_location_access(location_id)
    );

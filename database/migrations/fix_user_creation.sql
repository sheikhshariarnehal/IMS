-- Fix for user creation RLS issue
-- Temporary fix: Make RLS policies more permissive for user creation

-- Drop existing conflicting policies
DROP POLICY IF EXISTS users_insert_policy ON users;
DROP POLICY IF EXISTS users_create_policy ON users;

-- Create a single, more permissive insert policy
CREATE POLICY users_insert_policy ON users
    FOR INSERT TO public
    WITH CHECK (
        -- Allow if user context is set and user is super admin
        (get_current_user_id() > 0 AND is_super_admin())
        OR
        -- Allow if no context is set but we're creating with a super admin as creator
        (get_current_user_id() = 0 AND created_by IN (
            SELECT id FROM users WHERE role = 'super_admin' AND status = 'active'
        ))
    );

-- Alternative: Create a simpler bypass function for user creation
CREATE OR REPLACE FUNCTION bypass_rls_create_user(
    p_name VARCHAR(100),
    p_email VARCHAR(100),
    p_phone VARCHAR(20),
    p_password_hash VARCHAR(255),
    p_role user_role,
    p_assigned_location_id INTEGER,
    p_permissions JSONB,
    p_created_by INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id INTEGER;
    current_user_role TEXT;
BEGIN
    -- Verify the calling user is a super admin
    SELECT get_current_user_role() INTO current_user_role;
    
    IF current_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Access denied: Only super admins can create users';
    END IF;
    
    -- Insert user with SECURITY DEFINER privileges (bypasses RLS)
    INSERT INTO users (
        name,
        email,
        phone,
        password_hash,
        role,
        assigned_location_id,
        permissions,
        status,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        p_name,
        p_email,
        p_phone,
        p_password_hash,
        p_role,
        p_assigned_location_id,
        p_permissions,
        'active',
        p_created_by,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ) RETURNING id INTO new_user_id;
    
    RETURN new_user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION bypass_rls_create_user(VARCHAR(100), VARCHAR(100), VARCHAR(20), VARCHAR(255), user_role, INTEGER, JSONB, INTEGER) TO public;

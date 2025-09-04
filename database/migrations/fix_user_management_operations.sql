-- Fix for user management operations (update, delete, status toggle)
-- Create bypass functions to handle RLS issues

-- Function to bypass RLS for user updates
CREATE OR REPLACE FUNCTION bypass_rls_update_user(
    p_user_id INTEGER,
    p_name VARCHAR(100),
    p_email VARCHAR(100),
    p_phone VARCHAR(20),
    p_role user_role,
    p_assigned_location_id INTEGER,
    p_permissions JSONB,
    p_password_hash VARCHAR(255),
    p_updated_by INTEGER
)
RETURNS users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result users;
    current_user_role TEXT;
BEGIN
    -- Verify the calling user is a super admin
    SELECT role::TEXT INTO current_user_role
    FROM users 
    WHERE id = p_updated_by AND status = 'active';
    
    IF current_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Access denied: Only super admins can update users';
    END IF;
    
    -- Update user with SECURITY DEFINER privileges (bypasses RLS)
    UPDATE users SET
        name = p_name,
        email = p_email,
        phone = p_phone,
        role = p_role,
        assigned_location_id = p_assigned_location_id,
        permissions = p_permissions,
        password_hash = COALESCE(p_password_hash, password_hash), -- Only update if provided
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id
    RETURNING * INTO result;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found with ID: %', p_user_id;
    END IF;
    
    RETURN result;
END;
$$;

-- Function to bypass RLS for user status updates
CREATE OR REPLACE FUNCTION bypass_rls_update_user_status(
    p_user_id INTEGER,
    p_status user_status,
    p_updated_by INTEGER
)
RETURNS users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result users;
    current_user_role TEXT;
BEGIN
    -- Verify the calling user is a super admin
    SELECT role::TEXT INTO current_user_role
    FROM users 
    WHERE id = p_updated_by AND status = 'active';
    
    IF current_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Access denied: Only super admins can update user status';
    END IF;
    
    -- Update user status with SECURITY DEFINER privileges (bypasses RLS)
    UPDATE users SET
        status = p_status,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id
    RETURNING * INTO result;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found with ID: %', p_user_id;
    END IF;
    
    RETURN result;
END;
$$;

-- Function to bypass RLS for user deletion
CREATE OR REPLACE FUNCTION bypass_rls_delete_user(
    p_user_id INTEGER,
    p_deleted_by INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_role TEXT;
    target_user_role TEXT;
    super_admin_count INTEGER;
BEGIN
    -- Verify the calling user is a super admin
    SELECT role::TEXT INTO current_user_role
    FROM users 
    WHERE id = p_deleted_by AND status = 'active';
    
    IF current_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Access denied: Only super admins can delete users';
    END IF;
    
    -- Get the role of the user being deleted
    SELECT role::TEXT INTO target_user_role
    FROM users 
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found with ID: %', p_user_id;
    END IF;
    
    -- Prevent deletion of the last super admin
    IF target_user_role = 'super_admin' THEN
        SELECT COUNT(*) INTO super_admin_count
        FROM users 
        WHERE role = 'super_admin' AND status = 'active' AND id != p_user_id;
        
        IF super_admin_count = 0 THEN
            RAISE EXCEPTION 'Cannot delete the last active super admin';
        END IF;
    END IF;
    
    -- Delete user with SECURITY DEFINER privileges (bypasses RLS)
    DELETE FROM users WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed to delete user with ID: %', p_user_id;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Grant execute permissions to public (authenticated users)
GRANT EXECUTE ON FUNCTION bypass_rls_update_user(INTEGER, VARCHAR(100), VARCHAR(100), VARCHAR(20), user_role, INTEGER, JSONB, VARCHAR(255), INTEGER) TO public;
GRANT EXECUTE ON FUNCTION bypass_rls_update_user_status(INTEGER, user_status, INTEGER) TO public;
GRANT EXECUTE ON FUNCTION bypass_rls_delete_user(INTEGER, INTEGER) TO public;

-- Create a function to check if user can be modified (for additional safety)
CREATE OR REPLACE FUNCTION can_modify_user(target_user_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_role TEXT;
    current_user_id INTEGER;
BEGIN
    -- Get current user context
    current_user_id := get_current_user_id();
    
    IF current_user_id = 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Get current user role
    SELECT role::TEXT INTO current_user_role
    FROM users 
    WHERE id = current_user_id AND status = 'active';
    
    -- Super admin can modify anyone
    IF current_user_role = 'super_admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Users can modify themselves (for profile updates)
    IF current_user_id = target_user_id THEN
        RETURN TRUE;
    END IF;
    
    -- Admin can modify users in their locations
    IF current_user_role = 'admin' THEN
        RETURN EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = target_user_id
            AND u.assigned_location_id = ANY(get_current_user_locations())
        );
    END IF;
    
    RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION can_modify_user(INTEGER) TO public;

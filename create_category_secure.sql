-- Create a secure function to create categories for admin users
CREATE OR REPLACE FUNCTION create_category_secure(
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_created_by INTEGER
)
RETURNS categories
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result categories;
    user_role TEXT;
BEGIN
    -- Debug logging
    RAISE NOTICE 'Creating category with name: %, description: %, created_by: %', 
        p_name, p_description, p_created_by;
    
    -- Get user role
    SELECT role::TEXT INTO user_role
    FROM users 
    WHERE id = p_created_by AND status = 'active';
    
    -- Check if user exists and is active
    IF user_role IS NULL THEN
        RAISE EXCEPTION 'User % not found or inactive', p_created_by;
    END IF;
    
    -- Check permissions (admin or super_admin can create categories)
    IF user_role NOT IN ('super_admin', 'admin') THEN
        RAISE EXCEPTION 'User with role % does not have permission to create categories', user_role;
    END IF;
    
    -- Set user context
    PERFORM set_config('app.current_user_id', p_created_by::text, false);
    
    -- Validate required fields
    IF p_name IS NULL OR trim(p_name) = '' THEN
        RAISE EXCEPTION 'Category name is required';
    END IF;
    
    -- Create the category
    INSERT INTO categories (
        name,
        description,
        created_by
    ) VALUES (
        trim(p_name),
        NULLIF(trim(p_description), ''),
        p_created_by
    ) RETURNING * INTO result;
    
    RAISE NOTICE 'Category created successfully with ID: %', result.id;
    RETURN result;
END;
$$;

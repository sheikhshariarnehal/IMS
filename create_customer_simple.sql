-- Create a simpler secure function to create customers with individual parameters
CREATE OR REPLACE FUNCTION create_customer_simple(
    p_name TEXT,
    p_email TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_company_name TEXT DEFAULT NULL,
    p_delivery_address TEXT DEFAULT NULL,
    p_customer_type customer_type DEFAULT 'regular',
    p_total_purchases DECIMAL DEFAULT 0,
    p_total_due DECIMAL DEFAULT 0,
    p_red_list_status BOOLEAN DEFAULT false,
    p_fixed_coupon TEXT DEFAULT NULL,
    p_profile_picture TEXT DEFAULT NULL,
    p_created_by INTEGER
)
RETURNS customers
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result customers;
    user_role TEXT;
BEGIN
    -- Debug logging
    RAISE NOTICE 'Creating customer with name: %, email: %, phone: %, created_by: %', 
        p_name, p_email, p_phone, p_created_by;
    
    -- Get user role
    SELECT role::TEXT INTO user_role
    FROM users 
    WHERE id = p_created_by AND status = 'active';
    
    -- Check if user exists and is active
    IF user_role IS NULL THEN
        RAISE EXCEPTION 'User % not found or inactive', p_created_by;
    END IF;
    
    -- Check permissions (admin, sales_manager, or super_admin can create customers)
    IF user_role NOT IN ('super_admin', 'admin', 'sales_manager') THEN
        RAISE EXCEPTION 'User with role % does not have permission to create customers', user_role;
    END IF;
    
    -- Set user context
    PERFORM set_config('app.current_user_id', p_created_by::text, false);
    
    -- Validate required fields
    IF p_name IS NULL OR trim(p_name) = '' THEN
        RAISE EXCEPTION 'Customer name is required';
    END IF;
    
    -- Create the customer
    INSERT INTO customers (
        name,
        email,
        phone,
        address,
        company_name,
        delivery_address,
        customer_type,
        total_purchases,
        total_due,
        red_list_status,
        fixed_coupon,
        profile_picture,
        created_by
    ) VALUES (
        trim(p_name),
        NULLIF(trim(p_email), ''),
        NULLIF(trim(p_phone), ''),
        NULLIF(trim(p_address), ''),
        NULLIF(trim(p_company_name), ''),
        NULLIF(trim(p_delivery_address), ''),
        p_customer_type,
        COALESCE(p_total_purchases, 0),
        COALESCE(p_total_due, 0),
        COALESCE(p_red_list_status, false),
        NULLIF(trim(p_fixed_coupon), ''),
        NULLIF(trim(p_profile_picture), ''),
        p_created_by
    ) RETURNING * INTO result;
    
    RAISE NOTICE 'Customer created successfully with ID: %', result.id;
    RETURN result;
END;
$$;

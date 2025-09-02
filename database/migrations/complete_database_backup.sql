-- =====================================================
-- COMPLETE DATABASE BACKUP FOR IMS-2.0 PROJECT
-- Generated on: 2025-01-02
-- Source: Supabase Project ID: dbwoaiihjffzfqsozgjn
-- =====================================================
-- This file contains the complete database schema including:
-- 1. Custom Types (ENUMs)
-- 2. Tables with all constraints
-- 3. Indexes
-- 4. Functions
-- 5. Triggers
-- 6. Views
-- 7. RLS Policies
-- 8. Extensions
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CUSTOM TYPES (ENUMs)
-- =====================================================

-- Customer Type Enum
CREATE TYPE customer_type AS ENUM ('vip', 'wholesale', 'regular');

-- Location Status Enum
CREATE TYPE location_status AS ENUM ('active', 'inactive');

-- Location Type Enum
CREATE TYPE location_type AS ENUM ('warehouse', 'showroom');

-- Notification Category Enum
CREATE TYPE notification_category AS ENUM ('inventory', 'sales', 'customers', 'samples', 'payments', 'system', 'security');

-- Notification Priority Enum
CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Notification Type Enum
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'error', 'success');

-- Payment Method Enum
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'bank_transfer', 'mobile_banking');

-- Payment Status Enum
CREATE TYPE payment_status AS ENUM ('paid', 'partial', 'pending');

-- Product Status Enum
CREATE TYPE product_status AS ENUM ('active', 'slow', 'inactive');

-- Report Format Enum
CREATE TYPE report_format AS ENUM ('pdf', 'excel', 'csv', 'json');

-- Report Schedule Enum
CREATE TYPE report_schedule AS ENUM ('daily', 'weekly', 'monthly', 'quarterly');

-- Report Type Enum
CREATE TYPE report_type AS ENUM ('sales', 'inventory', 'customer', 'financial', 'sample');

-- Sale Payment Status Enum
CREATE TYPE sale_payment_status AS ENUM ('paid', 'partial', 'pending', 'overdue');

-- Sale Status Enum
CREATE TYPE sale_status AS ENUM ('draft', 'finalized', 'cancelled');

-- Sample Status Enum
CREATE TYPE sample_status AS ENUM ('requested', 'prepared', 'delivered', 'returned', 'converted', 'lost', 'expired');

-- Setting Type Enum
CREATE TYPE setting_type AS ENUM ('string', 'number', 'boolean', 'json');

-- Supplier Status Enum
CREATE TYPE supplier_status AS ENUM ('active', 'inactive');

-- Transfer Status Enum
CREATE TYPE transfer_status AS ENUM ('requested', 'approved', 'in_transit', 'completed', 'rejected');

-- User Role Enum
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'sales_manager', 'investor');

-- User Status Enum
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

-- =====================================================
-- TABLES
-- =====================================================

-- Categories Table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER
);

-- Locations Table
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type location_type NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(50),
    capacity INTEGER,
    manager_name VARCHAR(100),
    manager_phone VARCHAR(20),
    status location_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER
);

-- Suppliers Table
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    company_name VARCHAR(150) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    payment_terms TEXT,
    status supplier_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER
);

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    permissions JSONB,
    assigned_location_id INTEGER,
    can_add_sales_managers BOOLEAN DEFAULT FALSE,
    status user_status DEFAULT 'active',
    profile_picture VARCHAR(255),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMPTZ,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    created_by INTEGER
);

-- Customers Table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    company_name VARCHAR(150),
    delivery_address TEXT,
    customer_type customer_type DEFAULT 'regular',
    total_purchases NUMERIC DEFAULT 0,
    total_due NUMERIC DEFAULT 0,
    last_purchase_date DATE,
    red_list_status BOOLEAN DEFAULT FALSE,
    red_list_since DATE,
    fixed_coupon VARCHAR(20),
    profile_picture VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER
);

-- Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    product_code VARCHAR(50) NOT NULL UNIQUE,
    category_id INTEGER,
    description TEXT,
    purchase_price NUMERIC,
    selling_price NUMERIC,
    per_meter_price NUMERIC,
    supplier_id INTEGER,
    location_id INTEGER,
    minimum_threshold INTEGER DEFAULT 100,
    current_stock NUMERIC DEFAULT 0,
    total_purchased NUMERIC DEFAULT 0,
    total_sold NUMERIC DEFAULT 0,
    wastage_status BOOLEAN DEFAULT FALSE,
    product_status product_status DEFAULT 'active',
    images JSONB,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_sold TIMESTAMP,
    current_lot_number INTEGER DEFAULT 0,
    unit_of_measurement VARCHAR(50) DEFAULT 'meter',
    total_stock NUMERIC DEFAULT 0,
    last_lot_no INTEGER DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (location_id) REFERENCES locations(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Products Lot Table
CREATE TABLE products_lot (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    lot_number INTEGER NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 0,
    purchase_price NUMERIC NOT NULL,
    selling_price NUMERIC NOT NULL,
    supplier_id INTEGER,
    location_id INTEGER,
    received_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    per_unit_price NUMERIC DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (location_id) REFERENCES locations(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Sales Table
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    sale_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INTEGER,
    subtotal NUMERIC NOT NULL,
    discount_amount NUMERIC DEFAULT 0,
    tax_amount NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    paid_amount NUMERIC DEFAULT 0,
    due_amount NUMERIC DEFAULT 0,
    due_date DATE,
    payment_method payment_method,
    payment_status sale_payment_status DEFAULT 'pending',
    sale_status sale_status DEFAULT 'draft',
    delivery_person VARCHAR(100),
    delivery_photo VARCHAR(255),
    location_id INTEGER,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (location_id) REFERENCES locations(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Sale Items Table
CREATE TABLE sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER,
    product_id INTEGER,
    lot_id INTEGER,
    quantity NUMERIC NOT NULL,
    unit_price NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (lot_id) REFERENCES products_lot(id)
);

-- Payments Table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER,
    customer_id INTEGER,
    amount NUMERIC NOT NULL,
    payment_method payment_method NOT NULL,
    payment_date DATE NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Sample Tracking Table
CREATE TABLE sample_tracking (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    customer_id INTEGER,
    lot_id INTEGER,
    quantity NUMERIC NOT NULL,
    cost NUMERIC DEFAULT 0,
    purpose VARCHAR(200),
    delivery_address TEXT,
    delivery_person VARCHAR(100),
    expected_return_date DATE,
    actual_return_date DATE,
    sample_status sample_status DEFAULT 'requested',
    conversion_sale_id INTEGER,
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (lot_id) REFERENCES products_lot(id),
    FOREIGN KEY (conversion_sale_id) REFERENCES sales(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Transfers Table
CREATE TABLE transfers (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    from_location_id INTEGER,
    to_location_id INTEGER,
    quantity NUMERIC NOT NULL,
    transfer_status transfer_status DEFAULT 'requested',
    requested_by INTEGER,
    approved_by INTEGER,
    notes TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (from_location_id) REFERENCES locations(id),
    FOREIGN KEY (to_location_id) REFERENCES locations(id),
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Notifications Table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    category notification_category NOT NULL,
    priority notification_priority DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(255),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Reports Table
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type report_type NOT NULL,
    parameters JSONB,
    schedule report_schedule,
    format report_format DEFAULT 'pdf',
    is_scheduled BOOLEAN DEFAULT FALSE,
    last_generated TIMESTAMP,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Settings Table
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key_name VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    type setting_type DEFAULT 'string',
    category VARCHAR(50),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Logs Table
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    entity_name VARCHAR(200),
    description TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    credit_amount NUMERIC DEFAULT 0,
    debit_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Daily Sale Sequences Table
CREATE TABLE daily_sale_sequences (
    date_key DATE PRIMARY KEY,
    last_number INTEGER DEFAULT 0
);

-- Password History Table
CREATE TABLE password_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User Sessions Table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL,
    session_token VARCHAR(255) NOT NULL,
    refresh_token VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User Audit Trail Table
CREATE TABLE user_audit_trail (
    id SERIAL PRIMARY KEY,
    target_user_id INTEGER NOT NULL,
    performed_by INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (target_user_id) REFERENCES users(id),
    FOREIGN KEY (performed_by) REFERENCES users(id)
);

-- =====================================================
-- VIEWS
-- =====================================================

-- Customer Summary View
CREATE VIEW customer_summary AS
SELECT
    c.id,
    c.name,
    c.email,
    c.phone,
    c.customer_type,
    c.total_purchases,
    c.total_due,
    c.last_purchase_date,
    c.red_list_status,
    c.red_list_since,
    COUNT(s.id) AS total_orders,
    COALESCE(AVG(s.total_amount), 0) AS average_order_value
FROM customers c
LEFT JOIN sales s ON c.id = s.customer_id
GROUP BY c.id, c.name, c.email, c.phone, c.customer_type, c.total_purchases, c.total_due, c.last_purchase_date, c.red_list_status, c.red_list_since;

-- Inventory Summary View
CREATE VIEW inventory_summary AS
SELECT
    l.id AS location_id,
    l.name AS location_name,
    COUNT(p.id) AS total_products,
    COUNT(CASE WHEN p.current_stock <= p.minimum_threshold THEN 1 END) AS low_stock_products,
    SUM(p.current_stock * p.purchase_price) AS total_inventory_value,
    SUM(p.current_stock) AS total_stock_quantity
FROM locations l
LEFT JOIN products p ON l.id = p.location_id AND p.product_status = 'active'
GROUP BY l.id, l.name;

-- Low Stock Products View
CREATE VIEW low_stock_products AS
SELECT
    p.id,
    p.name,
    p.product_code,
    p.current_stock,
    p.minimum_threshold,
    (p.minimum_threshold::NUMERIC - p.current_stock) AS stock_deficit,
    l.name AS location_name,
    c.name AS category_name
FROM products p
JOIN locations l ON p.location_id = l.id
JOIN categories c ON p.category_id = c.id
WHERE p.current_stock <= p.minimum_threshold::NUMERIC
    AND p.wastage_status = FALSE
    AND p.product_status = 'active';

-- Red List Customers View
CREATE VIEW red_list_customers AS
SELECT
    c.id,
    c.name,
    c.email,
    c.phone,
    c.total_due,
    c.red_list_since,
    c.last_purchase_date,
    (CURRENT_DATE - c.last_purchase_date) AS days_since_last_purchase,
    COALESCE(overdue_stats.overdue_count, 0) AS overdue_count,
    COALESCE(overdue_stats.overdue_amount, 0) AS overdue_amount,
    COALESCE(total_stats.total_sales_count, 0) AS total_sales_count
FROM customers c
LEFT JOIN (
    SELECT
        customer_id,
        COUNT(*) AS overdue_count,
        SUM(due_amount) AS overdue_amount
    FROM sales
    WHERE payment_status = 'overdue'
    GROUP BY customer_id
) overdue_stats ON c.id = overdue_stats.customer_id
LEFT JOIN (
    SELECT
        customer_id,
        COUNT(*) AS total_sales_count
    FROM sales
    GROUP BY customer_id
) total_stats ON c.id = total_stats.customer_id
WHERE c.red_list_status = TRUE
ORDER BY c.total_due DESC;

-- Sales Summary View
CREATE VIEW sales_summary AS
SELECT
    s.id,
    s.sale_number,
    c.name AS customer_name,
    s.total_amount,
    s.paid_amount,
    s.due_amount,
    s.payment_status,
    s.sale_status,
    l.name AS location_name,
    s.created_at,
    u.name AS created_by_name
FROM sales s
JOIN customers c ON s.customer_id = c.id
JOIN locations l ON s.location_id = l.id
JOIN users u ON s.created_by = u.id;

-- Sample Conversion Summary View
CREATE VIEW sample_conversion_summary AS
SELECT
    DATE_TRUNC('month', st.created_at) AS month,
    COUNT(*) AS total_samples,
    COUNT(st.conversion_sale_id) AS converted_samples,
    ROUND((COUNT(st.conversion_sale_id)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2) AS conversion_rate,
    SUM(st.cost) AS total_sample_cost,
    COALESCE(SUM(s.total_amount), 0) AS conversion_revenue
FROM sample_tracking st
LEFT JOIN sales s ON st.conversion_sale_id = s.id
WHERE st.created_at >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY DATE_TRUNC('month', st.created_at)
ORDER BY DATE_TRUNC('month', st.created_at) DESC;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Get Current User ID Function
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This would be set by your application when user logs in
    RETURN COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$$;

-- Set User Context Function
CREATE OR REPLACE FUNCTION set_user_context(user_id INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Set the user context for RLS policies
    PERFORM set_config('app.current_user_id', user_id::text, false);
END;
$$;

-- Clear User Context Function
CREATE OR REPLACE FUNCTION clear_user_context()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Clear the user context
    PERFORM set_config('app.current_user_id', '0', false);
END;
$$;

-- Get Current User Role Function
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT role::TEXT
        FROM users
        WHERE id = get_current_user_id()
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;

-- Is Super Admin Function
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN get_current_user_role() = 'super_admin';
END;
$$;

-- Get Current User Locations Function
CREATE OR REPLACE FUNCTION get_current_user_locations()
RETURNS INTEGER[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
    user_permissions JSONB;
    assigned_location INTEGER;
    location_ids INTEGER[];
BEGIN
    SELECT role::TEXT, permissions, assigned_location_id
    INTO user_role, user_permissions, assigned_location
    FROM users
    WHERE id = get_current_user_id();

    -- If no user found, return empty array
    IF user_role IS NULL THEN
        RETURN ARRAY[]::INTEGER[];
    END IF;

    -- Super Admin: All locations
    IF user_role = 'super_admin' THEN
        RETURN ARRAY(SELECT id FROM locations WHERE status = 'active');
    END IF;

    -- Sales Manager: Only assigned location
    IF user_role = 'sales_manager' THEN
        IF assigned_location IS NOT NULL THEN
            RETURN ARRAY[assigned_location];
        ELSE
            RETURN ARRAY[]::INTEGER[];
        END IF;
    END IF;

    -- Admin: Parse permissions JSON for allowed locations
    IF user_role = 'admin' THEN
        IF user_permissions IS NOT NULL AND user_permissions ? 'locations' THEN
            -- Extract location IDs from permissions JSON
            -- Format: {"locations": [1, 2, 3]}
            SELECT ARRAY(
                SELECT jsonb_array_elements_text(user_permissions->'locations')::INTEGER
            ) INTO location_ids;
            RETURN location_ids;
        ELSE
            -- If no specific locations in permissions, return empty array
            RETURN ARRAY[]::INTEGER[];
        END IF;
    END IF;

    -- Investor: All locations (read-only handled by other policies)
    IF user_role = 'investor' THEN
        RETURN ARRAY(SELECT id FROM locations WHERE status = 'active');
    END IF;

    RETURN ARRAY[]::INTEGER[];
EXCEPTION
    WHEN OTHERS THEN
        RETURN ARRAY[]::INTEGER[];
END;
$$;

-- Hash Password Function
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN crypt(password, gen_salt('bf', 12));
END;
$$;

-- Verify Password Function
CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN hash = crypt(password, hash);
END;
$$;

-- Generate Secure Token Function
CREATE OR REPLACE FUNCTION generate_secure_token(length INTEGER DEFAULT 32)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN encode(gen_random_bytes(length), 'hex');
END;
$$;

-- Generate Sale Number Function
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    next_number INTEGER;
    sale_number_result TEXT;
    current_date_key DATE := CURRENT_DATE;
BEGIN
    -- Insert or update the daily sequence counter
    INSERT INTO daily_sale_sequences (date_key, last_number)
    VALUES (current_date_key, 1)
    ON CONFLICT (date_key)
    DO UPDATE SET last_number = daily_sale_sequences.last_number + 1
    RETURNING last_number INTO next_number;

    -- Format: ST-YYYYMMDD-001
    sale_number_result := 'ST-' || TO_CHAR(current_date_key, 'YYYYMMDD') || '-' || LPAD(next_number::TEXT, 3, '0');

    RETURN sale_number_result;
END;
$$;

-- Update Updated At Column Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Auto Generate Sale Number Function
CREATE OR REPLACE FUNCTION auto_generate_sale_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.sale_number IS NULL OR NEW.sale_number = '' THEN
        NEW.sale_number := generate_sale_number();
    END IF;

    RETURN NEW;
END;
$$;

-- Calculate Per Meter Price Function
CREATE OR REPLACE FUNCTION calculate_per_meter_price()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Auto-calculate per meter price if not provided
    IF NEW.per_meter_price IS NULL OR NEW.per_meter_price = 0 THEN
        NEW.per_meter_price = NEW.selling_price;
    END IF;

    RETURN NEW;
END;
$$;

-- Calculate Per Unit Price Function
CREATE OR REPLACE FUNCTION calculate_per_unit_price()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Calculate per_unit_price as selling_price / quantity
    IF NEW.quantity > 0 AND NEW.selling_price IS NOT NULL THEN
        NEW.per_unit_price := NEW.selling_price / NEW.quantity;
    ELSE
        NEW.per_unit_price := 0;
    END IF;

    RETURN NEW;
END;
$$;

-- Update Product Totals Function
CREATE OR REPLACE FUNCTION update_product_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    prod_id INTEGER;
BEGIN
    -- Get product ID
    prod_id := COALESCE(NEW.product_id, OLD.product_id);

    -- Update product table with simple calculations
    UPDATE products
    SET
        total_stock = (
            SELECT COALESCE(SUM(quantity), 0)
            FROM products_lot
            WHERE product_id = prod_id AND status = 'active'
        ),
        current_stock = (
            SELECT COALESCE(SUM(quantity), 0)
            FROM products_lot
            WHERE product_id = prod_id AND status = 'active'
        ),
        current_lot_number = (
            SELECT COALESCE(MAX(lot_number), 0)
            FROM products_lot
            WHERE product_id = prod_id
        ),
        last_lot_no = (
            SELECT COALESCE(MAX(lot_number), 0)
            FROM products_lot
            WHERE product_id = prod_id
        ),
        updated_at = NOW()
    WHERE id = prod_id;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update Product Stock on Sale Function
CREATE OR REPLACE FUNCTION update_product_stock_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update lot quantity (reduce from specific lot)
    UPDATE products_lot
    SET quantity = quantity - NEW.quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.lot_id;

    -- Update product total_sold and last_sold
    UPDATE products
    SET
        total_sold = total_sold + NEW.quantity,
        last_sold = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.product_id;

    -- Note: total_stock and current_stock will be updated automatically by the existing triggers

    RETURN NEW;
END;
$$;

-- Update Customer Totals on Sale Function
CREATE OR REPLACE FUNCTION update_customer_totals_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update customer total purchases and due amount
        UPDATE customers
        SET
            total_purchases = (
                SELECT COALESCE(SUM(total_amount), 0)
                FROM sales
                WHERE customer_id = NEW.customer_id
            ),
            total_due = (
                SELECT COALESCE(SUM(due_amount), 0)
                FROM sales
                WHERE customer_id = NEW.customer_id
                AND payment_status IN ('pending', 'partial')
            ),
            last_purchase_date = CURRENT_DATE
        WHERE id = NEW.customer_id;

        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN
        -- Recalculate customer totals after deletion
        UPDATE customers
        SET
            total_purchases = (
                SELECT COALESCE(SUM(total_amount), 0)
                FROM sales
                WHERE customer_id = OLD.customer_id
            ),
            total_due = (
                SELECT COALESCE(SUM(due_amount), 0)
                FROM sales
                WHERE customer_id = OLD.customer_id
                AND payment_status IN ('pending', 'partial')
            )
        WHERE id = OLD.customer_id;

        RETURN OLD;
    END IF;
END;
$$;

-- Update Payment Status on Payment Function
CREATE OR REPLACE FUNCTION update_payment_status_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    sale_record RECORD;
    total_paid DECIMAL;
BEGIN
    -- Get sale details
    SELECT * INTO sale_record FROM sales WHERE id = NEW.sale_id;

    -- Calculate total paid amount for this sale
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM payments
    WHERE sale_id = NEW.sale_id;

    -- Update sale payment status and amounts
    UPDATE sales
    SET
        paid_amount = total_paid,
        due_amount = total_amount - total_paid,
        payment_status = CASE
            WHEN total_paid >= total_amount THEN 'paid'
            WHEN total_paid > 0 THEN 'partial'
            ELSE 'pending'
        END
    WHERE id = NEW.sale_id;

    -- Update customer total_due
    UPDATE customers
    SET total_due = (
        SELECT COALESCE(SUM(due_amount), 0)
        FROM sales
        WHERE customer_id = sale_record.customer_id
        AND payment_status IN ('pending', 'partial')
    )
    WHERE id = sale_record.customer_id;

    RETURN NEW;
END;
$$;

-- Validate Due Date Function
CREATE OR REPLACE FUNCTION validate_due_date()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Due date should be in the future
    IF NEW.due_date IS NOT NULL AND NEW.due_date <= CURRENT_DATE THEN
        RAISE EXCEPTION 'Due date must be in the future';
    END IF;

    RETURN NEW;
END;
$$;

-- Create Notification Function
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id INTEGER,
    p_title VARCHAR(200),
    p_message TEXT,
    p_type notification_type,
    p_category notification_category,
    p_priority notification_priority DEFAULT 'medium',
    p_action_url VARCHAR(255) DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO notifications (
        user_id, title, message, type, category, priority, action_url
    ) VALUES (
        p_user_id, p_title, p_message, p_type, p_category, p_priority, p_action_url
    );
END;
$$;

-- Check Low Stock Notification Function
CREATE OR REPLACE FUNCTION check_low_stock_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    location_managers INTEGER[];
    manager_id INTEGER;
BEGIN
    -- Check if stock is below threshold
    IF NEW.current_stock <= NEW.minimum_threshold AND OLD.current_stock > OLD.minimum_threshold THEN
        -- Get managers for this location
        SELECT ARRAY(
            SELECT id FROM users
            WHERE (role = 'sales_manager' AND assigned_location_id = NEW.location_id)
            OR (role = 'admin' AND (permissions->'locations')::jsonb ? NEW.location_id::text)
            OR role = 'super_admin'
        ) INTO location_managers;

        -- Create notifications for each manager
        FOREACH manager_id IN ARRAY location_managers
        LOOP
            PERFORM create_notification(
                manager_id,
                'Low Stock Alert',
                'Product "' || NEW.name || '" is running low. Current stock: ' || NEW.current_stock || ', Threshold: ' || NEW.minimum_threshold,
                'warning',
                'inventory',
                'high',
                '/products/' || NEW.id
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

-- Ensure Super Admin Exists Function
CREATE OR REPLACE FUNCTION ensure_super_admin_exists()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    super_admin_count INTEGER;
BEGIN
    -- Only check if we're dealing with a super admin
    IF OLD.role = 'super_admin' AND (OLD.status = 'active' OR TG_OP = 'DELETE') THEN
        SELECT COUNT(*) INTO super_admin_count
        FROM users
        WHERE role = 'super_admin'
        AND status = 'active'
        AND id != OLD.id;

        IF super_admin_count = 0 THEN
            RAISE EXCEPTION 'Cannot delete or deactivate the last super admin user';
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Can Assign Role Function
CREATE OR REPLACE FUNCTION can_assign_role(target_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    SELECT role INTO current_user_role
    FROM users
    WHERE id = get_current_user_id()
    AND status = 'active';

    IF current_user_role = 'super_admin' THEN
        RETURN TRUE;
    END IF;

    IF current_user_role = 'admin' AND target_role IN ('sales_manager', 'investor') THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

-- Can Modify User Function
CREATE OR REPLACE FUNCTION can_modify_user(target_user_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_role TEXT;
    target_user_role TEXT;
    current_user_id_val INTEGER;
BEGIN
    current_user_id_val := get_current_user_id();

    IF target_user_id = current_user_id_val THEN
        RETURN FALSE;
    END IF;

    SELECT role INTO current_user_role
    FROM users
    WHERE id = current_user_id_val
    AND status = 'active';

    SELECT role INTO target_user_role
    FROM users
    WHERE id = target_user_id;

    IF current_user_role = 'super_admin' THEN
        RETURN TRUE;
    END IF;

    IF current_user_role = 'admin' AND target_user_role IN ('sales_manager', 'investor') THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

-- Can Manage Users Function
CREATE OR REPLACE FUNCTION can_manage_users()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = get_current_user_id()
        AND role = 'super_admin'
        AND status = 'active'
    );
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Categories Triggers
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Customers Triggers
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Locations Triggers
CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Products Triggers
CREATE TRIGGER trigger_calculate_per_meter_price
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION calculate_per_meter_price();

CREATE TRIGGER trigger_low_stock_notification
    AFTER UPDATE ON products
    FOR EACH ROW
    WHEN (OLD.current_stock IS DISTINCT FROM NEW.current_stock)
    EXECUTE FUNCTION check_low_stock_notification();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Products Lot Triggers
CREATE TRIGGER calculate_per_unit_price_trigger
    BEFORE INSERT OR UPDATE ON products_lot
    FOR EACH ROW
    EXECUTE FUNCTION calculate_per_unit_price();

CREATE TRIGGER update_totals_on_insert
    AFTER INSERT ON products_lot
    FOR EACH ROW
    EXECUTE FUNCTION update_product_totals();

CREATE TRIGGER update_totals_on_update
    AFTER UPDATE ON products_lot
    FOR EACH ROW
    EXECUTE FUNCTION update_product_totals();

CREATE TRIGGER update_totals_on_delete
    AFTER DELETE ON products_lot
    FOR EACH ROW
    EXECUTE FUNCTION update_product_totals();

-- Sales Triggers
CREATE TRIGGER trigger_auto_generate_sale_number
    BEFORE INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_sale_number();

CREATE TRIGGER trigger_update_customer_totals_on_sale
    AFTER INSERT OR UPDATE OR DELETE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_totals_on_sale();

CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER validate_sales_due_date
    BEFORE INSERT OR UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION validate_due_date();

-- Sale Items Triggers
CREATE TRIGGER trigger_update_stock_on_sale
    AFTER INSERT ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION update_product_stock_on_sale();

-- Payments Triggers
CREATE TRIGGER trigger_update_payment_status
    AFTER INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_status_on_payment();

-- Sample Tracking Triggers
CREATE TRIGGER update_sample_tracking_updated_at
    BEFORE UPDATE ON sample_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Reports Triggers
CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Settings Triggers
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Suppliers Triggers
CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Users Triggers
CREATE TRIGGER prevent_last_super_admin_deletion
    BEFORE DELETE OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION ensure_super_admin_exists();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products_lot ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_audit_trail ENABLE ROW LEVEL SECURITY;

-- Users Policies
CREATE POLICY users_auth_policy ON users
    FOR SELECT TO anon
    USING (status = 'active');

CREATE POLICY users_select_policy ON users
    FOR SELECT TO public
    USING (
        id = get_current_user_id()
        OR is_super_admin()
        OR (get_current_user_role() = 'admin' AND role IN ('sales_manager', 'investor'))
    );

CREATE POLICY users_management_policy ON users
    FOR SELECT TO public
    USING (
        id = get_current_user_id()
        OR get_current_user_role() = 'super_admin'
        OR (get_current_user_role() = 'admin' AND assigned_location_id = ANY(get_current_user_locations()))
    );

CREATE POLICY users_insert_policy ON users
    FOR INSERT TO public
    WITH CHECK (
        is_super_admin()
        AND can_assign_role(role::text)
        AND created_by = get_current_user_id()
    );

CREATE POLICY users_create_policy ON users
    FOR INSERT TO public
    WITH CHECK (get_current_user_role() = 'super_admin');

CREATE POLICY users_update_policy ON users
    FOR UPDATE TO public
    USING (id = get_current_user_id() OR can_modify_user(id));

CREATE POLICY users_delete_policy ON users
    FOR DELETE TO public
    USING (is_super_admin() AND id <> get_current_user_id());

-- Customers Policies
CREATE POLICY customers_select_policy ON customers
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY customers_read_anon ON customers
    FOR SELECT TO anon
    USING (true);

CREATE POLICY customers_read_all ON customers
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY customers_insert_policy ON customers
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0)
            AND role IN ('super_admin', 'admin', 'sales_manager')
            AND status = 'active'
        )
        OR COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0) = 0
    );

CREATE POLICY customers_update_policy ON customers
    FOR UPDATE TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0)
            AND role IN ('super_admin', 'admin', 'sales_manager')
            AND status = 'active'
        )
    );

CREATE POLICY customers_delete_policy ON customers
    FOR DELETE TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0)
            AND role IN ('super_admin', 'admin')
            AND status = 'active'
        )
    );

-- Categories Policies
CREATE POLICY categories_select_policy ON categories
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY categories_insert_policy ON categories
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0)
            AND role IN ('super_admin', 'admin')
            AND status = 'active'
        )
        OR COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0) = 0
    );

CREATE POLICY categories_update_policy ON categories
    FOR UPDATE TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0)
            AND role IN ('super_admin', 'admin')
            AND status = 'active'
        )
    );

CREATE POLICY categories_delete_policy ON categories
    FOR DELETE TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0)
            AND role IN ('super_admin', 'admin')
            AND status = 'active'
        )
    );

-- Products Policies
CREATE POLICY products_select_policy ON products
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY products_location_policy ON products
    FOR ALL TO public
    USING (
        location_id = ANY(get_current_user_locations())
        OR get_current_user_role() = 'super_admin'
    );

CREATE POLICY products_insert_policy ON products
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0) IN (
            SELECT id FROM users
            WHERE role IN ('super_admin', 'admin')
            AND status = 'active'
        )
        OR COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0) = 0
    );

CREATE POLICY products_update_policy ON products
    FOR UPDATE TO anon, authenticated
    USING (
        COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0) IN (
            SELECT id FROM users
            WHERE role IN ('super_admin', 'admin')
            AND status = 'active'
        )
    );

CREATE POLICY products_delete_policy ON products
    FOR DELETE TO anon, authenticated
    USING (
        COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0) IN (
            SELECT id FROM users
            WHERE role IN ('super_admin', 'admin')
            AND status = 'active'
        )
    );

-- Products Lot Policies
CREATE POLICY products_lot_select_policy ON products_lot
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY products_lot_insert_policy ON products_lot
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0) IN (
            SELECT id FROM users
            WHERE role IN ('super_admin', 'admin')
            AND status = 'active'
        )
        OR COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0) = 0
    );

CREATE POLICY products_lot_update_policy ON products_lot
    FOR UPDATE TO anon, authenticated
    USING (
        COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0) IN (
            SELECT id FROM users
            WHERE role IN ('super_admin', 'admin')
            AND status = 'active'
        )
    );

CREATE POLICY products_lot_delete_policy ON products_lot
    FOR DELETE TO anon, authenticated
    USING (
        COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0) IN (
            SELECT id FROM users
            WHERE role IN ('super_admin', 'admin')
            AND status = 'active'
        )
    );

-- Sales Policies
CREATE POLICY sales_read_anon ON sales
    FOR SELECT TO anon
    USING (true);

CREATE POLICY sales_read_all ON sales
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert sales" ON sales
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update sales" ON sales
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete sales" ON sales
    FOR DELETE TO authenticated
    USING (true);

-- Sale Items Policies
CREATE POLICY "Allow authenticated users to select sale_items" ON sale_items
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert sale_items" ON sale_items
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update sale_items" ON sale_items
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete sale_items" ON sale_items
    FOR DELETE TO authenticated
    USING (true);

-- Suppliers Policies
CREATE POLICY suppliers_select_policy ON suppliers
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY suppliers_insert_policy ON suppliers
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0) IN (
            SELECT id FROM users
            WHERE role IN ('super_admin', 'admin')
            AND status = 'active'
        )
        OR COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0) = 0
    );

CREATE POLICY suppliers_update_policy ON suppliers
    FOR UPDATE TO anon, authenticated
    USING (
        COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0) IN (
            SELECT id FROM users
            WHERE role IN ('super_admin', 'admin')
            AND status = 'active'
        )
    );

CREATE POLICY suppliers_delete_policy ON suppliers
    FOR DELETE TO anon, authenticated
    USING (
        COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0) IN (
            SELECT id FROM users
            WHERE role IN ('super_admin', 'admin')
            AND status = 'active'
        )
    );

-- Sample Tracking Policies
CREATE POLICY sample_tracking_policy ON sample_tracking
    FOR ALL TO public
    USING (
        EXISTS (
            SELECT 1 FROM products p
            WHERE p.id = sample_tracking.product_id
            AND p.location_id = ANY(get_current_user_locations())
        )
        OR get_current_user_role() = 'super_admin'
    );

-- Transfers Policies
CREATE POLICY transfers_location_policy ON transfers
    FOR ALL TO public
    USING (
        from_location_id = ANY(get_current_user_locations())
        OR to_location_id = ANY(get_current_user_locations())
        OR get_current_user_role() = 'super_admin'
    );

-- Activity Logs Policies
CREATE POLICY activity_logs_select_policy ON activity_logs
    FOR SELECT TO anon, authenticated
    USING (
        user_id = COALESCE(current_setting('app.current_user_id', true)::INTEGER, user_id)
        OR EXISTS (
            SELECT 1 FROM users
            WHERE id = COALESCE(current_setting('app.current_user_id', true)::INTEGER, 0)
            AND role = 'super_admin'
            AND status = 'active'
        )
    );

CREATE POLICY activity_logs_insert_policy ON activity_logs
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY activity_logs_policy ON activity_logs
    FOR SELECT TO public
    USING (
        get_current_user_role() = 'super_admin'
        OR user_id = get_current_user_id()
        OR EXISTS (
            SELECT 1 FROM products p
            WHERE p.id::text = activity_logs.entity_id::text
            AND activity_logs.entity_type = 'product'
            AND p.location_id = ANY(get_current_user_locations())
        )
    );

-- Password History Policies
CREATE POLICY password_history_select_policy ON password_history
    FOR SELECT TO public
    USING (user_id = get_current_user_id() OR is_super_admin());

CREATE POLICY password_history_insert_policy ON password_history
    FOR INSERT TO public
    WITH CHECK (is_super_admin() OR user_id = get_current_user_id());

-- User Sessions Policies
CREATE POLICY user_sessions_select_policy ON user_sessions
    FOR SELECT TO public
    USING (user_id = get_current_user_id() OR is_super_admin());

CREATE POLICY user_sessions_insert_policy ON user_sessions
    FOR INSERT TO public
    WITH CHECK (user_id = get_current_user_id() OR is_super_admin());

CREATE POLICY user_sessions_update_policy ON user_sessions
    FOR UPDATE TO public
    USING (user_id = get_current_user_id() OR is_super_admin());

CREATE POLICY user_sessions_delete_policy ON user_sessions
    FOR DELETE TO public
    USING (user_id = get_current_user_id() OR is_super_admin());

-- User Audit Trail Policies
CREATE POLICY user_audit_trail_select_policy ON user_audit_trail
    FOR SELECT TO public
    USING (is_super_admin());

CREATE POLICY user_audit_trail_insert_policy ON user_audit_trail
    FOR INSERT TO public
    WITH CHECK (is_super_admin() OR performed_by = get_current_user_id());

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_assigned_location ON users(assigned_location_id);

-- Products indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_location ON products(location_id);
CREATE INDEX idx_products_code ON products(product_code);
CREATE INDEX idx_products_status ON products(product_status);
CREATE INDEX idx_products_stock_threshold ON products(current_stock, minimum_threshold);

-- Products Lot indexes
CREATE INDEX idx_products_lot_product ON products_lot(product_id);
CREATE INDEX idx_products_lot_supplier ON products_lot(supplier_id);
CREATE INDEX idx_products_lot_location ON products_lot(location_id);
CREATE INDEX idx_products_lot_status ON products_lot(status);

-- Sales indexes
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_location ON sales(location_id);
CREATE INDEX idx_sales_created_by ON sales(created_by);
CREATE INDEX idx_sales_payment_status ON sales(payment_status);
CREATE INDEX idx_sales_sale_status ON sales(sale_status);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_due_date ON sales(due_date);

-- Sale Items indexes
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);
CREATE INDEX idx_sale_items_lot ON sale_items(lot_id);

-- Customers indexes
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_type ON customers(customer_type);
CREATE INDEX idx_customers_red_list ON customers(red_list_status);

-- Activity Logs indexes
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Sample Tracking indexes
CREATE INDEX idx_sample_tracking_product ON sample_tracking(product_id);
CREATE INDEX idx_sample_tracking_customer ON sample_tracking(customer_id);
CREATE INDEX idx_sample_tracking_status ON sample_tracking(sample_status);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- Insert a completion log
INSERT INTO activity_logs (user_id, action, module, description)
VALUES (1, 'MIGRATION', 'SYSTEM', 'Complete database backup migration applied successfully');

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database backup migration completed successfully!';
    RAISE NOTICE 'All tables, functions, triggers, views, and policies have been created.';
    RAISE NOTICE 'You can now migrate this database to another Supabase project.';
END $$;

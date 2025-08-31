-- =====================================================
-- Serrano Tex Inventory Management System
-- Database Migration: Functions and Triggers
-- Version: 1.0.0
-- Created: 2025-01-10
-- =====================================================

-- =====================================================
-- 4. BUSINESS LOGIC FUNCTIONS
-- =====================================================

-- Function to set user context for RLS
CREATE OR REPLACE FUNCTION set_user_context(user_id INTEGER)
RETURNS void AS $$
BEGIN
    -- Set the user context for RLS policies
    PERFORM set_config('app.current_user_id', user_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear user context
CREATE OR REPLACE FUNCTION clear_user_context()
RETURNS void AS $$
BEGIN
    -- Clear the user context
    PERFORM set_config('app.current_user_id', '0', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to anonymous users
GRANT EXECUTE ON FUNCTION set_user_context(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION clear_user_context() TO anon;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate sale number
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    sale_number TEXT;
BEGIN
    -- Get the next sequence number
    SELECT COALESCE(MAX(CAST(SUBSTRING(sale_number FROM 6) AS INTEGER)), 0) + 1
    INTO next_number
    FROM sales
    WHERE sale_number ~ '^SALE-[0-9]+$';
    
    -- Format as SALE-XXXXXX
    sale_number := 'SALE-' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN sale_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update product stock after sale
CREATE OR REPLACE FUNCTION update_product_stock_on_sale()
RETURNS TRIGGER AS $$
DECLARE
    remaining_qty DECIMAL(10,2);
    lot_record RECORD;
BEGIN
    remaining_qty := NEW.quantity;
    
    -- Update product lots using FIFO (First In, First Out)
    FOR lot_record IN 
        SELECT id, quantity_remaining 
        FROM product_lots 
        WHERE product_id = NEW.product_id 
        AND quantity_remaining > 0 
        ORDER BY purchase_date ASC
    LOOP
        IF remaining_qty <= 0 THEN
            EXIT;
        END IF;
        
        IF lot_record.quantity_remaining >= remaining_qty THEN
            -- This lot can fulfill the remaining quantity
            UPDATE product_lots 
            SET quantity_remaining = quantity_remaining - remaining_qty
            WHERE id = lot_record.id;
            remaining_qty := 0;
        ELSE
            -- Use all of this lot and continue
            remaining_qty := remaining_qty - lot_record.quantity_remaining;
            UPDATE product_lots 
            SET quantity_remaining = 0
            WHERE id = lot_record.id;
        END IF;
    END LOOP;
    
    -- Update product current stock
    UPDATE products 
    SET current_stock = current_stock - NEW.quantity,
        total_sold = total_sold + NEW.quantity,
        last_sold = NOW()
    WHERE id = NEW.product_id;
    
    -- Check for low stock and create notification
    PERFORM check_low_stock(NEW.product_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check low stock and create notifications
CREATE OR REPLACE FUNCTION check_low_stock(product_id INTEGER)
RETURNS void AS $$
DECLARE
    product_record RECORD;
    user_record RECORD;
BEGIN
    -- Get product details
    SELECT p.*, l.name as location_name 
    INTO product_record
    FROM products p
    LEFT JOIN locations l ON p.location_id = l.id
    WHERE p.id = product_id;
    
    -- Check if stock is below threshold
    IF product_record.current_stock <= product_record.minimum_threshold THEN
        -- Create notifications for relevant users
        FOR user_record IN 
            SELECT id FROM users 
            WHERE status = 'active' 
            AND (
                role IN ('super_admin', 'admin') OR 
                (role = 'sales_manager' AND assigned_location_id = product_record.location_id)
            )
        LOOP
            INSERT INTO notifications (
                user_id, 
                title, 
                message, 
                type, 
                priority,
                related_id,
                related_type
            ) VALUES (
                user_record.id,
                'Low Stock Alert',
                'Product "' || product_record.name || '" at ' || COALESCE(product_record.location_name, 'Unknown Location') || 
                ' is running low. Current stock: ' || product_record.current_stock || 
                ', Minimum threshold: ' || product_record.minimum_threshold,
                'low_stock',
                'high',
                product_record.id,
                'product'
            );
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update customer totals
CREATE OR REPLACE FUNCTION update_customer_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update customer total purchases and due amount
    UPDATE customers 
    SET total_purchases = (
            SELECT COALESCE(SUM(total_amount), 0) 
            FROM sales 
            WHERE customer_id = NEW.customer_id 
            AND sale_status = 'finalized'
        ),
        total_due = (
            SELECT COALESCE(SUM(due_amount), 0) 
            FROM sales 
            WHERE customer_id = NEW.customer_id 
            AND payment_status IN ('pending', 'partial', 'overdue')
        ),
        last_purchase_date = (
            SELECT MAX(created_at) 
            FROM sales 
            WHERE customer_id = NEW.customer_id 
            AND sale_status = 'finalized'
        )
    WHERE id = NEW.customer_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check red list status
CREATE OR REPLACE FUNCTION check_red_list_status()
RETURNS TRIGGER AS $$
DECLARE
    overdue_count INTEGER;
    overdue_amount DECIMAL(12,2);
BEGIN
    -- Count overdue sales and total overdue amount
    SELECT COUNT(*), COALESCE(SUM(due_amount), 0)
    INTO overdue_count, overdue_amount
    FROM sales 
    WHERE customer_id = NEW.customer_id 
    AND payment_status = 'overdue';
    
    -- Red list if more than 2 overdue sales or overdue amount > 50000
    IF overdue_count > 2 OR overdue_amount > 50000 THEN
        UPDATE customers 
        SET red_list_status = TRUE,
            red_list_since = COALESCE(red_list_since, NOW())
        WHERE id = NEW.customer_id;
        
        -- Create notification for red list
        INSERT INTO notifications (
            user_id, 
            title, 
            message, 
            type, 
            priority,
            related_id,
            related_type
        )
        SELECT 
            u.id,
            'Customer Red Listed',
            'Customer "' || c.name || '" has been added to red list due to overdue payments.',
            'red_list',
            'urgent',
            c.id,
            'customer'
        FROM users u, customers c
        WHERE c.id = NEW.customer_id
        AND u.status = 'active'
        AND u.role IN ('super_admin', 'admin', 'sales_manager');
    ELSE
        -- Remove from red list if conditions are met
        UPDATE customers 
        SET red_list_status = FALSE,
            red_list_since = NULL
        WHERE id = NEW.customer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
    current_user_id INTEGER;
    user_locations INTEGER[];
BEGIN
    current_user_id := get_current_user_id();
    user_locations := get_user_locations();
    
    SELECT json_build_object(
        'total_products', (
            SELECT COUNT(*) FROM products 
            WHERE (is_super_admin() OR location_id = ANY(user_locations))
            AND product_status = 'active'
        ),
        'low_stock_products', (
            SELECT COUNT(*) FROM products 
            WHERE (is_super_admin() OR location_id = ANY(user_locations))
            AND current_stock <= minimum_threshold
            AND product_status = 'active'
        ),
        'total_customers', (
            SELECT COUNT(*) FROM customers
        ),
        'red_list_customers', (
            SELECT COUNT(*) FROM customers WHERE red_list_status = TRUE
        ),
        'today_sales', (
            SELECT COUNT(*) FROM sales 
            WHERE (is_super_admin() OR location_id = ANY(user_locations))
            AND DATE(created_at) = CURRENT_DATE
            AND sale_status = 'finalized'
        ),
        'today_revenue', (
            SELECT COALESCE(SUM(total_amount), 0) FROM sales 
            WHERE (is_super_admin() OR location_id = ANY(user_locations))
            AND DATE(created_at) = CURRENT_DATE
            AND sale_status = 'finalized'
        ),
        'pending_transfers', (
            SELECT COUNT(*) FROM transfers 
            WHERE (is_super_admin() OR from_location_id = ANY(user_locations) OR to_location_id = ANY(user_locations))
            AND transfer_status IN ('requested', 'approved', 'in_transit')
        ),
        'unread_notifications', (
            SELECT COUNT(*) FROM notifications 
            WHERE user_id = current_user_id AND is_read = FALSE
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

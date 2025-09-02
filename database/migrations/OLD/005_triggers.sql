-- =====================================================
-- Serrano Tex Inventory Management System
-- Database Migration: Triggers
-- Version: 1.0.0
-- Created: 2025-01-10
-- =====================================================

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

-- Updated_at triggers for all tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate sale number trigger
CREATE OR REPLACE FUNCTION auto_generate_sale_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sale_number IS NULL OR NEW.sale_number = '' THEN
        NEW.sale_number := generate_sale_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_sale_number_trigger
    BEFORE INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_sale_number();

-- Stock update trigger for sale items
CREATE TRIGGER update_stock_on_sale_item_insert
    AFTER INSERT ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION update_product_stock_on_sale();

-- Customer totals update trigger
CREATE TRIGGER update_customer_totals_on_sale_change
    AFTER INSERT OR UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_totals();

-- Red list status check trigger
CREATE TRIGGER check_red_list_on_sale_change
    AFTER INSERT OR UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION check_red_list_status();

-- Payment status update trigger
CREATE OR REPLACE FUNCTION update_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update sale payment status based on paid amount
    UPDATE sales 
    SET payment_status = CASE 
        WHEN paid_amount >= total_amount THEN 'paid'
        WHEN paid_amount > 0 THEN 'partial'
        WHEN due_date < CURRENT_DATE THEN 'overdue'
        ELSE 'pending'
    END,
    due_amount = total_amount - paid_amount
    WHERE id = NEW.sale_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_status_on_payment
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_status();

-- Product lot creation trigger
CREATE OR REPLACE FUNCTION create_product_lot_on_stock_increase()
RETURNS TRIGGER AS $$
BEGIN
    -- If current_stock increased, create a new lot
    IF TG_OP = 'UPDATE' AND NEW.current_stock > OLD.current_stock THEN
        INSERT INTO product_lots (
            product_id,
            lot_number,
            purchase_price,
            selling_price,
            quantity_purchased,
            quantity_remaining,
            supplier_id,
            location_id
        ) VALUES (
            NEW.id,
            'LOT-' || NEW.id || '-' || EXTRACT(EPOCH FROM NOW())::INTEGER,
            NEW.purchase_price,
            NEW.selling_price,
            NEW.current_stock - OLD.current_stock,
            NEW.current_stock - OLD.current_stock,
            NEW.supplier_id,
            NEW.location_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_lot_on_stock_increase
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION create_product_lot_on_stock_increase();

-- Transfer completion trigger
CREATE OR REPLACE FUNCTION complete_transfer()
RETURNS TRIGGER AS $$
BEGIN
    -- When transfer status changes to 'completed', update product stocks
    IF NEW.transfer_status = 'completed' AND OLD.transfer_status != 'completed' THEN
        -- Decrease stock at source location
        UPDATE products 
        SET current_stock = current_stock - NEW.quantity
        WHERE id = NEW.product_id;
        
        -- Increase stock at destination location (if product exists there)
        -- Or create new product record for destination location
        IF EXISTS (SELECT 1 FROM products WHERE id = NEW.product_id AND location_id = NEW.to_location_id) THEN
            UPDATE products 
            SET current_stock = current_stock + NEW.quantity
            WHERE id = NEW.product_id AND location_id = NEW.to_location_id;
        END IF;
        
        -- Set completion timestamp
        NEW.completed_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER complete_transfer_trigger
    BEFORE UPDATE ON transfers
    FOR EACH ROW
    EXECUTE FUNCTION complete_transfer();

-- Sample tracking trigger
CREATE OR REPLACE FUNCTION update_stock_on_sample()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Decrease stock when sample is given
        UPDATE products 
        SET current_stock = current_stock - NEW.quantity
        WHERE id = NEW.product_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle sample status changes
        IF NEW.sample_status = 'returned' AND OLD.sample_status != 'returned' THEN
            -- Increase stock when sample is returned
            UPDATE products 
            SET current_stock = current_stock + NEW.quantity
            WHERE id = NEW.product_id;
        ELSIF NEW.sample_status = 'sold' AND OLD.sample_status != 'sold' THEN
            -- Update total sold when sample is sold
            UPDATE products 
            SET total_sold = total_sold + NEW.quantity
            WHERE id = NEW.product_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stock_on_sample_trigger
    AFTER INSERT OR UPDATE ON sample_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_on_sample();

-- Notification cleanup trigger (delete old read notifications)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete read notifications older than 30 days
    DELETE FROM notifications 
    WHERE is_read = TRUE 
    AND created_at < NOW() - INTERVAL '30 days';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_notifications_trigger
    AFTER INSERT ON notifications
    FOR EACH STATEMENT
    EXECUTE FUNCTION cleanup_old_notifications();

-- Activity log trigger for important operations
CREATE OR REPLACE FUNCTION log_important_activities()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id INTEGER;
    action_description TEXT;
BEGIN
    current_user_id := get_current_user_id();
    
    -- Log different types of activities
    IF TG_TABLE_NAME = 'sales' AND TG_OP = 'INSERT' THEN
        action_description := 'Created sale: ' || NEW.sale_number || ' for amount: ' || NEW.total_amount;
        INSERT INTO activity_logs (user_id, action, module, description, credit_amount)
        VALUES (current_user_id, 'CREATE', 'SALE', action_description, NEW.total_amount);
    ELSIF TG_TABLE_NAME = 'products' AND TG_OP = 'INSERT' THEN
        action_description := 'Created product: ' || NEW.name || ' (Code: ' || NEW.product_code || ')';
        INSERT INTO activity_logs (user_id, action, module, description)
        VALUES (current_user_id, 'CREATE', 'PRODUCT', action_description);
    ELSIF TG_TABLE_NAME = 'customers' AND TG_OP = 'INSERT' THEN
        action_description := 'Created customer: ' || NEW.name;
        INSERT INTO activity_logs (user_id, action, module, description)
        VALUES (current_user_id, 'CREATE', 'CUSTOMER', action_description);
    ELSIF TG_TABLE_NAME = 'transfers' AND TG_OP = 'UPDATE' AND NEW.transfer_status = 'completed' THEN
        action_description := 'Completed transfer of ' || NEW.quantity || ' units';
        INSERT INTO activity_logs (user_id, action, module, description)
        VALUES (current_user_id, 'COMPLETE', 'TRANSFER', action_description);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply activity logging triggers
CREATE TRIGGER log_sale_activities
    AFTER INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION log_important_activities();

CREATE TRIGGER log_product_activities
    AFTER INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION log_important_activities();

CREATE TRIGGER log_customer_activities
    AFTER INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION log_important_activities();

CREATE TRIGGER log_transfer_activities
    AFTER UPDATE ON transfers
    FOR EACH ROW
    EXECUTE FUNCTION log_important_activities();

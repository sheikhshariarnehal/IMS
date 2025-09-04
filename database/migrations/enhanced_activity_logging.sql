-- Enhanced Activity Logging System
-- This file contains comprehensive triggers and functions for activity logging

-- Create or replace the enhanced activity logging function
CREATE OR REPLACE FUNCTION log_enhanced_activities()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id INTEGER;
    action_description TEXT;
    entity_name_value TEXT;
    old_values_json JSONB;
    new_values_json JSONB;
BEGIN
    -- Get current user ID from RLS context
    current_user_id := get_current_user_id();
    
    -- Skip logging if no user context (system operations)
    IF current_user_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Convert OLD and NEW to JSONB for comparison
    IF TG_OP = 'DELETE' THEN
        old_values_json := to_jsonb(OLD);
        new_values_json := NULL;
    ELSIF TG_OP = 'INSERT' THEN
        old_values_json := NULL;
        new_values_json := to_jsonb(NEW);
    ELSE -- UPDATE
        old_values_json := to_jsonb(OLD);
        new_values_json := to_jsonb(NEW);
    END IF;

    -- Generate entity name and description based on table
    CASE TG_TABLE_NAME
        WHEN 'products' THEN
            IF TG_OP = 'DELETE' THEN
                entity_name_value := OLD.name;
                action_description := 'Deleted product: ' || OLD.name || ' (Code: ' || COALESCE(OLD.product_code, 'N/A') || ')';
            ELSIF TG_OP = 'INSERT' THEN
                entity_name_value := NEW.name;
                action_description := 'Created product: ' || NEW.name || ' (Code: ' || COALESCE(NEW.product_code, 'N/A') || ')';
            ELSE -- UPDATE
                entity_name_value := NEW.name;
                action_description := 'Updated product: ' || NEW.name || ' (Code: ' || COALESCE(NEW.product_code, 'N/A') || ')';
            END IF;

        WHEN 'customers' THEN
            IF TG_OP = 'DELETE' THEN
                entity_name_value := OLD.name;
                action_description := 'Deleted customer: ' || OLD.name;
            ELSIF TG_OP = 'INSERT' THEN
                entity_name_value := NEW.name;
                action_description := 'Created customer: ' || NEW.name;
            ELSE -- UPDATE
                entity_name_value := NEW.name;
                action_description := 'Updated customer: ' || NEW.name;
            END IF;

        WHEN 'suppliers' THEN
            IF TG_OP = 'DELETE' THEN
                entity_name_value := OLD.name;
                action_description := 'Deleted supplier: ' || OLD.name;
            ELSIF TG_OP = 'INSERT' THEN
                entity_name_value := NEW.name;
                action_description := 'Created supplier: ' || NEW.name;
            ELSE -- UPDATE
                entity_name_value := NEW.name;
                action_description := 'Updated supplier: ' || NEW.name;
            END IF;

        WHEN 'sales' THEN
            IF TG_OP = 'DELETE' THEN
                entity_name_value := OLD.sale_number;
                action_description := 'Deleted sale: ' || OLD.sale_number || ' (Amount: ' || COALESCE(OLD.total_amount::text, '0') || ')';
            ELSIF TG_OP = 'INSERT' THEN
                entity_name_value := NEW.sale_number;
                action_description := 'Created sale: ' || NEW.sale_number || ' (Amount: ' || COALESCE(NEW.total_amount::text, '0') || ')';
            ELSE -- UPDATE
                entity_name_value := NEW.sale_number;
                action_description := 'Updated sale: ' || NEW.sale_number || ' (Amount: ' || COALESCE(NEW.total_amount::text, '0') || ')';
            END IF;

        WHEN 'transfers' THEN
            IF TG_OP = 'DELETE' THEN
                entity_name_value := 'Transfer #' || OLD.id;
                action_description := 'Deleted transfer: ' || OLD.quantity || ' units';
            ELSIF TG_OP = 'INSERT' THEN
                entity_name_value := 'Transfer #' || NEW.id;
                action_description := 'Created transfer: ' || NEW.quantity || ' units';
            ELSE -- UPDATE
                entity_name_value := 'Transfer #' || NEW.id;
                IF OLD.transfer_status != NEW.transfer_status AND NEW.transfer_status = 'completed' THEN
                    action_description := 'Completed transfer: ' || NEW.quantity || ' units';
                ELSE
                    action_description := 'Updated transfer: ' || NEW.quantity || ' units';
                END IF;
            END IF;

        WHEN 'categories' THEN
            IF TG_OP = 'DELETE' THEN
                entity_name_value := OLD.name;
                action_description := 'Deleted category: ' || OLD.name;
            ELSIF TG_OP = 'INSERT' THEN
                entity_name_value := NEW.name;
                action_description := 'Created category: ' || NEW.name;
            ELSE -- UPDATE
                entity_name_value := NEW.name;
                action_description := 'Updated category: ' || NEW.name;
            END IF;

        WHEN 'locations' THEN
            IF TG_OP = 'DELETE' THEN
                entity_name_value := OLD.name;
                action_description := 'Deleted location: ' || OLD.name;
            ELSIF TG_OP = 'INSERT' THEN
                entity_name_value := NEW.name;
                action_description := 'Created location: ' || NEW.name;
            ELSE -- UPDATE
                entity_name_value := NEW.name;
                action_description := 'Updated location: ' || NEW.name;
            END IF;

        WHEN 'users' THEN
            IF TG_OP = 'DELETE' THEN
                entity_name_value := OLD.name;
                action_description := 'Deleted user: ' || OLD.name || ' (' || OLD.email || ')';
            ELSIF TG_OP = 'INSERT' THEN
                entity_name_value := NEW.name;
                action_description := 'Created user: ' || NEW.name || ' (' || NEW.email || ')';
            ELSE -- UPDATE
                entity_name_value := NEW.name;
                action_description := 'Updated user: ' || NEW.name || ' (' || NEW.email || ')';
            END IF;

        WHEN 'sample_tracking' THEN
            IF TG_OP = 'DELETE' THEN
                entity_name_value := 'Sample #' || OLD.id;
                action_description := 'Deleted sample tracking record';
            ELSIF TG_OP = 'INSERT' THEN
                entity_name_value := 'Sample #' || NEW.id;
                action_description := 'Created sample tracking record';
            ELSE -- UPDATE
                entity_name_value := 'Sample #' || NEW.id;
                action_description := 'Updated sample tracking record';
            END IF;

        ELSE
            -- Generic handling for other tables
            IF TG_OP = 'DELETE' THEN
                entity_name_value := TG_TABLE_NAME || ' #' || OLD.id;
                action_description := 'Deleted ' || TG_TABLE_NAME || ' record';
            ELSIF TG_OP = 'INSERT' THEN
                entity_name_value := TG_TABLE_NAME || ' #' || NEW.id;
                action_description := 'Created ' || TG_TABLE_NAME || ' record';
            ELSE -- UPDATE
                entity_name_value := TG_TABLE_NAME || ' #' || NEW.id;
                action_description := 'Updated ' || TG_TABLE_NAME || ' record';
            END IF;
    END CASE;

    -- Insert activity log
    INSERT INTO activity_logs (
        user_id,
        action,
        module,
        entity_type,
        entity_id,
        entity_name,
        description,
        old_values,
        new_values,
        credit_amount,
        debit_amount,
        created_at
    ) VALUES (
        current_user_id,
        TG_OP,
        UPPER(TG_TABLE_NAME),
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        entity_name_value,
        action_description,
        old_values_json,
        new_values_json,
        CASE 
            WHEN TG_TABLE_NAME = 'sales' AND TG_OP IN ('INSERT', 'UPDATE') THEN NEW.total_amount
            ELSE 0
        END,
        CASE 
            WHEN TG_TABLE_NAME = 'sales' AND TG_OP = 'DELETE' THEN OLD.total_amount
            ELSE 0
        END,
        CURRENT_TIMESTAMP
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS enhanced_activity_log_products ON products;
DROP TRIGGER IF EXISTS enhanced_activity_log_customers ON customers;
DROP TRIGGER IF EXISTS enhanced_activity_log_suppliers ON suppliers;
DROP TRIGGER IF EXISTS enhanced_activity_log_sales ON sales;
DROP TRIGGER IF EXISTS enhanced_activity_log_transfers ON transfers;
DROP TRIGGER IF EXISTS enhanced_activity_log_categories ON categories;
DROP TRIGGER IF EXISTS enhanced_activity_log_locations ON locations;
DROP TRIGGER IF EXISTS enhanced_activity_log_users ON users;
DROP TRIGGER IF EXISTS enhanced_activity_log_samples ON sample_tracking;

-- Create enhanced activity logging triggers for all important tables
CREATE TRIGGER enhanced_activity_log_products
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW
    EXECUTE FUNCTION log_enhanced_activities();

CREATE TRIGGER enhanced_activity_log_customers
    AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION log_enhanced_activities();

CREATE TRIGGER enhanced_activity_log_suppliers
    AFTER INSERT OR UPDATE OR DELETE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION log_enhanced_activities();

CREATE TRIGGER enhanced_activity_log_sales
    AFTER INSERT OR UPDATE OR DELETE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION log_enhanced_activities();

CREATE TRIGGER enhanced_activity_log_transfers
    AFTER INSERT OR UPDATE OR DELETE ON transfers
    FOR EACH ROW
    EXECUTE FUNCTION log_enhanced_activities();

CREATE TRIGGER enhanced_activity_log_categories
    AFTER INSERT OR UPDATE OR DELETE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION log_enhanced_activities();

CREATE TRIGGER enhanced_activity_log_locations
    AFTER INSERT OR UPDATE OR DELETE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION log_enhanced_activities();

CREATE TRIGGER enhanced_activity_log_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_enhanced_activities();

CREATE TRIGGER enhanced_activity_log_samples
    AFTER INSERT OR UPDATE OR DELETE ON sample_tracking
    FOR EACH ROW
    EXECUTE FUNCTION log_enhanced_activities();

-- Create index for better performance on activity logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_module_action ON activity_logs(module, action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Add comment
COMMENT ON FUNCTION log_enhanced_activities() IS 'Enhanced activity logging function that captures all CRUD operations with detailed context';

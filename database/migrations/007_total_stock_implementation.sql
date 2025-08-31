-- =====================================================
-- Serrano Tex Inventory Management System
-- Database Migration: Total Stock Implementation
-- Version: 1.0.0
-- Created: 2025-01-12
-- =====================================================

-- =====================================================
-- 7. TOTAL STOCK IMPLEMENTATION
-- =====================================================

-- Add total_stock column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS total_stock DECIMAL(10,2) DEFAULT 0 CHECK (total_stock >= 0);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_products_total_stock ON products(total_stock);

-- Function to calculate total stock for a product
CREATE OR REPLACE FUNCTION calculate_product_total_stock(product_id_param INTEGER)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_stock_value DECIMAL(10,2);
BEGIN
    -- Calculate sum of all quantity_remaining from product_lots for this product
    SELECT COALESCE(SUM(quantity_remaining), 0)
    INTO total_stock_value
    FROM product_lots
    WHERE product_id = product_id_param;
    
    RETURN total_stock_value;
END;
$$ LANGUAGE plpgsql;

-- Function to update product total stock
CREATE OR REPLACE FUNCTION update_product_total_stock()
RETURNS TRIGGER AS $$
DECLARE
    affected_product_id INTEGER;
    new_total_stock DECIMAL(10,2);
BEGIN
    -- Determine which product_id to update based on the operation
    IF TG_OP = 'DELETE' THEN
        affected_product_id := OLD.product_id;
    ELSE
        affected_product_id := NEW.product_id;
    END IF;
    
    -- Calculate new total stock for the affected product
    new_total_stock := calculate_product_total_stock(affected_product_id);
    
    -- Update the products table with the new total stock
    UPDATE products 
    SET total_stock = new_total_stock,
        updated_at = NOW()
    WHERE id = affected_product_id;
    
    -- For UPDATE operations, also check if product_id changed (unlikely but possible)
    IF TG_OP = 'UPDATE' AND OLD.product_id != NEW.product_id THEN
        -- Update the old product as well
        new_total_stock := calculate_product_total_stock(OLD.product_id);
        UPDATE products 
        SET total_stock = new_total_stock,
            updated_at = NOW()
        WHERE id = OLD.product_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for product_lots table
-- Trigger for INSERT operations
CREATE TRIGGER update_total_stock_on_lot_insert
    AFTER INSERT ON product_lots
    FOR EACH ROW
    EXECUTE FUNCTION update_product_total_stock();

-- Trigger for UPDATE operations
CREATE TRIGGER update_total_stock_on_lot_update
    AFTER UPDATE ON product_lots
    FOR EACH ROW
    EXECUTE FUNCTION update_product_total_stock();

-- Trigger for DELETE operations
CREATE TRIGGER update_total_stock_on_lot_delete
    AFTER DELETE ON product_lots
    FOR EACH ROW
    EXECUTE FUNCTION update_product_total_stock();

-- Initialize total_stock for existing products
-- This will calculate and set the correct total_stock values for all existing products
UPDATE products 
SET total_stock = calculate_product_total_stock(id),
    updated_at = NOW();

-- Function to recalculate all product total stocks (for maintenance)
CREATE OR REPLACE FUNCTION recalculate_all_total_stocks()
RETURNS void AS $$
BEGIN
    UPDATE products 
    SET total_stock = calculate_product_total_stock(id),
        updated_at = NOW();
    
    RAISE NOTICE 'Total stock recalculated for all products';
END;
$$ LANGUAGE plpgsql;

-- Add comment to document the total_stock column
COMMENT ON COLUMN products.total_stock IS 'Automatically calculated sum of quantity_remaining from all product_lots for this product. Updated by triggers.';

-- Add comment to document the function
COMMENT ON FUNCTION update_product_total_stock() IS 'Trigger function that automatically updates total_stock in products table when product_lots are modified';
COMMENT ON FUNCTION calculate_product_total_stock(INTEGER) IS 'Calculates total stock for a product by summing quantity_remaining from all its lots';
COMMENT ON FUNCTION recalculate_all_total_stocks() IS 'Maintenance function to recalculate total_stock for all products';

-- =====================================================
-- Test Script for Total Stock Trigger Implementation
-- =====================================================

-- This script tests the total_stock trigger functionality
-- Run this after applying the 007_total_stock_implementation.sql migration

-- Test 1: Verify initial total_stock calculation
SELECT 
    p.id,
    p.name,
    p.product_code,
    p.current_stock,
    p.total_stock,
    COALESCE(SUM(pl.quantity_remaining), 0) as calculated_total_stock
FROM products p
LEFT JOIN product_lots pl ON p.id = pl.product_id
GROUP BY p.id, p.name, p.product_code, p.current_stock, p.total_stock
ORDER BY p.id;

-- Test 2: Insert a new product lot and verify total_stock updates
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
    1, -- Assuming product ID 1 exists
    'TEST-LOT-001',
    100.00,
    150.00,
    50,
    50,
    1, -- Assuming supplier ID 1 exists
    1  -- Assuming location ID 1 exists
);

-- Verify the total_stock was updated for product ID 1
SELECT 
    p.id,
    p.name,
    p.total_stock,
    COALESCE(SUM(pl.quantity_remaining), 0) as calculated_total_stock
FROM products p
LEFT JOIN product_lots pl ON p.id = pl.product_id
WHERE p.id = 1
GROUP BY p.id, p.name, p.total_stock;

-- Test 3: Update a product lot quantity and verify total_stock updates
UPDATE product_lots 
SET quantity_remaining = 25 
WHERE lot_number = 'TEST-LOT-001';

-- Verify the total_stock was updated for product ID 1
SELECT 
    p.id,
    p.name,
    p.total_stock,
    COALESCE(SUM(pl.quantity_remaining), 0) as calculated_total_stock
FROM products p
LEFT JOIN product_lots pl ON p.id = pl.product_id
WHERE p.id = 1
GROUP BY p.id, p.name, p.total_stock;

-- Test 4: Delete a product lot and verify total_stock updates
DELETE FROM product_lots WHERE lot_number = 'TEST-LOT-001';

-- Verify the total_stock was updated for product ID 1
SELECT 
    p.id,
    p.name,
    p.total_stock,
    COALESCE(SUM(pl.quantity_remaining), 0) as calculated_total_stock
FROM products p
LEFT JOIN product_lots pl ON p.id = pl.product_id
WHERE p.id = 1
GROUP BY p.id, p.name, p.total_stock;

-- Test 5: Test the recalculate function
SELECT recalculate_all_total_stocks();

-- Verify all products have correct total_stock
SELECT 
    p.id,
    p.name,
    p.total_stock,
    COALESCE(SUM(pl.quantity_remaining), 0) as calculated_total_stock,
    CASE 
        WHEN p.total_stock = COALESCE(SUM(pl.quantity_remaining), 0) THEN 'CORRECT'
        ELSE 'MISMATCH'
    END as status
FROM products p
LEFT JOIN product_lots pl ON p.id = pl.product_id
GROUP BY p.id, p.name, p.total_stock
ORDER BY p.id;

-- Test 6: Simulate a sale and verify total_stock updates correctly
-- First, let's see the current state
SELECT 
    p.id,
    p.name,
    p.total_stock,
    p.current_stock,
    p.total_sold
FROM products p
WHERE p.id = 1;

-- Insert a test sale (this will trigger the FIFO logic and update lots)
-- Note: You'll need to adjust the IDs based on your actual data
INSERT INTO sales (
    customer_id,
    sale_number,
    subtotal,
    discount_amount,
    tax_amount,
    total_amount,
    paid_amount,
    due_amount,
    payment_status,
    sale_status,
    location_id,
    created_by
) VALUES (
    1, -- Assuming customer ID 1 exists
    'TEST-SALE-001',
    100.00,
    0.00,
    10.00,
    110.00,
    110.00,
    0.00,
    'paid',
    'finalized',
    1, -- Assuming location ID 1 exists
    1  -- Assuming user ID 1 exists
);

-- Get the sale ID for the test sale
-- Insert a sale item (this will trigger the stock update)
INSERT INTO sale_items (
    sale_id,
    product_id,
    lot_id,
    quantity,
    unit_price,
    total_price
) VALUES (
    (SELECT id FROM sales WHERE sale_number = 'TEST-SALE-001'),
    1, -- Product ID 1
    (SELECT id FROM product_lots WHERE product_id = 1 AND quantity_remaining > 0 ORDER BY purchase_date ASC LIMIT 1),
    10, -- Quantity to sell
    15.00, -- Unit price
    150.00 -- Total price
);

-- Verify the total_stock was updated correctly after the sale
SELECT 
    p.id,
    p.name,
    p.total_stock,
    p.current_stock,
    p.total_sold,
    COALESCE(SUM(pl.quantity_remaining), 0) as calculated_total_stock
FROM products p
LEFT JOIN product_lots pl ON p.id = pl.product_id
WHERE p.id = 1
GROUP BY p.id, p.name, p.total_stock, p.current_stock, p.total_sold;

-- Clean up test data
DELETE FROM sale_items WHERE sale_id = (SELECT id FROM sales WHERE sale_number = 'TEST-SALE-001');
DELETE FROM sales WHERE sale_number = 'TEST-SALE-001';

-- Final verification: Check that all products have consistent total_stock
SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN p.total_stock = COALESCE(SUM(pl.quantity_remaining), 0) THEN 1 END) as correct_products,
    COUNT(CASE WHEN p.total_stock != COALESCE(SUM(pl.quantity_remaining), 0) THEN 1 END) as incorrect_products
FROM products p
LEFT JOIN product_lots pl ON p.id = pl.product_id
GROUP BY p.id
HAVING COUNT(*) > 0;

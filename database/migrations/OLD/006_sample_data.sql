-- =====================================================
-- Serrano Tex Inventory Management System
-- Database Migration: Sample Data
-- Version: 1.0.0
-- Created: 2025-01-10
-- =====================================================

-- =====================================================
-- 6. SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample locations
INSERT INTO locations (name, type, address, city, manager_name, manager_phone, status) VALUES
('Main Warehouse', 'warehouse', '123 Industrial Area, Dhaka', 'Dhaka', 'Ahmed Hassan', '+8801712345678', 'active'),
('Showroom Gulshan', 'showroom', '456 Gulshan Avenue, Dhaka', 'Dhaka', 'Fatima Khan', '+8801812345679', 'active'),
('Showroom Dhanmondi', 'showroom', '789 Dhanmondi Road, Dhaka', 'Dhaka', 'Rashid Ali', '+8801912345680', 'active'),
('Chittagong Warehouse', 'warehouse', '321 Port Area, Chittagong', 'Chittagong', 'Karim Uddin', '+8801612345681', 'active');

-- Insert sample users
INSERT INTO users (name, email, phone, role, assigned_location_id, can_add_sales_managers, status) VALUES
('Super Admin', 'admin@serranotex.com', '+8801712345678', 'super_admin', NULL, TRUE, 'active'),
('Admin User', 'admin1@serranotex.com', '+8801812345679', 'admin', 1, TRUE, 'active'),
('Sales Manager 1', 'sales1@serranotex.com', '+8801912345680', 'sales_manager', 2, FALSE, 'active'),
('Sales Manager 2', 'sales2@serranotex.com', '+8801612345681', 'sales_manager', 3, FALSE, 'active'),
('Investor', 'investor@serranotex.com', '+8801512345682', 'investor', NULL, FALSE, 'active');

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Cotton Fabrics', 'High-quality cotton fabrics for garments'),
('Silk Fabrics', 'Premium silk fabrics for luxury clothing'),
('Synthetic Fabrics', 'Durable synthetic fabrics for various uses'),
('Denim', 'Denim fabrics for jeans and casual wear'),
('Linen', 'Natural linen fabrics for summer clothing'),
('Wool', 'Warm wool fabrics for winter garments');

-- Insert sample suppliers
INSERT INTO suppliers (name, company_name, email, phone, address, payment_terms, status) VALUES
('Mohammad Rahman', 'Rahman Textiles Ltd.', 'info@rahmantextiles.com', '+8801712345683', '123 Textile Street, Dhaka', '30 days credit', 'active'),
('Fatima Begum', 'Begum Fabrics Co.', 'contact@begumfabrics.com', '+8801812345684', '456 Fabric Avenue, Chittagong', '45 days credit', 'active'),
('Ahmed Hossain', 'Hossain Mills', 'sales@hossainmills.com', '+8801912345685', '789 Mill Road, Sylhet', 'Cash on delivery', 'active'),
('Nasir Uddin', 'Uddin Textiles', 'nasir@uddintextiles.com', '+8801612345686', '321 Industrial Zone, Gazipur', '60 days credit', 'active');

-- Insert sample products
INSERT INTO products (name, product_code, category_id, description, purchase_price, selling_price, per_meter_price, supplier_id, location_id, minimum_threshold, current_stock, created_by) VALUES
('Premium Cotton White', 'COT-001', 1, 'High-quality white cotton fabric, 100% pure cotton', 250.00, 320.00, 32.00, 1, 1, 100, 500, 1),
('Silk Royal Blue', 'SLK-001', 2, 'Luxurious royal blue silk fabric', 800.00, 1200.00, 120.00, 2, 1, 50, 200, 1),
('Denim Classic Blue', 'DNM-001', 4, 'Classic blue denim fabric, medium weight', 180.00, 250.00, 25.00, 3, 2, 150, 300, 1),
('Linen Natural Beige', 'LIN-001', 5, 'Natural beige linen fabric, breathable', 320.00, 450.00, 45.00, 4, 2, 80, 150, 1),
('Synthetic Black', 'SYN-001', 3, 'Durable black synthetic fabric', 120.00, 180.00, 18.00, 1, 3, 200, 400, 1),
('Wool Grey', 'WOL-001', 6, 'Warm grey wool fabric for winter', 600.00, 850.00, 85.00, 2, 1, 60, 120, 1);

-- Insert sample customers
INSERT INTO customers (name, email, phone, address, company_name, customer_type, fixed_coupon) VALUES
('Karim Fashion House', 'info@karimfashion.com', '+8801712345687', '123 Fashion Street, Dhaka', 'Karim Fashion House Ltd.', 'wholesale', 'WHOLESALE10'),
('Fatima Boutique', 'fatima@boutique.com', '+8801812345688', '456 Boutique Lane, Dhaka', 'Fatima Boutique', 'vip', 'VIP15'),
('Rahman Garments', 'contact@rahmangarments.com', '+8801912345689', '789 Garment Road, Chittagong', 'Rahman Garments Ltd.', 'wholesale', 'BULK20'),
('Nasreen Tailors', 'nasreen@tailors.com', '+8801612345690', '321 Tailor Street, Sylhet', 'Nasreen Tailoring Services', 'regular', NULL),
('Ahmed Clothing', 'ahmed@clothing.com', '+8801512345691', '654 Clothing Avenue, Dhaka', 'Ahmed Clothing Co.', 'vip', 'PREMIUM12');

-- Insert sample product lots (for FIFO inventory)
INSERT INTO product_lots (product_id, lot_number, purchase_price, selling_price, quantity_purchased, quantity_remaining, supplier_id, location_id) VALUES
(1, 'LOT-COT-001-001', 250.00, 320.00, 300, 300, 1, 1),
(1, 'LOT-COT-001-002', 250.00, 320.00, 200, 200, 1, 1),
(2, 'LOT-SLK-001-001', 800.00, 1200.00, 100, 100, 2, 1),
(2, 'LOT-SLK-001-002', 800.00, 1200.00, 100, 100, 2, 1),
(3, 'LOT-DNM-001-001', 180.00, 250.00, 200, 200, 3, 2),
(3, 'LOT-DNM-001-002', 180.00, 250.00, 100, 100, 3, 2),
(4, 'LOT-LIN-001-001', 320.00, 450.00, 100, 100, 4, 2),
(4, 'LOT-LIN-001-002', 320.00, 450.00, 50, 50, 4, 2),
(5, 'LOT-SYN-001-001', 120.00, 180.00, 250, 250, 1, 3),
(5, 'LOT-SYN-001-002', 120.00, 180.00, 150, 150, 1, 3),
(6, 'LOT-WOL-001-001', 600.00, 850.00, 80, 80, 2, 1),
(6, 'LOT-WOL-001-002', 600.00, 850.00, 40, 40, 2, 1);

-- Insert sample sales
INSERT INTO sales (sale_number, customer_id, subtotal, discount_amount, tax_amount, total_amount, paid_amount, due_amount, payment_method, payment_status, sale_status, location_id, created_by) VALUES
('SALE-000001', 1, 8000.00, 800.00, 360.00, 7560.00, 7560.00, 0.00, 'bank_transfer', 'paid', 'finalized', 2, 3),
('SALE-000002', 2, 12000.00, 1800.00, 510.00, 10710.00, 5000.00, 5710.00, 'cash', 'partial', 'finalized', 2, 3),
('SALE-000003', 3, 15000.00, 3000.00, 600.00, 12600.00, 12600.00, 0.00, 'card', 'paid', 'finalized', 3, 4),
('SALE-000004', 4, 4500.00, 0.00, 225.00, 4725.00, 0.00, 4725.00, 'cash', 'pending', 'finalized', 2, 3);

-- Insert sample sale items
INSERT INTO sale_items (sale_id, product_id, lot_id, quantity, unit_price, total_price) VALUES
(1, 3, 5, 25, 250.00, 6250.00),
(1, 5, 9, 10, 180.00, 1800.00),
(2, 2, 3, 10, 1200.00, 12000.00),
(3, 1, 1, 30, 320.00, 9600.00),
(3, 4, 7, 12, 450.00, 5400.00),
(4, 5, 9, 25, 180.00, 4500.00);

-- Insert sample payments
INSERT INTO payments (sale_id, amount, payment_method, reference_number, notes, created_by) VALUES
(1, 7560.00, 'bank_transfer', 'TXN123456789', 'Full payment received', 3),
(2, 5000.00, 'cash', 'CASH001', 'Partial payment - cash', 3),
(3, 12600.00, 'card', 'CARD789123', 'Full payment by card', 4);

-- Insert sample transfers
INSERT INTO transfers (product_id, from_location_id, to_location_id, quantity, transfer_status, notes, requested_by) VALUES
(1, 1, 2, 50, 'completed', 'Transfer for showroom stock', 3),
(3, 2, 3, 30, 'in_transit', 'Moving stock to Dhanmondi showroom', 4),
(5, 3, 1, 25, 'requested', 'Return excess stock to warehouse', 4);

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, priority, related_id, related_type) VALUES
(1, 'Low Stock Alert', 'Product "Wool Grey" is running low. Current stock: 40, Minimum threshold: 60', 'low_stock', 'high', 6, 'product'),
(3, 'New Sale Created', 'Sale SALE-000001 has been created for customer Karim Fashion House', 'sale', 'normal', 1, 'sale'),
(4, 'Transfer Request', 'Transfer request for 25 units of Synthetic Black has been submitted', 'transfer', 'normal', 3, 'transfer'),
(2, 'Payment Received', 'Payment of ৳7,560 received for sale SALE-000001', 'payment', 'normal', 1, 'payment');

-- Insert sample activity logs
INSERT INTO activity_logs (user_id, action, module, description, credit_amount, debit_amount) VALUES
(1, 'CREATE', 'PRODUCT', 'Created product: Premium Cotton White (COT-001)', 0, 0),
(1, 'CREATE', 'CUSTOMER', 'Created customer: Karim Fashion House', 0, 0),
(3, 'CREATE', 'SALE', 'Created sale: SALE-000001 for amount: 7560.00', 7560.00, 0),
(3, 'RECEIVE', 'PAYMENT', 'Received payment of 7560.00 for sale SALE-000001', 7560.00, 0),
(4, 'CREATE', 'SALE', 'Created sale: SALE-000003 for amount: 12600.00', 12600.00, 0),
(4, 'REQUEST', 'TRANSFER', 'Requested transfer of 25 units from location 3 to 1', 0, 0);

-- Update sequences to avoid conflicts
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('locations_id_seq', (SELECT MAX(id) FROM locations));
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('suppliers_id_seq', (SELECT MAX(id) FROM suppliers));
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers));
SELECT setval('product_lots_id_seq', (SELECT MAX(id) FROM product_lots));
SELECT setval('sales_id_seq', (SELECT MAX(id) FROM sales));
SELECT setval('sale_items_id_seq', (SELECT MAX(id) FROM sale_items));
SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments));
SELECT setval('transfers_id_seq', (SELECT MAX(id) FROM transfers));
SELECT setval('notifications_id_seq', (SELECT MAX(id) FROM notifications));
SELECT setval('activity_logs_id_seq', (SELECT MAX(id) FROM activity_logs));

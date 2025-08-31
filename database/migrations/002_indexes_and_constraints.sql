-- =====================================================
-- Serrano Tex Inventory Management System
-- Database Migration: Indexes and Constraints
-- Version: 1.0.0
-- Created: 2025-01-10
-- =====================================================

-- =====================================================
-- 2. INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_assigned_location ON users(assigned_location_id);

-- Products table indexes
CREATE INDEX idx_products_code ON products(product_code);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_location ON products(location_id);
CREATE INDEX idx_products_status ON products(product_status);
CREATE INDEX idx_products_stock_level ON products(current_stock, minimum_threshold);
CREATE INDEX idx_products_created_by ON products(created_by);
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('english', name));

-- Customers table indexes
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_type ON customers(customer_type);
CREATE INDEX idx_customers_red_list ON customers(red_list_status);
CREATE INDEX idx_customers_name_search ON customers USING gin(to_tsvector('english', name));

-- Sales table indexes
CREATE INDEX idx_sales_number ON sales(sale_number);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_status ON sales(sale_status);
CREATE INDEX idx_sales_payment_status ON sales(payment_status);
CREATE INDEX idx_sales_location ON sales(location_id);
CREATE INDEX idx_sales_created_by ON sales(created_by);
CREATE INDEX idx_sales_date ON sales(created_at);
CREATE INDEX idx_sales_due_date ON sales(due_date);

-- Sale items table indexes
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);
CREATE INDEX idx_sale_items_lot ON sale_items(lot_id);

-- Product lots table indexes
CREATE INDEX idx_product_lots_product ON product_lots(product_id);
CREATE INDEX idx_product_lots_supplier ON product_lots(supplier_id);
CREATE INDEX idx_product_lots_location ON product_lots(location_id);
CREATE INDEX idx_product_lots_purchase_date ON product_lots(purchase_date);
CREATE INDEX idx_product_lots_expiry ON product_lots(expiry_date);
CREATE INDEX idx_product_lots_remaining ON product_lots(quantity_remaining) WHERE quantity_remaining > 0;

-- Payments table indexes
CREATE INDEX idx_payments_sale ON payments(sale_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_method ON payments(payment_method);
CREATE INDEX idx_payments_created_by ON payments(created_by);

-- Transfers table indexes
CREATE INDEX idx_transfers_product ON transfers(product_id);
CREATE INDEX idx_transfers_from_location ON transfers(from_location_id);
CREATE INDEX idx_transfers_to_location ON transfers(to_location_id);
CREATE INDEX idx_transfers_status ON transfers(transfer_status);
CREATE INDEX idx_transfers_requested_by ON transfers(requested_by);
CREATE INDEX idx_transfers_date ON transfers(requested_at);

-- Sample tracking table indexes
CREATE INDEX idx_sample_tracking_product ON sample_tracking(product_id);
CREATE INDEX idx_sample_tracking_customer ON sample_tracking(customer_id);
CREATE INDEX idx_sample_tracking_status ON sample_tracking(sample_status);
CREATE INDEX idx_sample_tracking_location ON sample_tracking(location_id);
CREATE INDEX idx_sample_tracking_date ON sample_tracking(given_date);

-- Notifications table indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_date ON notifications(created_at);

-- Activity logs table indexes
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_module ON activity_logs(module);
CREATE INDEX idx_activity_logs_date ON activity_logs(created_at);

-- Categories table indexes
CREATE INDEX idx_categories_name ON categories(name);

-- Suppliers table indexes
CREATE INDEX idx_suppliers_company ON suppliers(company_name);
CREATE INDEX idx_suppliers_status ON suppliers(status);
CREATE INDEX idx_suppliers_name_search ON suppliers USING gin(to_tsvector('english', company_name));

-- Locations table indexes
CREATE INDEX idx_locations_type ON locations(type);
CREATE INDEX idx_locations_status ON locations(status);
CREATE INDEX idx_locations_city ON locations(city);

-- =====================================================
-- 3. COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =====================================================

-- RLS-aware indexes for location-based queries
CREATE INDEX idx_products_location_status ON products(location_id, product_status);
CREATE INDEX idx_sales_location_date ON sales(location_id, created_at);
CREATE INDEX idx_transfers_locations_status ON transfers(from_location_id, to_location_id, transfer_status);

-- Performance indexes for dashboard queries
CREATE INDEX idx_sales_location_status_date ON sales(location_id, sale_status, created_at);
CREATE INDEX idx_products_location_stock ON products(location_id, current_stock, minimum_threshold);

-- Inventory management indexes
CREATE INDEX idx_product_lots_fifo ON product_lots(product_id, purchase_date, quantity_remaining) WHERE quantity_remaining > 0;
CREATE INDEX idx_sale_items_product_date ON sale_items(product_id, created_at);

-- Customer analysis indexes
CREATE INDEX idx_customers_type_purchases ON customers(customer_type, total_purchases);
CREATE INDEX idx_sales_customer_date ON sales(customer_id, created_at);

-- Financial reporting indexes
CREATE INDEX idx_sales_payment_date ON sales(payment_status, created_at);
CREATE INDEX idx_payments_date_amount ON payments(payment_date, amount);

-- =====================================================
-- 4. ADDITIONAL CONSTRAINTS
-- =====================================================

-- Foreign key constraints with proper naming
ALTER TABLE users ADD CONSTRAINT fk_users_assigned_location 
    FOREIGN KEY (assigned_location_id) REFERENCES locations(id);

-- Ensure red list customers have red list date
ALTER TABLE customers ADD CONSTRAINT chk_red_list_date 
    CHECK (NOT red_list_status OR red_list_since IS NOT NULL);

-- Ensure payment amounts don't exceed sale total
ALTER TABLE payments ADD CONSTRAINT chk_payment_amount_valid
    CHECK (amount <= (SELECT total_amount FROM sales WHERE id = sale_id));

-- Ensure transfer quantities don't exceed available stock
-- (This will be enforced by triggers)

-- Ensure sample quantities are reasonable
ALTER TABLE sample_tracking ADD CONSTRAINT chk_sample_quantity_reasonable
    CHECK (quantity <= 100); -- Adjust based on business needs

-- =====================================================
-- 5. UNIQUE CONSTRAINTS
-- =====================================================

-- Ensure unique sale numbers per location (if needed)
-- CREATE UNIQUE INDEX idx_sales_number_location ON sales(sale_number, location_id);

-- Ensure unique product codes (already handled in table definition)
-- Additional unique constraints can be added here as needed

-- =====================================================
-- 6. CHECK CONSTRAINTS FOR BUSINESS RULES
-- =====================================================

-- Ensure due dates are in the future for pending payments
ALTER TABLE sales ADD CONSTRAINT chk_due_date_future
    CHECK (due_date IS NULL OR due_date >= CURRENT_DATE OR payment_status = 'paid');

-- Ensure expiry dates are after purchase dates
ALTER TABLE product_lots ADD CONSTRAINT chk_expiry_after_purchase
    CHECK (expiry_date IS NULL OR expiry_date > purchase_date);

-- Ensure transfer approval logic
ALTER TABLE transfers ADD CONSTRAINT chk_transfer_approval_logic
    CHECK (
        (transfer_status = 'requested' AND approved_by IS NULL AND approved_at IS NULL) OR
        (transfer_status != 'requested' AND approved_by IS NOT NULL AND approved_at IS NOT NULL)
    );

-- Ensure sample return logic
ALTER TABLE sample_tracking ADD CONSTRAINT chk_sample_return_logic
    CHECK (
        (sample_status != 'returned' AND return_date IS NULL) OR
        (sample_status = 'returned' AND return_date IS NOT NULL AND return_date >= given_date)
    );

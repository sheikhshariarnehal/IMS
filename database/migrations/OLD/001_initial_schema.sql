-- =====================================================
-- Serrano Tex Inventory Management System
-- Database Migration: Initial Schema
-- Version: 1.0.0
-- Created: 2025-01-10
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. CORE TABLES
-- =====================================================

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin', 'sales_manager', 'investor')),
    permissions JSONB DEFAULT '{}',
    assigned_location_id INTEGER,
    can_add_sales_managers BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    profile_picture TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations table
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('warehouse', 'showroom')),
    address TEXT NOT NULL,
    city VARCHAR(50),
    capacity INTEGER,
    manager_name VARCHAR(100),
    manager_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    payment_terms TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    product_code VARCHAR(50) UNIQUE NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    description TEXT,
    purchase_price DECIMAL(10,2) NOT NULL CHECK (purchase_price >= 0),
    selling_price DECIMAL(10,2) NOT NULL CHECK (selling_price >= 0),
    per_meter_price DECIMAL(10,2) CHECK (per_meter_price >= 0),
    supplier_id INTEGER REFERENCES suppliers(id),
    location_id INTEGER REFERENCES locations(id),
    minimum_threshold INTEGER DEFAULT 100 CHECK (minimum_threshold >= 0),
    current_stock DECIMAL(10,2) DEFAULT 0 CHECK (current_stock >= 0),
    total_purchased DECIMAL(10,2) DEFAULT 0 CHECK (total_purchased >= 0),
    total_sold DECIMAL(10,2) DEFAULT 0 CHECK (total_sold >= 0),
    wastage_status BOOLEAN DEFAULT FALSE,
    product_status VARCHAR(20) DEFAULT 'active' CHECK (product_status IN ('active', 'slow', 'inactive')),
    images JSONB DEFAULT '[]',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sold TIMESTAMP WITH TIME ZONE,
    
    -- Business logic constraints
    CONSTRAINT selling_price_greater_than_purchase CHECK (selling_price > purchase_price)
);

-- Customers table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    company_name VARCHAR(100),
    delivery_address TEXT,
    customer_type VARCHAR(20) DEFAULT 'regular' CHECK (customer_type IN ('vip', 'wholesale', 'regular')),
    total_purchases DECIMAL(12,2) DEFAULT 0 CHECK (total_purchases >= 0),
    total_due DECIMAL(12,2) DEFAULT 0 CHECK (total_due >= 0),
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    red_list_status BOOLEAN DEFAULT FALSE,
    red_list_since TIMESTAMP WITH TIME ZONE,
    fixed_coupon VARCHAR(50),
    profile_picture TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product lots table (for FIFO inventory management)
CREATE TABLE product_lots (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    lot_number VARCHAR(50) NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL CHECK (purchase_price >= 0),
    selling_price DECIMAL(10,2) NOT NULL CHECK (selling_price >= 0),
    quantity_purchased DECIMAL(10,2) NOT NULL CHECK (quantity_purchased > 0),
    quantity_remaining DECIMAL(10,2) NOT NULL CHECK (quantity_remaining >= 0),
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE,
    supplier_id INTEGER REFERENCES suppliers(id),
    location_id INTEGER REFERENCES locations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(product_id, lot_number),
    CONSTRAINT quantity_remaining_valid CHECK (quantity_remaining <= quantity_purchased)
);

-- Sales table
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    sale_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    discount_amount DECIMAL(12,2) DEFAULT 0 CHECK (discount_amount >= 0),
    tax_amount DECIMAL(12,2) DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
    paid_amount DECIMAL(12,2) DEFAULT 0 CHECK (paid_amount >= 0),
    due_amount DECIMAL(12,2) DEFAULT 0 CHECK (due_amount >= 0),
    due_date DATE,
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'mobile_banking')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('paid', 'partial', 'pending', 'overdue')),
    sale_status VARCHAR(20) DEFAULT 'draft' CHECK (sale_status IN ('draft', 'finalized', 'cancelled')),
    delivery_person VARCHAR(100),
    delivery_photo TEXT,
    location_id INTEGER REFERENCES locations(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT total_amount_calculation CHECK (total_amount = subtotal - discount_amount + tax_amount),
    CONSTRAINT due_amount_calculation CHECK (due_amount = total_amount - paid_amount)
);

-- Sale items table
CREATE TABLE sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    lot_id INTEGER NOT NULL REFERENCES product_lots(id),
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT total_price_calculation CHECK (total_price = quantity * unit_price)
);

-- Payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'mobile_banking')),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reference_number VARCHAR(100),
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transfers table
CREATE TABLE transfers (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    from_location_id INTEGER NOT NULL REFERENCES locations(id),
    to_location_id INTEGER NOT NULL REFERENCES locations(id),
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    transfer_status VARCHAR(20) DEFAULT 'requested' CHECK (transfer_status IN ('requested', 'approved', 'in_transit', 'completed', 'cancelled')),
    notes TEXT,
    requested_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT different_locations CHECK (from_location_id != to_location_id)
);

-- Sample tracking table
CREATE TABLE sample_tracking (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    sample_status VARCHAR(20) DEFAULT 'given' CHECK (sample_status IN ('given', 'returned', 'sold', 'lost')),
    given_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    return_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    given_by INTEGER REFERENCES users(id),
    location_id INTEGER REFERENCES locations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('low_stock', 'sale', 'payment', 'transfer', 'system', 'red_list')),
    is_read BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    related_id INTEGER,
    related_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs table
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    credit_amount DECIMAL(12,2) DEFAULT 0 CHECK (credit_amount >= 0),
    debit_amount DECIMAL(12,2) DEFAULT 0 CHECK (debit_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

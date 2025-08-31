# Serrano Tex - Inventory Management System
## Complete Database Design & Schema Documentation

---

## 🎯 System Overview

**Project**: Wholesale Fabric Inventory Management System  
**Company**: Serrano Tex (Bangladesh)  
**Tech Stack**: React Native + Database Backend  
**Purpose**: Multi-location inventory, sales, and user management with role-based access control

---

## 🔐 User Roles & Access Control

| Role | Permissions | Access Scope |
|------|------------|--------------|
| **Super Admin** | Full system access, user management, all CRUD operations | All locations, all data |
| **Admin** | Configurable permissions, product/sales/inventory management | Assigned locations/modules |
| **Sales Manager** | Sales, inventory view, customer management | Single assigned location only |
| **Investor** | Read-only dashboard access | View financial summaries only |

---

## 📊 Complete Database Schema

### 1. **Users Table**
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| name | VARCHAR(100) | NOT NULL | Full name |
| email | VARCHAR(100) | UNIQUE, NOT NULL | Login email |
| phone | VARCHAR(20) | | Phone number |
| password_hash | VARCHAR(255) | NOT NULL | Encrypted password |
| role | ENUM | NOT NULL | 'super_admin', 'admin', 'sales_manager', 'investor' |
| permissions | JSON | | Admin-specific permissions array |
| assigned_location_id | INT | FOREIGN KEY | Single location for sales managers |
| can_add_sales_managers | BOOLEAN | DEFAULT FALSE | Permission flag |
| status | ENUM | DEFAULT 'active' | 'active', 'inactive' |
| profile_picture | VARCHAR(255) | | Image URL |
| last_login | TIMESTAMP | | Last login time |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | |

---

### 2. **Categories Table**
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique category identifier |
| name | VARCHAR(100) | NOT NULL | Category name |
| description | TEXT | | Category description |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | |

---

### 3. **Suppliers Table**
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique supplier identifier |
| name | VARCHAR(100) | NOT NULL | Contact person name |
| company_name | VARCHAR(150) | NOT NULL | Company name |
| email | VARCHAR(100) | | Contact email |
| phone | VARCHAR(20) | | Contact phone |
| address | TEXT | | Full address |
| payment_terms | TEXT | | Payment terms and conditions |
| status | ENUM | DEFAULT 'active' | 'active', 'inactive' |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | |

---

### 4. **Locations Table**
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique location identifier |
| name | VARCHAR(100) | NOT NULL | Location name |
| type | ENUM | NOT NULL | 'warehouse', 'showroom' |
| address | TEXT | NOT NULL | Full address |
| city | VARCHAR(50) | | City name |
| capacity | INT | | Storage capacity |
| manager_name | VARCHAR(100) | | Manager name |
| manager_phone | VARCHAR(20) | | Manager phone |
| status | ENUM | DEFAULT 'active' | 'active', 'inactive' |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | |

---

### 5. **Products Table**
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique product identifier |
| name | VARCHAR(150) | NOT NULL | Product name |
| product_code | VARCHAR(50) | UNIQUE, NOT NULL | Product code |
| category_id | INT | FOREIGN KEY | References categories(id) |
| description | TEXT | | Product description |
| purchase_price | DECIMAL(10,2) | NOT NULL | Purchase price |
| selling_price | DECIMAL(10,2) | NOT NULL | Selling price |
| per_meter_price | DECIMAL(10,2) | | Auto-calculated price per meter |
| supplier_id | INT | FOREIGN KEY | References suppliers(id) |
| location_id | INT | FOREIGN KEY | References locations(id) |
| minimum_threshold | INT | DEFAULT 100 | Minimum stock threshold |
| current_stock | DECIMAL(10,2) | DEFAULT 0 | Current available stock |
| total_purchased | DECIMAL(10,2) | DEFAULT 0 | Total purchased quantity |
| total_sold | DECIMAL(10,2) | DEFAULT 0 | Total sold quantity |
| wastage_status | BOOLEAN | DEFAULT FALSE | Is in wastage |
| product_status | ENUM | DEFAULT 'active' | 'active', 'slow', 'inactive' |
| images | JSON | | Array of image URLs |
| created_by | INT | FOREIGN KEY | References users(id) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | |
| last_sold | TIMESTAMP | | Last sale date |

---

### 6. **Product_Lots Table** (FIFO Implementation)
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique lot identifier |
| product_id | INT | FOREIGN KEY | References products(id) |
| lot_number | INT | NOT NULL | Lot sequence (1, 2, 3...) |
| purchase_quantity | DECIMAL(10,2) | NOT NULL | Purchased quantity |
| remaining_quantity | DECIMAL(10,2) | NOT NULL | Remaining quantity |
| purchase_price | DECIMAL(10,2) | NOT NULL | Purchase price for this lot |
| purchase_date | DATE | NOT NULL | Purchase date |
| payment_status | ENUM | DEFAULT 'pending' | 'paid', 'partial', 'pending' |
| due_date | DATE | | Payment due date |
| supplier_id | INT | FOREIGN KEY | References suppliers(id) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |

---

### 7. **Customers Table**
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique customer identifier |
| name | VARCHAR(100) | NOT NULL | Customer name |
| email | VARCHAR(100) | | Customer email |
| phone | VARCHAR(20) | | Customer phone |
| address | TEXT | | Billing address |
| company_name | VARCHAR(150) | | Company name (optional) |
| delivery_address | TEXT | | Delivery address |
| customer_type | ENUM | DEFAULT 'regular' | 'vip', 'wholesale', 'regular' |
| total_purchases | DECIMAL(12,2) | DEFAULT 0 | Lifetime purchase amount |
| total_due | DECIMAL(10,2) | DEFAULT 0 | Total outstanding amount |
| last_purchase_date | DATE | | Last purchase date |
| red_list_status | BOOLEAN | DEFAULT FALSE | Overdue payment flag |
| red_list_since | DATE | | Date added to red list |
| fixed_coupon | VARCHAR(20) | | Assigned fixed coupon |
| profile_picture | VARCHAR(255) | | Profile image URL |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | |

---

### 8. **Sales Table**
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique sale identifier |
| sale_number | VARCHAR(50) | UNIQUE, NOT NULL | Generated sale number |
| customer_id | INT | FOREIGN KEY | References customers(id) |
| subtotal | DECIMAL(10,2) | NOT NULL | Subtotal amount |
| discount_amount | DECIMAL(10,2) | DEFAULT 0 | Discount applied |
| tax_amount | DECIMAL(10,2) | DEFAULT 0 | Tax amount |
| total_amount | DECIMAL(10,2) | NOT NULL | Final total |
| paid_amount | DECIMAL(10,2) | DEFAULT 0 | Amount paid |
| due_amount | DECIMAL(10,2) | DEFAULT 0 | Amount due |
| due_date | DATE | | Payment due date |
| payment_method | ENUM | | 'cash', 'card', 'bank_transfer' |
| payment_status | ENUM | DEFAULT 'pending' | 'paid', 'partial', 'pending', 'overdue' |
| sale_status | ENUM | DEFAULT 'draft' | 'draft', 'finalized', 'cancelled' |
| delivery_person | VARCHAR(100) | | Delivery person name |
| delivery_photo | VARCHAR(255) | | Delivery photo URL |
| location_id | INT | FOREIGN KEY | References locations(id) |
| created_by | INT | FOREIGN KEY | References users(id) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | |

---

### 9. **Sale_Items Table**
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique sale item identifier |
| sale_id | INT | FOREIGN KEY | References sales(id) |
| product_id | INT | FOREIGN KEY | References products(id) |
| lot_id | INT | FOREIGN KEY | References product_lots(id) |
| quantity | DECIMAL(10,2) | NOT NULL | Sold quantity |
| unit_price | DECIMAL(10,2) | NOT NULL | Price per unit |
| total_price | DECIMAL(10,2) | NOT NULL | Total price for this item |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |

---

### 10. **Transfers Table**
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique transfer identifier |
| product_id | INT | FOREIGN KEY | References products(id) |
| from_location_id | INT | FOREIGN KEY | References locations(id) |
| to_location_id | INT | FOREIGN KEY | References locations(id) |
| quantity | DECIMAL(10,2) | NOT NULL | Transfer quantity |
| transfer_status | ENUM | DEFAULT 'requested' | 'requested', 'approved', 'in_transit', 'completed', 'rejected' |
| requested_by | INT | FOREIGN KEY | References users(id) |
| approved_by | INT | FOREIGN KEY | References users(id) |
| notes | TEXT | | Transfer notes |
| requested_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |
| approved_at | TIMESTAMP | | Approval timestamp |
| completed_at | TIMESTAMP | | Completion timestamp |

---

### 11. **Sample_Tracking Table**
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique sample identifier |
| product_id | INT | FOREIGN KEY | References products(id) |
| customer_id | INT | FOREIGN KEY | References customers(id) |
| lot_id | INT | FOREIGN KEY | References product_lots(id) |
| quantity | DECIMAL(10,2) | NOT NULL | Sample quantity |
| cost | DECIMAL(10,2) | DEFAULT 0 | Sample cost |
| purpose | VARCHAR(200) | | Sample purpose |
| delivery_address | TEXT | | Delivery address |
| delivery_person | VARCHAR(100) | | Delivery person |
| expected_return_date | DATE | | Expected return date |
| actual_return_date | DATE | | Actual return date |
| sample_status | ENUM | DEFAULT 'requested' | 'requested', 'prepared', 'delivered', 'returned', 'converted', 'lost', 'expired' |
| conversion_sale_id | INT | FOREIGN KEY | References sales(id) if converted |
| notes | TEXT | | Additional notes |
| created_by | INT | FOREIGN KEY | References users(id) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | |

---

### 12. **Payments Table**
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique payment identifier |
| sale_id | INT | FOREIGN KEY | References sales(id) |
| customer_id | INT | FOREIGN KEY | References customers(id) |
| amount | DECIMAL(10,2) | NOT NULL | Payment amount |
| payment_method | ENUM | NOT NULL | 'cash', 'card', 'bank_transfer', 'mobile_banking' |
| payment_date | DATE | NOT NULL | Payment date |
| reference_number | VARCHAR(100) | | Bank/card reference |
| notes | TEXT | | Payment notes |
| created_by | INT | FOREIGN KEY | References users(id) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |

---

### 13. **Activity_Logs Table**
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique log identifier |
| user_id | INT | FOREIGN KEY | References users(id) |
| action | VARCHAR(50) | NOT NULL | Action performed |
| module | VARCHAR(50) | NOT NULL | Module/table affected |
| entity_type | VARCHAR(50) | | Entity type |
| entity_id | INT | | Entity ID |
| entity_name | VARCHAR(200) | | Entity name/description |
| description | TEXT | | Action description |
| old_values | JSON | | Previous values |
| new_values | JSON | | New values |
| ip_address | VARCHAR(45) | | User IP address |
| user_agent | TEXT | | User agent string |
| credit_amount | DECIMAL(10,2) | DEFAULT 0 | Credit amount |
| debit_amount | DECIMAL(10,2) | DEFAULT 0 | Debit amount |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |

---

### 14. **Notifications Table**
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique notification identifier |
| user_id | INT | FOREIGN KEY | References users(id) |
| title | VARCHAR(200) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification message |
| type | ENUM | NOT NULL | 'info', 'warning', 'error', 'success' |
| category | ENUM | NOT NULL | 'inventory', 'sales', 'customers', 'samples', 'payments', 'system', 'security' |
| priority | ENUM | DEFAULT 'medium' | 'low', 'medium', 'high', 'critical' |
| is_read | BOOLEAN | DEFAULT FALSE | Read status |
| action_url | VARCHAR(255) | | Related action URL |
| expires_at | TIMESTAMP | | Expiration time |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |
| read_at | TIMESTAMP | | Read timestamp |

---

### 15. **Reports Table**
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique report identifier |
| name | VARCHAR(150) | NOT NULL | Report name |
| type | ENUM | NOT NULL | 'sales', 'inventory', 'customer', 'financial', 'sample' |
| parameters | JSON | | Report parameters |
| schedule | ENUM | | 'daily', 'weekly', 'monthly', 'quarterly' |
| format | ENUM | DEFAULT 'pdf' | 'pdf', 'excel', 'csv', 'json' |
| is_scheduled | BOOLEAN | DEFAULT FALSE | Scheduled report flag |
| last_generated | TIMESTAMP | | Last generation time |
| created_by | INT | FOREIGN KEY | References users(id) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | |

---

### 16. **Settings Table**
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique setting identifier |
| key_name | VARCHAR(100) | UNIQUE, NOT NULL | Setting key |
| value | TEXT | | Setting value |
| type | ENUM | DEFAULT 'string' | 'string', 'number', 'boolean', 'json' |
| category | VARCHAR(50) | | Setting category |
| description | TEXT | | Setting description |
| is_public | BOOLEAN | DEFAULT FALSE | Public setting flag |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | |

---

## 🔗 Database Relationships

### Primary Relationships:
- **Users** → **Locations** (Sales Manager assignment)
- **Products** → **Categories** (Product categorization)
- **Products** → **Suppliers** (Product sourcing)
- **Products** → **Locations** (Product location)
- **Product_Lots** → **Products** (FIFO lot tracking)
- **Sales** → **Customers** (Customer purchases)
- **Sale_Items** → **Sales** & **Products** (Sale details)
- **Transfers** → **Products** & **Locations** (Inventory movement)
- **Sample_Tracking** → **Products** & **Customers** (Sample management)
- **Payments** → **Sales** & **Customers** (Payment tracking)

### Audit Relationships:
- **Activity_Logs** → **Users** (User action tracking)
- **Notifications** → **Users** (User notifications)
- **Reports** → **Users** (Report ownership)

---

## 📈 Business Logic Implementation

### 🔄 FIFO (First In, First Out) System
```sql
-- When selling products, always use oldest lots first
SELECT * FROM product_lots 
WHERE product_id = ? AND remaining_quantity > 0 
ORDER BY purchase_date ASC, lot_number ASC;
```

### 🚨 Red List Management
```sql
-- Automatically flag customers with 60+ days overdue
UPDATE customers 
SET red_list_status = TRUE, red_list_since = CURDATE()
WHERE total_due > 0 AND last_purchase_date < DATE_SUB(CURDATE(), INTERVAL 60 DAY);
```

### 📊 Stock Threshold Alerts
```sql
-- Get low stock products
SELECT p.*, (p.current_stock - p.minimum_threshold) as stock_deficit
FROM products p 
WHERE p.current_stock <= p.minimum_threshold 
AND p.wastage_status = FALSE;
```

### 🔄 Sample Conversion Tracking
```sql
-- Track sample to sale conversion
SELECT 
  COUNT(*) as total_samples,
  COUNT(conversion_sale_id) as converted_samples,
  (COUNT(conversion_sale_id) / COUNT(*) * 100) as conversion_rate
FROM sample_tracking 
WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);
```

---

## 🔐 Row-Level Security (RLS) Implementation

### **Why RLS is Essential for Your System:**
- **Location-based Access**: Sales managers only see their assigned location data
- **Data Isolation**: Automatic filtering without application logic
- **Security at Database Level**: Cannot be bypassed by application bugs
- **Multi-tenant Support**: Perfect for multi-location inventory system

### **RLS Policies for Your System:**

#### 1. **User Context Functions**
```sql
-- Get current user's ID from session
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS INTEGER AS $
BEGIN
    -- This would be set by your application when user logs in
    RETURN current_setting('app.current_user_id')::INTEGER;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $
BEGIN
    RETURN (
        SELECT role 
        FROM users 
        WHERE id = get_current_user_id()
    );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's assigned location(s)
CREATE OR REPLACE FUNCTION get_current_user_locations()
RETURNS INTEGER[] AS $
DECLARE
    user_role TEXT;
    user_permissions JSON;
    assigned_location INTEGER;
BEGIN
    SELECT role, permissions, assigned_location_id 
    INTO user_role, user_permissions, assigned_location
    FROM users 
    WHERE id = get_current_user_id();
    
    -- Super Admin: All locations
    IF user_role = 'super_admin' THEN
        RETURN ARRAY(SELECT id FROM locations WHERE status = 'active');
    END IF;
    
    -- Sales Manager: Only assigned location
    IF user_role = 'sales_manager' THEN
        RETURN ARRAY[assigned_location];
    END IF;
    
    -- Admin: Parse permissions JSON for allowed locations
    IF user_role = 'admin' THEN
        -- Extract location IDs from permissions JSON
        -- Format: {"locations": [1, 2, 3]}
        RETURN ARRAY(
            SELECT jsonb_array_elements_text(user_permissions->'locations')::INTEGER
        );
    END IF;
    
    -- Investor: All locations (read-only handled by other policies)
    IF user_role = 'investor' THEN
        RETURN ARRAY(SELECT id FROM locations WHERE status = 'active');
    END IF;
    
    RETURN ARRAY[]::INTEGER[];
END;
$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2. **Products Table RLS**
```sql
-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see products from their allowed locations
CREATE POLICY products_location_policy ON products
    FOR ALL
    TO public
    USING (
        location_id = ANY(get_current_user_locations())
    );

-- Policy: Only Super Admin and Admin can insert products
CREATE POLICY products_insert_policy ON products
    FOR INSERT
    TO public
    WITH CHECK (
        get_current_user_role() IN ('super_admin', 'admin')
    );
```

#### 3. **Sales Table RLS**
```sql
-- Enable RLS on sales table
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see sales from their allowed locations
CREATE POLICY sales_location_policy ON sales
    FOR ALL
    TO public
    USING (
        location_id = ANY(get_current_user_locations())
    );

-- Policy: Read-only for investors
CREATE POLICY sales_readonly_policy ON sales
    FOR UPDATE, DELETE
    TO public
    USING (
        get_current_user_role() != 'investor'
    );
```

#### 4. **Customers Table RLS**
```sql
-- Enable RLS on customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy: Customers visible based on sales history from allowed locations
CREATE POLICY customers_sales_policy ON customers
    FOR ALL
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM sales s 
            WHERE s.customer_id = customers.id 
            AND s.location_id = ANY(get_current_user_locations())
        )
        OR get_current_user_role() IN ('super_admin', 'admin')
    );
```

#### 5. **Transfers Table RLS**
```sql
-- Enable RLS on transfers table
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see transfers involving their locations
CREATE POLICY transfers_location_policy ON transfers
    FOR ALL
    TO public
    USING (
        from_location_id = ANY(get_current_user_locations())
        OR to_location_id = ANY(get_current_user_locations())
        OR get_current_user_role() = 'super_admin'
    );
```

#### 6. **Sample Tracking RLS**
```sql
-- Enable RLS on sample_tracking table
ALTER TABLE sample_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Based on product location
CREATE POLICY sample_tracking_policy ON sample_tracking
    FOR ALL
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM products p 
            WHERE p.id = sample_tracking.product_id 
            AND p.location_id = ANY(get_current_user_locations())
        )
    );
```

#### 7. **Activity Logs RLS**
```sql
-- Enable RLS on activity_logs table
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users see logs for their allowed scope
CREATE POLICY activity_logs_policy ON activity_logs
    FOR SELECT
    TO public
    USING (
        -- Super Admin sees everything
        get_current_user_role() = 'super_admin'
        OR 
        -- Others see logs related to their locations/actions
        (
            user_id = get_current_user_id()
            OR EXISTS (
                -- Logs related to products in their locations
                SELECT 1 FROM products p 
                WHERE p.id = activity_logs.entity_id::INTEGER 
                AND activity_logs.entity_type = 'product'
                AND p.location_id = ANY(get_current_user_locations())
            )
        )
    );
```

#### 8. **User Management RLS**
```sql
-- Enable RLS on users table (sensitive!)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see themselves and those in their management scope
CREATE POLICY users_management_policy ON users
    FOR SELECT
    TO public
    USING (
        id = get_current_user_id() -- Always see yourself
        OR get_current_user_role() = 'super_admin' -- Super admin sees all
        OR (
            -- Admins see users in their locations
            get_current_user_role() = 'admin' 
            AND assigned_location_id = ANY(get_current_user_locations())
        )
    );

-- Policy: Only Super Admin can create users
CREATE POLICY users_create_policy ON users
    FOR INSERT
    TO public
    WITH CHECK (
        get_current_user_role() = 'super_admin'
    );
```

## 🚀 Implementation Guidelines

### 1. **RLS Session Management**
```sql
-- Set user context at login (call this when user logs in)
SELECT set_config('app.current_user_id', '123', false); -- User ID 123
```

### 2. **Application Integration**
```javascript
// In your Node.js/Express app
app.use((req, res, next) => {
    if (req.user) {
        // Set user context for this database session
        db.query(`SELECT set_config('app.current_user_id', '${req.user.id}', false)`);
    }
    next();
});
```

### 3. **Indexing Strategy**
```sql
-- Primary indexes for performance
CREATE INDEX idx_products_location ON products(location_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_date ON sales(created_at);
CREATE INDEX idx_sales_location ON sales(location_id); -- For RLS
CREATE INDEX idx_transfers_locations ON transfers(from_location_id, to_location_id); -- For RLS
CREATE INDEX idx_activity_logs_user_date ON activity_logs(user_id, created_at);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_users_location ON users(assigned_location_id); -- For RLS
```

### 4. **Data Validation Rules**
- **Email Format**: Valid email format for users and customers
- **Phone Format**: Consistent phone number formatting
- **Price Validation**: Selling price should be >= purchase price
- **Stock Validation**: Cannot sell more than available stock
- **Date Validation**: Due dates must be future dates
- **Location Access**: Validate user has access to specified locations

### 5. **Security Considerations**
- **Password Hashing**: Use bcrypt or similar for password storage
- **Role-based Access**: Implement middleware for route protection
- **Row-Level Security**: Database-level access control with RLS policies
- **Input Sanitization**: Prevent SQL injection and XSS
- **Session Management**: Secure session handling with user context
- **Audit Trail**: Log all critical operations with location context

### 6. **Performance Optimization**
- **Database Connection Pooling**: Efficient connection management
- **Query Optimization**: Use appropriate indexes and query structure with RLS awareness
- **RLS Performance**: Optimize RLS policies with proper indexing on filtered columns
- **Caching Strategy**: Cache user permissions and location mappings
- **Pagination**: Implement pagination for large datasets with RLS-aware queries
- **Image Storage**: Use CDN for image storage and delivery

### 7. **RLS Testing & Validation**
```sql
-- Test RLS policies with different user contexts
-- Test as Sales Manager (User ID 2, Location 1)
SELECT set_config('app.current_user_id', '2', false);
SELECT * FROM products; -- Should only show Location 1 products

-- Test as Admin (User ID 3, Multiple Locations)
SELECT set_config('app.current_user_id', '3', false);
SELECT * FROM sales; -- Should show sales from assigned locations

-- Test as Super Admin (User ID 1)
SELECT set_config('app.current_user_id', '1', false);
SELECT * FROM transfers; -- Should show all transfers
```

### 8. **RLS Monitoring & Maintenance**
```sql
-- Monitor RLS performance
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check RLS is enabled on tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

---

## ✅ Integration Checklist

### Backend Development:
- [ ] Set up database with all tables and relationships
- [ ] **Implement RLS policies for all tables**
- [ ] **Set up user context management in application**
- [ ] **Test RLS with different user roles and scenarios**
- [ ] Implement authentication and authorization
- [ ] Create RESTful APIs for all modules
- [ ] Set up FIFO logic for inventory management
- [ ] Implement automated notifications
- [ ] Create report generation system
- [ ] Set up activity logging with location context
- [ ] Implement file upload for images
- [ ] **Add RLS-aware query optimization**
- [ ] **Monitor RLS policy performance**

### Frontend Integration:
- [ ] Replace mock data with API calls
- [ ] **Implement location-based UI filtering**
- [ ] **Test role-based access restrictions**
- [ ] Implement real-time updates
- [ ] Add offline support with local storage
- [ ] Set up push notifications
- [ ] Implement file upload components
- [ ] Add export functionality
- [ ] Create print-friendly invoice templates
- [ ] Set up error handling and loading states
- [ ] **Add location selector for admins**
- [ ] **Implement permission-based UI components**

---

## 🎯 Success Metrics

### Technical Metrics:
- **Response Time**: < 200ms for standard queries (< 300ms for RLS-filtered queries)
- **Uptime**: 99.9% system availability
- **Concurrent Users**: Support 50+ simultaneous users with RLS
- **Data Integrity**: Zero data loss with proper backups
- **Security Compliance**: 100% data isolation between locations
- **RLS Performance**: < 50ms overhead for security policies

### Business Metrics:
- **Inventory Accuracy**: 99%+ stock level accuracy per location
- **Order Processing**: < 2 minutes average processing time
- **User Adoption**: 90%+ daily active user rate
- **Error Rate**: < 1% transaction error rate
- **Security Incidents**: Zero unauthorized data access
- **Multi-location Efficiency**: Independent location operations

---

## 📞 Support & Documentation

This comprehensive database design provides:
- ✅ **Complete Schema**: All tables with proper relationships
- ✅ **Role-based Security**: Multi-level access control
- ✅ **Row-Level Security**: Database-level data isolation
- ✅ **Location-based Access**: Automatic filtering by assigned locations
- ✅ **Business Logic**: FIFO, red list, notifications
- ✅ **Scalability**: Designed for growth and expansion
- ✅ **Audit Trail**: Complete activity logging with security context
- ✅ **Performance**: Optimized for speed and efficiency with RLS
- ✅ **Multi-tenant Support**: Perfect for multi-location operations
- ✅ **Security Compliance**: Enterprise-grade access control

**Ready for**: Client presentation, developer handoff, database implementation, security audit, and enterprise deployment.
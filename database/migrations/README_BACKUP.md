# Complete Database Backup for IMS-2.0 Project

## Overview
This backup contains the complete database schema and logic from your Supabase project (ID: dbwoaiihjffzfqsozgjn) including all tables, functions, triggers, views, RLS policies, and indexes.

## What's Included

### 1. Extensions
- `uuid-ossp` - For UUID generation
- `pgcrypto` - For password hashing and encryption

### 2. Custom Types (ENUMs)
- `customer_type` - vip, wholesale, regular
- `location_status` - active, inactive
- `location_type` - warehouse, showroom
- `notification_category` - inventory, sales, customers, samples, payments, system, security
- `notification_priority` - low, medium, high, critical
- `notification_type` - info, warning, error, success
- `payment_method` - cash, card, bank_transfer, mobile_banking
- `payment_status` - paid, partial, pending
- `product_status` - active, slow, inactive
- `report_format` - pdf, excel, csv, json
- `report_schedule` - daily, weekly, monthly, quarterly
- `report_type` - sales, inventory, customer, financial, sample
- `sale_payment_status` - paid, partial, pending, overdue
- `sale_status` - draft, finalized, cancelled
- `sample_status` - requested, prepared, delivered, returned, converted, lost, expired
- `setting_type` - string, number, boolean, json
- `supplier_status` - active, inactive
- `transfer_status` - requested, approved, in_transit, completed, rejected
- `user_role` - super_admin, admin, sales_manager, investor
- `user_status` - active, inactive, suspended

### 3. Tables (19 tables)
- `users` - User management with roles and permissions
- `customers` - Customer information and red list tracking
- `categories` - Product categories
- `suppliers` - Supplier management
- `locations` - Warehouse and showroom locations
- `products` - Product catalog with stock tracking
- `products_lot` - Lot-based inventory management
- `sales` - Sales transactions
- `sale_items` - Individual items in sales
- `payments` - Payment tracking
- `sample_tracking` - Sample management and conversion tracking
- `transfers` - Inter-location transfers
- `notifications` - System notifications
- `reports` - Report configurations
- `settings` - System settings
- `activity_logs` - Audit trail for all activities
- `daily_sale_sequences` - Sale number generation
- `password_history` - Password change history
- `user_sessions` - Session management
- `user_audit_trail` - User management audit trail

### 4. Views (6 views)
- `customer_summary` - Customer analytics with order statistics
- `inventory_summary` - Location-wise inventory overview
- `low_stock_products` - Products below minimum threshold
- `red_list_customers` - Customers with payment issues
- `sales_summary` - Sales overview with customer and location details
- `sample_conversion_summary` - Sample conversion analytics

### 5. Functions (40+ functions)
- **Authentication & Authorization**: User context management, role checking
- **Password Management**: Hashing, verification, secure token generation
- **Business Logic**: Sale number generation, stock calculations, customer totals
- **Notifications**: Low stock alerts, system notifications
- **Audit & Logging**: Activity tracking, user management audit
- **Data Integrity**: Validation functions, constraint enforcement

### 6. Triggers (22 triggers)
- **Auto-updates**: Updated_at timestamps on all tables
- **Business Logic**: Stock updates, customer totals, payment status
- **Validation**: Due date validation, super admin protection
- **Notifications**: Low stock alerts
- **Calculations**: Per-unit pricing, total stock calculations

### 7. Row Level Security (RLS) Policies
- **User Management**: Role-based access control
- **Location-based Access**: Users can only access their assigned locations
- **Data Protection**: Secure access to sensitive information
- **Audit Trail**: Controlled access to audit logs

### 8. Performance Indexes
- Optimized indexes on frequently queried columns
- Composite indexes for complex queries
- Foreign key indexes for join performance

## How to Use This Backup

### Option 1: Direct SQL Execution
1. Create a new Supabase project
2. Go to the SQL Editor in your new project
3. Copy and paste the entire content of `complete_database_backup.sql`
4. Execute the script

### Option 2: Migration File
1. Save the file as a migration in your new project
2. Run the migration using Supabase CLI or dashboard

### Option 3: Incremental Execution
If you encounter any issues with the large script:
1. Execute sections separately in this order:
   - Extensions and Types
   - Tables
   - Views
   - Functions
   - Triggers
   - RLS Policies
   - Indexes

## Important Notes

### Before Migration
1. **Backup your target database** if it contains any data
2. **Review the script** to ensure it matches your requirements
3. **Test in a development environment** first

### After Migration
1. **Verify all objects** were created successfully
2. **Test RLS policies** with different user roles
3. **Check triggers** are working correctly
4. **Validate data integrity** constraints

### Data Migration
This backup includes **schema only**. To migrate data:
1. Use Supabase's export/import tools for data
2. Or use `pg_dump` and `pg_restore` for complete data migration
3. Ensure foreign key constraints are satisfied

## Security Considerations

### RLS Policies
- All tables have Row Level Security enabled
- Policies enforce role-based access control
- Location-based restrictions for sales managers
- Super admin protection mechanisms

### Password Security
- Passwords are hashed using bcrypt (strength 12)
- Password history tracking prevents reuse
- Secure token generation for resets

### Audit Trail
- Complete activity logging
- User management audit trail
- IP address and user agent tracking

## Troubleshooting

### Common Issues
1. **Extension errors**: Ensure extensions are available in target database
2. **Permission errors**: Run as database owner or with sufficient privileges
3. **Constraint violations**: Check foreign key dependencies
4. **RLS conflicts**: Disable RLS temporarily if needed during setup

### Support
If you encounter issues:
1. Check the Supabase logs for detailed error messages
2. Verify all dependencies are met
3. Test individual components separately
4. Contact support with specific error messages

## File Information
- **Created**: 2025-01-02
- **Source Project**: dbwoaiihjffzfqsozgjn (IMS-2.0)
- **Total Lines**: ~1,755 lines
- **File Size**: ~65KB
- **Compatibility**: PostgreSQL 13+ / Supabase

This backup represents a complete, production-ready inventory management system with advanced features like lot tracking, sample management, multi-location support, and comprehensive audit trails.

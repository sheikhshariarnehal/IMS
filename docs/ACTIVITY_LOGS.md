# Activity Logs System

## Overview

The Activity Logs system provides comprehensive tracking of all user actions and system changes within the IMS application. This system is designed to maintain a complete audit trail for security, compliance, and debugging purposes.

## Key Features

### 🔒 Security & Access Control
- **Super Admin Only**: Access restricted to Super Administrators only
- **60-Day Data Retention**: Shows only the last 60 days of activity to prevent database overload
- **Real-time Logging**: All actions are logged immediately as they occur

### 📊 Analytics Dashboard
- **Total Activities**: Count of all activities in the last 60 days
- **Today's Activities**: Real-time count of today's activities
- **Critical Events**: Count of DELETE operations (high-risk actions)
- **Most Active User**: User with the highest activity count

### 🔍 Advanced Filtering
- **Search**: Full-text search across descriptions, modules, and actions
- **Action Filter**: Filter by CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT, COMPLETE, TRANSFER
- **Module Filter**: Filter by AUTH, PRODUCTS, INVENTORY, SALES, CUSTOMERS, REPORTS, SETTINGS, SAMPLES, TRANSFERS
- **Severity Filter**: Filter by CRITICAL, HIGH, MEDIUM, LOW severity levels

### 📤 Export Functionality
- **CSV Export**: Export filtered logs to CSV format
- **Cross-platform**: Works on web (direct download) and mobile (share functionality)

## Technical Implementation

### Database Schema

The `activity_logs` table structure:
```sql
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    entity_name VARCHAR(200),
    description TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    credit_amount NUMERIC DEFAULT 0,
    debit_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Activity Logger Service

The `ActivityLogger` class provides a centralized logging service:

```typescript
import { activityLogger } from '@/lib/services/activityLogger';

// Set current user (done automatically on login)
activityLogger.setCurrentUser(userId);

// Log different types of activities
await activityLogger.logCreate('PRODUCTS', 'Premium Fabric', productId, newValues);
await activityLogger.logUpdate('CUSTOMERS', 'ABC Corp', customerId, oldValues, newValues);
await activityLogger.logDelete('INVENTORY', 'Old Stock Item', itemId, oldValues);
await activityLogger.logView('REPORTS', 'Sales Report');
await activityLogger.logSale('SALE-001', 1500, 'Customer Name');
await activityLogger.logTransfer('Warehouse A', 'Showroom B', 'Product Name', 10);
```

### Automatic Database Triggers

Enhanced triggers automatically log all database changes:
- Products (CREATE, UPDATE, DELETE)
- Customers (CREATE, UPDATE, DELETE)
- Suppliers (CREATE, UPDATE, DELETE)
- Sales (CREATE, UPDATE, DELETE)
- Transfers (CREATE, UPDATE, DELETE)
- Categories (CREATE, UPDATE, DELETE)
- Locations (CREATE, UPDATE, DELETE)
- Users (CREATE, UPDATE, DELETE)
- Sample Tracking (CREATE, UPDATE, DELETE)

### Severity Levels

Activities are automatically assigned severity levels:
- **CRITICAL**: DELETE operations
- **HIGH**: UPDATE, COMPLETE operations
- **MEDIUM**: CREATE, TRANSFER operations
- **LOW**: VIEW, LOGIN, LOGOUT operations

## User Interface

### Access Control Message
Non-super-admin users see:
```
Access to this section is restricted to Super Admins only.
Other users will not be able to view this.

Currently, the logs display data for the last 60 days only, 
as showing too much data could overload the database due to 
frequent changes throughout the day.
```

### KPI Cards
- **Total Activities**: Shows count with "Last 60 days" subtitle
- **Today's Activities**: Shows count with current date
- **Critical Events**: Shows count with "Delete actions" subtitle
- **Most Active User**: Shows first name with "By activity count" subtitle

### Activity Log Cards
Each log entry displays:
- Action icon (color-coded by severity)
- Description with severity badge
- User name and module
- Timestamp and action type
- Tap to view detailed information

### Detail Modal
Detailed view includes:
- Full description
- User information (name, role)
- Action, module, and severity
- Timestamp and IP address
- Entity information (if applicable)
- JSON view of old/new values (if applicable)

## Performance Optimizations

### Database Indexes
```sql
CREATE INDEX idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_logs_module_action ON activity_logs(module, action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
```

### Query Optimizations
- 60-day automatic filtering to limit data volume
- 500 record limit per query
- Efficient joins with fallback queries
- Pagination-ready structure

### Caching Strategy
- Statistics are cached and refreshed on data load
- Filtered results are memoized for performance
- Real-time updates without full page refresh

## Security Considerations

### Row Level Security (RLS)
- Super admins see all logs
- Other users see only their own actions and related data
- Automatic user context validation

### Data Protection
- Sensitive data is not logged in plain text
- IP addresses and user agents are captured for security
- Demo mode automatically disables logging

### Audit Trail Integrity
- Logs cannot be modified once created
- Comprehensive change tracking with before/after values
- Immutable timestamp recording

## Usage Examples

### Viewing Activity Logs
1. Login as Super Admin
2. Navigate to Activity Logs page
3. View real-time statistics and recent activities
4. Use filters to find specific activities
5. Tap any log entry for detailed information

### Exporting Data
1. Apply desired filters
2. Tap the download button in the header
3. Choose export format (CSV)
4. Save or share the exported file

### Monitoring Critical Events
1. Use the "Severity" filter
2. Select "CRITICAL" to view all delete operations
3. Review the "Critical Events" KPI card for quick counts
4. Export critical events for security review

## Troubleshooting

### No Logs Appearing
- Verify user has Super Admin role
- Check if activities occurred in the last 60 days
- Ensure database triggers are properly installed

### Performance Issues
- Reduce filter scope to limit results
- Check database indexes are present
- Monitor query execution times

### Export Not Working
- Verify browser permissions for downloads
- Check mobile share functionality
- Ensure sufficient storage space

## Future Enhancements

- Real-time notifications for critical events
- Advanced analytics and reporting
- Log retention policy configuration
- Integration with external audit systems
- Machine learning for anomaly detection

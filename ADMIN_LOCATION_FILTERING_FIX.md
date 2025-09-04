# 🔧 Admin Location Filtering Fix

## 🚨 **Problem Identified**

Admin user with permissions `{"locations": [2, 3]}` was seeing ALL location data instead of only data from locations 2 and 3.

## 🔍 **Root Cause Analysis**

### **Issue 1: Incorrect Location Access Function**
The `getAccessibleLocations()` function was checking for `user.assignedLocations` but admin permissions are stored in `user.permissions.locations`.

**Before:**
```typescript
// Only checked assignedLocations and assigned_location_id
if (user.assignedLocations && user.assignedLocations.length > 0) {
  return user.assignedLocations.map(id => id.toString());
}
```

**After:**
```typescript
// Now properly checks permissions.locations for admins
if (user.role === 'admin' && user.permissions?.locations && user.permissions.locations.length > 0) {
  const locations = user.permissions.locations.map(id => id.toString());
  return locations;
}
```

### **Issue 2: Single Location Filtering in Database**
FormService functions were only filtering by single location, not multiple locations for admins.

**Before:**
```typescript
if (filters?.location) {
  query = query.eq('location_id', filters.location); // Single location only
}
```

**After:**
```typescript
if (filters?.location) {
  if (Array.isArray(filters.location)) {
    const locationIds = filters.location.map(id => parseInt(id));
    query = query.in('location_id', locationIds); // Multiple locations
  } else {
    query = query.eq('location_id', parseInt(filters.location)); // Single location
  }
}
```

### **Issue 3: Incorrect Filter Application**
Pages were not properly passing multiple accessible locations to the database queries.

## ✅ **Fixes Applied**

### **1. Fixed getAccessibleLocations Function**
**File:** `contexts/AuthContext.tsx`

- Added proper handling for `user.permissions.locations` for admin users
- Added comprehensive debugging logs
- Maintained backward compatibility for other user types

### **2. Updated FormService Functions**
**Files:** `lib/services/formService.ts`

- **getProducts()**: Now handles array of location IDs
- **getSalesSummary()**: Now handles array of location IDs
- Added logging for debugging

### **3. Updated Page Logic**
**Files:** `app/products.tsx`, `app/sales.tsx`, `app/transfer.tsx`

- **Products Page**: Now passes all accessible locations for admins
- **Sales Page**: Now passes all accessible locations for admins  
- **Transfer Page**: Already had correct logic, enhanced logging

## 🧪 **Expected Behavior After Fix**

### **For Admin with permissions `{"locations": [2, 3]}`:**

#### **Console Logs:**
```
🔍 Getting accessible locations for user: {
  role: 'admin',
  permissions: { locations: [2, 3] },
  ...
}
📍 Admin accessible locations from permissions: ['2', '3']
🔒 Applying location filter for role: admin
🔍 Enhanced filters: { location: ['2', '3'] }
🔍 Filtering products by multiple locations: [2, 3]
📦 Raw products data: X products found
```

#### **Database Queries:**
```sql
-- Products query
SELECT * FROM products WHERE location_id IN (2, 3)

-- Sales query  
SELECT * FROM sales WHERE location_id IN (2, 3)

-- Transfers query
SELECT * FROM transfers WHERE from_location_id IN (2, 3) OR to_location_id IN (2, 3)
```

#### **UI Behavior:**
- ✅ **Products Page**: Shows only products from locations 2 and 3
- ✅ **Sales Page**: Shows only sales from locations 2 and 3
- ✅ **Transfer Page**: Shows only transfers involving locations 2 and 3

### **For Sales Manager with assigned_location_id: 2:**

#### **Console Logs:**
```
📍 Sales manager accessible location: ['2']
🔒 Applying location filter for role: sales_manager
🔍 Enhanced filters: { location: '2' }
🔍 Filtering products by single location: 2
```

#### **UI Behavior:**
- ✅ Shows only data from location 2 (their assigned showroom)

### **For Super Admin:**

#### **Console Logs:**
```
🔍 Getting accessible locations for user: { role: 'super_admin', ... }
// No location filtering applied
📦 Raw products data: ALL products found
```

#### **UI Behavior:**
- ✅ Shows ALL data from ALL locations (no restrictions)

## 🔍 **Testing Steps**

### **1. Test Admin Location Filtering:**
```
1. Login as admin: admin1@serranotex.com / password
2. Check console for: "Admin accessible locations from permissions: ['2', '3']"
3. Go to Products page - should only show products from locations 2 & 3
4. Go to Sales page - should only show sales from locations 2 & 3
5. Go to Transfer page - should only show transfers involving locations 2 & 3
```

### **2. Test Sales Manager Location Filtering:**
```
1. Login as sales manager: sales1@serranotex.com / password
2. Check console for: "Sales manager accessible location: ['2']"
3. Should only see data from location 2 (assigned showroom)
```

### **3. Test Super Admin (No Restrictions):**
```
1. Login as super admin: admin@serranotex.com / admin123
2. Should see ALL data from ALL locations
3. No location filtering applied
```

## 📊 **Data Verification**

### **Check Database Locations:**
```sql
SELECT id, name, type FROM locations ORDER BY id;
-- Should show:
-- 1 | Main Warehouse | warehouse
-- 2 | Gulshan Showroom | showroom  
-- 3 | Chittagong Warehouse | warehouse
```

### **Check Admin Permissions:**
```sql
SELECT id, email, role, permissions FROM users WHERE email = 'admin1@serranotex.com';
-- Should show permissions: {"locations": [2, 3]}
```

### **Verify Products by Location:**
```sql
SELECT location_id, COUNT(*) FROM products GROUP BY location_id ORDER BY location_id;
-- Should show product counts per location
```

## 🎉 **Result**

Admin users will now properly see only data from their assigned locations:
- ✅ **Location 2 (Gulshan Showroom)**: Products, sales, transfers
- ✅ **Location 3 (Chittagong Warehouse)**: Products, sales, transfers
- ❌ **Location 1 (Main Warehouse)**: Hidden (no access)

The location-based access control now works correctly for all user roles!

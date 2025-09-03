# Sales Manager Functionality Test Guide

## 🎯 **Core Functionality: READY FOR TESTING**

### **Demo Login Credentials**
- **Email:** `sales1@serranotex.com`
- **Password:** `password`
- **Assigned Location:** Showroom Gulshan (ID: 2)

---

## ✅ **What Sales Manager CAN Do - Test Checklist**

### 1. **Add New Customers** ✅
**Test Steps:**
1. Login with Sales Manager credentials
2. Navigate to Customers page (`/customers`)
3. Click the "+" (Add Customer) button in the top-right
4. Fill out the customer form:
   - Name: "Test Customer"
   - Phone: "01712345678"
   - Email: "test@example.com"
   - Address: "123 Test Street, Dhaka"
5. Click "Save Customer"
6. Verify customer appears in the customer list

**Expected Result:** ✅ Customer should be created successfully

### 2. **Add New Sales from Showroom** ✅
**Test Steps:**
1. Navigate to Sales page (`/sales`)
2. Click the "+" (Add Sale) button in the top-right
3. OR use the bottom navigation "+" button → "New Sale"
4. In the Sales Form:
   - Select a product from Showroom Gulshan (available products):
     - Cotton Fabric (ID: 3)
     - Polyester Blend (ID: 4) 
     - Linen Fabric (ID: 5)
   - Select or create a customer
   - Enter quantity (e.g., 10 meters)
   - Verify price calculation
   - Choose payment method
5. Click "Create Sale"
6. Verify sale appears in sales list

**Expected Result:** ✅ Sale should be created successfully with products from assigned showroom only

### 3. **Quick Actions Page** ✅
**Test Steps:**
1. Click the "+" button in bottom navigation
2. Verify Quick Actions page shows:
   - "New Sale" option
   - "New Customer" option
3. Test both quick action buttons
4. Verify forms open correctly

**Expected Result:** ✅ Quick actions should work for allowed operations

---

## ❌ **What Sales Manager CANNOT Do - Restriction Tests**

### 1. **Cannot Delete Anything**
**Test Steps:**
1. Go to Customers page → Try to find delete buttons
2. Go to Sales page → Try to find delete buttons
3. Go to Products page → Try to find delete buttons

**Expected Result:** ❌ No delete buttons should be visible

### 2. **Cannot Access Restricted Modules**
**Test Steps:**
1. Check sidebar navigation
2. Verify these modules are NOT visible:
   - Suppliers
   - Sample Tracking
   - Notifications (management)
   - Activity Logs
   - Settings
   - User Management

**Expected Result:** ❌ Restricted modules should not appear in navigation

### 3. **Cannot Transfer Products**
**Test Steps:**
1. Check bottom navigation
2. Verify "Transfer" button is NOT visible
3. Try to access `/transfer` directly

**Expected Result:** ❌ Transfer functionality should be completely hidden

### 4. **Cannot Access Other Locations**
**Test Steps:**
1. Go to Products page
2. Verify only products from "Showroom Gulshan" are visible
3. Go to Sales page
4. Verify only sales from assigned location are shown

**Expected Result:** ❌ Should only see data from assigned showroom

### 5. **Cannot Add/Edit Products**
**Test Steps:**
1. Go to Products page
2. Verify no "Add Product" button exists
3. Click on any product
4. Verify no edit options are available

**Expected Result:** ❌ Product management should be read-only

---

## 🔍 **Available Products for Testing**

Sales Manager can create sales with these products from Showroom Gulshan:

1. **Cotton Fabric** (ID: 3)
   - Stock: 25 meters
   - Price: $25.00/meter
   - Code: COT-003

2. **Polyester Blend** (ID: 4)
   - Stock: 200 meters
   - Price: $22.00/meter
   - Code: PLY-004

3. **Linen Fabric** (ID: 5)
   - Stock: 50 meters
   - Price: $42.00/meter
   - Code: LIN-005

---

## 🚀 **Quick Test Workflow**

### **5-Minute Functionality Test:**
1. **Login** → Use `sales1@serranotex.com` / `password`
2. **Add Customer** → Customers page → "+" button → Fill form → Save
3. **Create Sale** → Sales page → "+" button → Select product → Select customer → Save
4. **Check Restrictions** → Try to access Suppliers (should fail)
5. **Verify Data** → Confirm only showroom data is visible

### **Expected Results:**
- ✅ Customer creation works
- ✅ Sales creation works with showroom products only
- ✅ Navigation shows only allowed modules
- ✅ No delete buttons anywhere
- ✅ No transfer functionality
- ✅ Location-based data filtering active

---

## 🎯 **Success Criteria**

The Sales Manager functionality is **FULLY OPERATIONAL** when:

1. ✅ Can successfully add customers
2. ✅ Can successfully create sales from showroom inventory
3. ✅ Cannot delete any records
4. ✅ Cannot transfer products
5. ✅ Cannot access restricted modules
6. ✅ Only sees data from assigned showroom
7. ✅ Quick actions work properly
8. ✅ All UI restrictions are enforced

**Status: 🟢 READY FOR TESTING**

All core functionality has been implemented and is ready for comprehensive testing!

// Simple test to verify permission logic
// This simulates the permission checking without running the full app

// Mock user data
const mockUsers = {
  superAdmin: {
    id: 1,
    role: 'super_admin',
    email: 'admin@serranotex.com',
    permissions: {}
  },
  admin: {
    id: 2,
    role: 'admin',
    email: 'admin1@serranotex.com',
    permissions: {
      locations: [1, 2] // Has access to warehouse (1) and showroom (2)
    }
  },
  salesManager: {
    id: 3,
    role: 'sales_manager',
    email: 'sales1@serranotex.com',
    assigned_location_id: 2, // Assigned to showroom (2)
    permissions: {}
  }
};

// Mock location data
const locations = {
  1: { type: 'warehouse', name: 'Main Warehouse' },
  2: { type: 'showroom', name: 'Gulshan Showroom' },
  3: { type: 'warehouse', name: 'Chittagong Warehouse' }
};

// Helper functions
function isWarehouse(locationId) {
  return locations[locationId]?.type === 'warehouse';
}

function isShowroom(locationId) {
  return locations[locationId]?.type === 'showroom';
}

// Permission checking logic (simplified from AuthContext)
function hasPermission(user, module, action, locationId) {
  console.log(`\n🔍 Checking permission for ${user.role}: ${module}.${action}${locationId ? ` (location: ${locationId})` : ''}`);
  
  // Super admin has all permissions
  if (user.role === 'super_admin') {
    console.log('✅ Super admin - granting permission');
    return true;
  }
  
  // Admin permission logic
  if (user.role === 'admin') {
    return checkAdminPermission(user, module, action, locationId);
  }
  
  // Sales Manager permission logic
  if (user.role === 'sales_manager') {
    return checkSalesManagerPermission(user, module, action, locationId);
  }
  
  return false;
}

function checkAdminPermission(user, module, action, locationId) {
  const adminLocations = user.permissions?.locations || [];
  
  // Admins cannot delete anything
  if (action === 'delete') {
    console.log('❌ Admins cannot delete anything');
    return false;
  }
  
  switch (module) {
    case 'products':
      if (action === 'add') {
        const hasWarehouseAccess = adminLocations.some(id => isWarehouse(id));
        console.log(`🏭 Warehouse access: ${hasWarehouseAccess}`);
        return hasWarehouseAccess;
      }
      return ['view', 'edit'].includes(action);
      
    case 'inventory':
      if (action === 'transfer') {
        const hasWarehouseAccess = adminLocations.some(id => isWarehouse(id));
        console.log(`🏭 Warehouse access for transfer: ${hasWarehouseAccess}`);
        return hasWarehouseAccess;
      }
      return ['view', 'add', 'edit'].includes(action);
      
    case 'sales':
      if (action === 'add') {
        const hasShowroomAccess = adminLocations.some(id => isShowroom(id));
        console.log(`🏪 Showroom access: ${hasShowroomAccess}`);
        return hasShowroomAccess;
      }
      return ['view', 'edit'].includes(action);
      
    case 'customers':
    case 'suppliers':
    case 'categories':
      return ['view', 'add', 'edit'].includes(action);
      
    default:
      return action === 'view';
  }
}

function checkSalesManagerPermission(user, module, action, locationId) {
  // Sales managers cannot delete or transfer
  if (['delete', 'transfer'].includes(action)) {
    console.log(`❌ Sales managers cannot ${action}`);
    return false;
  }
  
  // Check location access
  if (locationId && user.assigned_location_id !== locationId) {
    console.log('❌ Sales manager cannot access location outside assignment');
    return false;
  }
  
  switch (module) {
    case 'sales':
    case 'customers':
      return ['view', 'add', 'edit'].includes(action);
      
    case 'products':
    case 'inventory':
      return action === 'view';
      
    case 'suppliers':
    case 'categories':
      console.log(`❌ Sales managers cannot access ${module}`);
      return false;
      
    default:
      return action === 'view';
  }
}

// Test scenarios
console.log('🧪 Testing Admin and Sales Manager Permissions\n');

const testCases = [
  // Super Admin tests
  { user: 'superAdmin', module: 'products', action: 'add', expected: true },
  { user: 'superAdmin', module: 'products', action: 'delete', expected: true },
  
  // Admin tests
  { user: 'admin', module: 'products', action: 'add', expected: true }, // Has warehouse access
  { user: 'admin', module: 'products', action: 'delete', expected: false }, // Cannot delete
  { user: 'admin', module: 'inventory', action: 'transfer', expected: true }, // Has warehouse access
  { user: 'admin', module: 'sales', action: 'add', expected: true }, // Has showroom access
  { user: 'admin', module: 'categories', action: 'add', expected: true },
  
  // Sales Manager tests
  { user: 'salesManager', module: 'customers', action: 'add', expected: true },
  { user: 'salesManager', module: 'sales', action: 'add', expected: true },
  { user: 'salesManager', module: 'products', action: 'add', expected: false },
  { user: 'salesManager', module: 'inventory', action: 'transfer', expected: false },
  { user: 'salesManager', module: 'categories', action: 'view', expected: false },
  { user: 'salesManager', module: 'suppliers', action: 'view', expected: false },
];

// Run tests
testCases.forEach((test, index) => {
  const user = mockUsers[test.user];
  const result = hasPermission(user, test.module, test.action, test.locationId);
  const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} Test ${index + 1}: ${test.user} ${test.module}.${test.action} = ${result} (expected: ${test.expected})`);
});

console.log('\n🎉 Permission testing complete!');

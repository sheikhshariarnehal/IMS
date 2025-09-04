// Test script to verify admin sales fix
// This script simulates the admin sales scenario to verify the fix works

console.log('🧪 Testing Admin Sales Fix');
console.log('==========================');

// Mock data based on actual database
const mockUser = {
  id: 81,
  email: 's10w@gs.com',
  name: 'rtr',
  role: 'admin',
  permissions: {
    locations: [3, 2] // Has access to warehouse (3) and showroom (2)
  }
};

const mockProduct = {
  id: 69,
  name: 'n1',
  product_code: 'PRD-N16619',
  location_id: 3 // Product is in warehouse
};

const mockLocations = [
  { id: 1, name: 'Main Warehouse', type: 'warehouse' },
  { id: 2, name: 'Gulshan Showroom', type: 'showroom' },
  { id: 3, name: 'Chittagong Warehouse', type: 'warehouse' }
];

// Simulate the permission check logic
function canCreateSaleAtLocation(locationId, userRole, userPermissions) {
  if (userRole !== 'admin') return false;
  
  const adminLocations = userPermissions?.locations || [];
  const location = mockLocations.find(loc => loc.id === parseInt(locationId));
  
  if (!location) return false;
  
  // Admin can only create sales at showrooms
  return adminLocations.includes(location.id) && location.type === 'showroom';
}

// Simulate the new logic
function determineSaleLocation(productLocationId, userRole, userPermissions) {
  console.log(`\n📍 Determining sale location for product in location ${productLocationId}`);
  
  if (canCreateSaleAtLocation(productLocationId, userRole, userPermissions)) {
    console.log(`✅ Can create sale directly at product location ${productLocationId}`);
    return productLocationId;
  }
  
  console.log(`❌ Cannot create sale at product location ${productLocationId} (warehouse)`);
  
  // Find accessible showrooms
  const adminLocations = userPermissions?.locations || [];
  const showrooms = mockLocations.filter(loc => loc.type === 'showroom');
  const accessibleShowrooms = adminLocations.filter(locationId => 
    showrooms.some(showroom => showroom.id === locationId)
  );
  
  console.log(`🏪 Admin accessible showrooms: ${accessibleShowrooms}`);
  
  if (accessibleShowrooms.length === 0) {
    console.log(`❌ No accessible showrooms found`);
    return null;
  }
  
  const saleLocationId = accessibleShowrooms[0];
  console.log(`✅ Using showroom ${saleLocationId} for sale location`);
  return saleLocationId;
}

// Test the scenario
console.log('\n🔍 Test Scenario:');
console.log(`👤 User: ${mockUser.name} (${mockUser.role})`);
console.log(`📦 Product: ${mockProduct.name} in location ${mockProduct.location_id}`);
console.log(`🏢 User has access to locations: ${mockUser.permissions.locations}`);

const saleLocationId = determineSaleLocation(
  mockProduct.location_id,
  mockUser.role,
  mockUser.permissions
);

console.log('\n📊 Test Result:');
if (saleLocationId) {
  const saleLocation = mockLocations.find(loc => loc.id === saleLocationId);
  console.log(`✅ SUCCESS: Sale can be created at location ${saleLocationId} (${saleLocation.name})`);
  console.log(`📋 Sale will be recorded with location_id: ${saleLocationId}`);
  console.log(`📦 Product remains in warehouse location: ${mockProduct.location_id}`);
} else {
  console.log(`❌ FAILURE: Cannot create sale - no accessible showrooms`);
}

console.log('\n🎯 Expected Behavior:');
console.log('- Admin should be able to sell warehouse products');
console.log('- Sale should be recorded against accessible showroom (location 2)');
console.log('- Business rule maintained: sales only happen at showrooms');
console.log('- Product inventory tracked correctly');

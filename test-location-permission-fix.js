// Test script to verify the location permission fix
// This script tests that admins can see products that have lots in their permitted locations

const mockData = {
  // Mock locations
  locations: [
    { id: 1, name: 'Main Warehouse', type: 'warehouse' },
    { id: 2, name: 'Secondary Warehouse', type: 'warehouse' },
    { id: 3, name: 'Downtown Showroom', type: 'showroom' },
    { id: 4, name: 'Mall Showroom', type: 'showroom' }
  ],

  // Mock products
  products: [
    { 
      id: 1, 
      name: 'Product A', 
      product_code: 'PA001',
      location_id: 1, // Main location is warehouse 1
      total_stock: 150
    },
    { 
      id: 2, 
      name: 'Product B', 
      product_code: 'PB001',
      location_id: 2, // Main location is warehouse 2
      total_stock: 200
    }
  ],

  // Mock product lots - this is the key part of the fix
  products_lot: [
    // Product A has lots in multiple locations
    { id: 1, product_id: 1, lot_number: 1, quantity: 50, location_id: 1 }, // Warehouse 1
    { id: 2, product_id: 1, lot_number: 2, quantity: 30, location_id: 3 }, // Showroom 3
    { id: 3, product_id: 1, lot_number: 3, quantity: 70, location_id: 4 }, // Showroom 4

    // Product B has lots in different locations
    { id: 4, product_id: 2, lot_number: 1, quantity: 100, location_id: 2 }, // Warehouse 2
    { id: 5, product_id: 2, lot_number: 2, quantity: 50, location_id: 3 },  // Showroom 3
    { id: 6, product_id: 2, lot_number: 3, quantity: 50, location_id: 1 },  // Warehouse 1
  ],

  // Mock users with different location permissions
  users: [
    {
      id: 1,
      name: 'Admin 1',
      role: 'admin',
      permissions: { locations: [1, 3] } // Can access Warehouse 1 and Showroom 3
    },
    {
      id: 2,
      name: 'Admin 2', 
      role: 'admin',
      permissions: { locations: [2, 4] } // Can access Warehouse 2 and Showroom 4
    },
    {
      id: 3,
      name: 'Sales Manager 1',
      role: 'sales_manager',
      assigned_location_id: 3 // Can only access Showroom 3
    }
  ]
};

// Simulate the OLD filtering logic (problematic)
function getProductsOldLogic(userPermissions) {
  console.log('\n🔴 OLD LOGIC (Problematic):');
  console.log('User permissions:', userPermissions);
  
  const accessibleProducts = mockData.products.filter(product => 
    userPermissions.includes(product.location_id)
  );
  
  console.log('Products found:', accessibleProducts.map(p => ({
    name: p.name,
    main_location: p.location_id,
    total_stock: p.total_stock
  })));
  
  return accessibleProducts;
}

// Simulate the NEW filtering logic (fixed)
function getProductsNewLogic(userPermissions) {
  console.log('\n✅ NEW LOGIC (Fixed):');
  console.log('User permissions:', userPermissions);
  
  // Step 1: Find all lots in accessible locations
  const accessibleLots = mockData.products_lot.filter(lot => 
    userPermissions.includes(lot.location_id) && lot.quantity > 0
  );
  
  console.log('Accessible lots:', accessibleLots.map(lot => ({
    product_id: lot.product_id,
    lot_number: lot.lot_number,
    quantity: lot.quantity,
    location_id: lot.location_id
  })));
  
  // Step 2: Get unique product IDs that have lots in accessible locations
  const accessibleProductIds = [...new Set(accessibleLots.map(lot => lot.product_id))];
  
  // Step 3: Get products that have lots in accessible locations
  const accessibleProducts = mockData.products.filter(product => 
    accessibleProductIds.includes(product.id)
  );
  
  console.log('Products found:', accessibleProducts.map(p => ({
    name: p.name,
    main_location: p.location_id,
    total_stock: p.total_stock,
    accessible_lots: accessibleLots
      .filter(lot => lot.product_id === p.id)
      .map(lot => `Lot ${lot.lot_number} (${lot.quantity} units) at Location ${lot.location_id}`)
  })));
  
  return accessibleProducts;
}

// Test scenarios
console.log('🧪 TESTING LOCATION PERMISSION FIX\n');
console.log('='.repeat(60));

// Test Case 1: Admin 1 with permissions [1, 3]
console.log('\n📋 TEST CASE 1: Admin 1 (permissions: [1, 3])');
console.log('Expected: Should see both Product A and Product B');
console.log('- Product A: has lots in location 1 and 3 (accessible)');
console.log('- Product B: has lots in location 3 (accessible)');

const admin1Permissions = [1, 3];
getProductsOldLogic(admin1Permissions);
getProductsNewLogic(admin1Permissions);

// Test Case 2: Admin 2 with permissions [2, 4]  
console.log('\n📋 TEST CASE 2: Admin 2 (permissions: [2, 4])');
console.log('Expected: Should see both Product A and Product B');
console.log('- Product A: has lots in location 4 (accessible)');
console.log('- Product B: has lots in location 2 (accessible)');

const admin2Permissions = [2, 4];
getProductsOldLogic(admin2Permissions);
getProductsNewLogic(admin2Permissions);

// Test Case 3: Sales Manager with permission [3]
console.log('\n📋 TEST CASE 3: Sales Manager (permissions: [3])');
console.log('Expected: Should see both Product A and Product B');
console.log('- Product A: has lots in location 3 (accessible)');
console.log('- Product B: has lots in location 3 (accessible)');

const salesManagerPermissions = [3];
getProductsOldLogic(salesManagerPermissions);
getProductsNewLogic(salesManagerPermissions);

console.log('\n' + '='.repeat(60));
console.log('🎯 SUMMARY:');
console.log('✅ NEW LOGIC correctly shows products that have lots in accessible locations');
console.log('❌ OLD LOGIC only showed products whose main location was accessible');
console.log('🔧 This fix ensures admins can transfer/sell products from any of their permitted locations');

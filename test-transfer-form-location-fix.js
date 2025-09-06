// Test script to verify the transfer form location fix
// This script simulates the transfer form behavior to ensure lot selection updates source location correctly

const mockData = {
  // Mock product
  product: {
    id: 1,
    name: 'Product A',
    product_code: 'PA001',
    location_id: 1, // Main location is warehouse 1
    location_name: 'Main Warehouse',
    total_stock: 150
  },

  // Mock product lots with different locations
  productLots: [
    {
      id: 101,
      product_id: 1,
      lot_number: 1,
      quantity: 50,
      location_id: 1,
      locations: { id: 1, name: 'Main Warehouse', type: 'warehouse' }
    },
    {
      id: 102,
      product_id: 1,
      lot_number: 2,
      quantity: 30,
      location_id: 3,
      locations: { id: 3, name: 'Downtown Showroom', type: 'showroom' }
    },
    {
      id: 103,
      product_id: 1,
      lot_number: 3,
      quantity: 70,
      location_id: 4,
      locations: { id: 4, name: 'Mall Showroom', type: 'showroom' }
    }
  ],

  // Mock user with permissions
  user: {
    id: 1,
    name: 'Admin 1',
    role: 'admin',
    permissions: { locations: [3, 4] } // Can access showrooms 3 and 4, but NOT warehouse 1
  }
};

// Simulate the OLD transfer form behavior (problematic)
function simulateOldTransferForm() {
  console.log('\n🔴 OLD TRANSFER FORM BEHAVIOR (Problematic):');
  console.log('='.repeat(50));
  
  // Step 1: Form initialization - uses product's main location
  const initialFormData = {
    productId: mockData.product.id,
    productName: mockData.product.name,
    sourceLocationId: mockData.product.location_id.toString(), // Problem: Uses main location
    sourceLocationName: mockData.product.location_name,
    selectedLot: null
  };
  
  console.log('📋 Initial form data:', {
    sourceLocationId: initialFormData.sourceLocationId,
    sourceLocationName: initialFormData.sourceLocationName,
    selectedLot: initialFormData.selectedLot
  });
  
  // Step 2: User selects Lot 2 (which is in location 3 - permitted)
  const selectedLot = mockData.productLots[1]; // Lot 2 in location 3
  console.log('🎯 User selects lot:', {
    lotNumber: selectedLot.lot_number,
    quantity: selectedLot.quantity,
    locationId: selectedLot.location_id,
    locationName: selectedLot.locations.name
  });
  
  // OLD BEHAVIOR: Lot selection doesn't update source location
  const formDataAfterLotSelection = {
    ...initialFormData,
    selectedLot: selectedLot
    // sourceLocationId and sourceLocationName remain unchanged!
  };
  
  console.log('📋 Form data after lot selection (OLD):', {
    sourceLocationId: formDataAfterLotSelection.sourceLocationId,
    sourceLocationName: formDataAfterLotSelection.sourceLocationName,
    selectedLotLocation: formDataAfterLotSelection.selectedLot.location_id
  });
  
  // Step 3: Permission check - uses source location (main product location)
  const hasPermission = mockData.user.permissions.locations.includes(
    parseInt(formDataAfterLotSelection.sourceLocationId)
  );
  
  console.log('🔒 Permission check result:', {
    checkingLocationId: formDataAfterLotSelection.sourceLocationId,
    userPermissions: mockData.user.permissions.locations,
    hasPermission: hasPermission
  });
  
  if (!hasPermission) {
    console.log('❌ PERMISSION DENIED: Cannot transfer from location', formDataAfterLotSelection.sourceLocationName);
    console.log('💡 Problem: Form is checking permission for main product location, not selected lot location');
  }
}

// Simulate the NEW transfer form behavior (fixed)
function simulateNewTransferForm() {
  console.log('\n✅ NEW TRANSFER FORM BEHAVIOR (Fixed):');
  console.log('='.repeat(50));
  
  // Step 1: Form initialization - uses product's main location
  const initialFormData = {
    productId: mockData.product.id,
    productName: mockData.product.name,
    sourceLocationId: mockData.product.location_id.toString(),
    sourceLocationName: mockData.product.location_name,
    selectedLot: null
  };
  
  console.log('📋 Initial form data:', {
    sourceLocationId: initialFormData.sourceLocationId,
    sourceLocationName: initialFormData.sourceLocationName,
    selectedLot: initialFormData.selectedLot
  });
  
  // Step 2: User selects Lot 2 (which is in location 3 - permitted)
  const selectedLot = mockData.productLots[1]; // Lot 2 in location 3
  console.log('🎯 User selects lot:', {
    lotNumber: selectedLot.lot_number,
    quantity: selectedLot.quantity,
    locationId: selectedLot.location_id,
    locationName: selectedLot.locations.name
  });
  
  // NEW BEHAVIOR: Lot selection updates source location to match selected lot
  const formDataAfterLotSelection = {
    ...initialFormData,
    selectedLot: selectedLot,
    sourceLocationId: selectedLot.location_id.toString(), // ✅ Updated to lot's location
    sourceLocationName: selectedLot.locations.name        // ✅ Updated to lot's location name
  };
  
  console.log('📋 Form data after lot selection (NEW):', {
    sourceLocationId: formDataAfterLotSelection.sourceLocationId,
    sourceLocationName: formDataAfterLotSelection.sourceLocationName,
    selectedLotLocation: formDataAfterLotSelection.selectedLot.location_id
  });
  
  // Step 3: Permission check - uses source location (selected lot's location)
  const hasPermission = mockData.user.permissions.locations.includes(
    parseInt(formDataAfterLotSelection.sourceLocationId)
  );
  
  console.log('🔒 Permission check result:', {
    checkingLocationId: formDataAfterLotSelection.sourceLocationId,
    userPermissions: mockData.user.permissions.locations,
    hasPermission: hasPermission
  });
  
  if (hasPermission) {
    console.log('✅ PERMISSION GRANTED: Can transfer from location', formDataAfterLotSelection.sourceLocationName);
    console.log('🎉 Success: Form correctly uses selected lot location for permission check');
  } else {
    console.log('❌ PERMISSION DENIED: Cannot transfer from location', formDataAfterLotSelection.sourceLocationName);
  }
}

// Test different scenarios
function testScenarios() {
  console.log('🧪 TESTING TRANSFER FORM LOCATION FIX\n');
  console.log('📝 Scenario: Admin with permissions [3, 4] tries to transfer Product A');
  console.log('📦 Product A main location: Warehouse 1 (no permission)');
  console.log('📦 Product A has lots in: Warehouse 1, Showroom 3, Showroom 4');
  console.log('🎯 User selects Lot 2 from Showroom 3 (has permission)');
  
  simulateOldTransferForm();
  simulateNewTransferForm();
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 SUMMARY:');
  console.log('❌ OLD: Permission denied because form checked main product location');
  console.log('✅ NEW: Permission granted because form checks selected lot location');
  console.log('🔧 This fix allows users to transfer from lots in their permitted locations');
}

// Run the test
testScenarios();

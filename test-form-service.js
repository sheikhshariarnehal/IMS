// Test script to verify FormService methods work correctly
const { FormService } = require('./lib/services/formService');

async function testFormService() {
  console.log('🧪 Testing FormService methods...\n');

  try {
    // Test getCategories
    console.log('1. Testing getCategories()...');
    const categories = await FormService.getCategories();
    console.log(`✅ getCategories() returned ${categories.length} categories`);
    if (categories.length > 0) {
      console.log(`   Sample category: ${categories[0].name}`);
    }

    // Test getSuppliers
    console.log('\n2. Testing getSuppliers()...');
    const suppliers = await FormService.getSuppliers();
    console.log(`✅ getSuppliers() returned ${suppliers.length} suppliers`);
    if (suppliers.length > 0) {
      console.log(`   Sample supplier: ${suppliers[0].name}`);
    }

    // Test getLocations
    console.log('\n3. Testing getLocations()...');
    const locations = await FormService.getLocations();
    console.log(`✅ getLocations() returned ${locations.length} locations`);
    if (locations.length > 0) {
      console.log(`   Sample location: ${locations[0].name}`);
    }

    // Test getExistingProducts
    console.log('\n4. Testing getExistingProducts()...');
    const products = await FormService.getExistingProducts();
    console.log(`✅ getExistingProducts() returned ${products.length} products`);
    if (products.length > 0) {
      console.log(`   Sample product: ${products[0].name}`);
    }

    console.log('\n🎉 All FormService methods are working correctly!');
    console.log('\n📝 Summary:');
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Suppliers: ${suppliers.length}`);
    console.log(`   - Locations: ${locations.length}`);
    console.log(`   - Products: ${products.length}`);

  } catch (error) {
    console.error('❌ Error testing FormService:', error);
  }
}

// Run the test
testFormService();

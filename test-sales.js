// Simple test script to verify sales functionality
// This can be run in the browser console to test the sales page

console.log('🧪 Testing Sales Page Functionality...');

// Test 1: Check if FormService is available
try {
  if (typeof FormService !== 'undefined') {
    console.log('✅ FormService is available');
  } else {
    console.log('❌ FormService is not available');
  }
} catch (error) {
  console.log('❌ Error checking FormService:', error);
}

// Test 2: Check if sales data can be loaded
async function testSalesDataLoading() {
  try {
    console.log('🔄 Testing sales data loading...');
    
    // This would normally be called from the sales page
    // We'll just check if the functions exist
    const testFunctions = [
      'getSalesSummary',
      'getDuePaymentsSummary', 
      'getRedListCustomers',
      'getSalesStats'
    ];
    
    testFunctions.forEach(funcName => {
      if (typeof FormService !== 'undefined' && typeof FormService[funcName] === 'function') {
        console.log(`✅ ${funcName} function exists`);
      } else {
        console.log(`❌ ${funcName} function missing`);
      }
    });
    
  } catch (error) {
    console.log('❌ Error testing sales data loading:', error);
  }
}

// Test 3: Check for common JavaScript errors
function testForCommonErrors() {
  console.log('🔄 Checking for common JavaScript errors...');
  
  // Check for undefined property access
  const testObj = {};
  try {
    const result = testObj.someProperty?.toString();
    console.log('✅ Optional chaining works correctly');
  } catch (error) {
    console.log('❌ Optional chaining error:', error);
  }
  
  // Check for null/undefined handling
  try {
    const nullValue = null;
    const result = nullValue?.someProperty || 'default';
    console.log('✅ Null handling works correctly');
  } catch (error) {
    console.log('❌ Null handling error:', error);
  }
}

// Run tests
testSalesDataLoading();
testForCommonErrors();

console.log('🧪 Sales functionality test completed!');

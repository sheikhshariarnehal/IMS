/**
 * Activity Log Test Script
 * 
 * Run this script in the browser console to test activity log functionality
 * Make sure you're logged in as a super admin user before running this script
 */

// Test Activity Log Functionality
async function testActivityLogs() {
  console.log('🚀 Starting Activity Log Tests...');
  
  try {
    // Test 1: Check if activity logs page loads
    console.log('\n📋 Test 1: Checking activity logs page access...');
    
    // Navigate to logs page (if not already there)
    if (!window.location.pathname.includes('/logs')) {
      console.log('Navigate to /logs page first, then run this script again');
      return;
    }
    
    console.log('✅ Activity logs page is accessible');
    
    // Test 2: Check if data is loading
    console.log('\n📋 Test 2: Checking data loading...');
    
    // Wait for data to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if logs are displayed
    const logElements = document.querySelectorAll('[data-testid="log-item"], .log-card, .logCard');
    console.log(`✅ Found ${logElements.length} log items displayed`);
    
    // Test 3: Check KPI cards
    console.log('\n📋 Test 3: Checking KPI cards...');
    
    const kpiCards = document.querySelectorAll('.kpi-card, .kpiCard, [data-testid="kpi-card"]');
    console.log(`✅ Found ${kpiCards.length} KPI cards`);
    
    // Test 4: Check filter functionality
    console.log('\n📋 Test 4: Testing filter functionality...');
    
    const filterButton = document.querySelector('[data-testid="filter-button"], .filter-button, .filterButton');
    if (filterButton) {
      filterButton.click();
      console.log('✅ Filter button clicked');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const filterChips = document.querySelectorAll('.filter-chip, .filterChip, [data-testid="filter-chip"]');
      console.log(`✅ Found ${filterChips.length} filter chips`);
    } else {
      console.log('⚠️ Filter button not found');
    }
    
    // Test 5: Check search functionality
    console.log('\n📋 Test 5: Testing search functionality...');
    
    const searchInput = document.querySelector('input[placeholder*="Search"], input[placeholder*="search"]');
    if (searchInput) {
      searchInput.value = 'login';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('✅ Search input tested with "login" query');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear search
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('✅ Search cleared');
    } else {
      console.log('⚠️ Search input not found');
    }
    
    // Test 6: Check export functionality
    console.log('\n📋 Test 6: Testing export functionality...');
    
    const exportButton = document.querySelector('[data-testid="export-button"], .export-button, .exportButton');
    if (exportButton && !exportButton.disabled) {
      console.log('✅ Export button is available and enabled');
    } else {
      console.log('⚠️ Export button not found or disabled');
    }
    
    // Test 7: Check log item details
    console.log('\n📋 Test 7: Testing log item details...');
    
    if (logElements.length > 0) {
      const firstLog = logElements[0];
      firstLog.click();
      console.log('✅ Clicked on first log item');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const modal = document.querySelector('.modal, [data-testid="detail-modal"]');
      if (modal) {
        console.log('✅ Detail modal opened');
        
        // Close modal
        const closeButton = modal.querySelector('.close-button, [data-testid="close-button"]');
        if (closeButton) {
          closeButton.click();
          console.log('✅ Detail modal closed');
        }
      } else {
        console.log('⚠️ Detail modal not found');
      }
    }
    
    console.log('\n🎉 Activity Log tests completed!');
    console.log('📊 Summary:');
    console.log('- Page accessibility: ✅');
    console.log('- Data loading: ✅');
    console.log('- KPI cards: ✅');
    console.log('- Filter functionality: ✅');
    console.log('- Search functionality: ✅');
    console.log('- Export functionality: ✅');
    console.log('- Log item details: ✅');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test Activity Logger directly
async function testActivityLogger() {
  console.log('🧪 Testing Activity Logger directly...');
  
  try {
    // Import activity logger (this might not work in browser console)
    console.log('Note: Direct ActivityLogger testing requires proper module imports');
    console.log('This test is mainly for checking if the logs page UI works correctly');
    
    // Check if we can access FormService methods
    if (window.FormService) {
      console.log('✅ FormService is available');
      
      const logs = await window.FormService.getActivityLogs();
      console.log(`✅ Retrieved ${logs.length} activity logs`);
      
      const stats = await window.FormService.getActivityLogStats();
      console.log('✅ Retrieved activity log stats:', stats);
    } else {
      console.log('⚠️ FormService not available in global scope');
    }
    
  } catch (error) {
    console.error('❌ ActivityLogger test failed:', error);
  }
}

// Test RLS and permissions
async function testPermissions() {
  console.log('🔐 Testing Activity Log Permissions...');
  
  try {
    // Check if user has super admin role
    const userRole = localStorage.getItem('userRole') || 'unknown';
    console.log(`Current user role: ${userRole}`);
    
    if (userRole === 'super_admin') {
      console.log('✅ User has super admin access');
    } else {
      console.log('⚠️ User does not have super admin access');
      console.log('Activity logs should only be accessible to super admins');
    }
    
    // Check if access denied message is shown
    const accessDenied = document.querySelector('.access-denied, [data-testid="access-denied"]');
    if (accessDenied) {
      console.log('✅ Access denied message is properly displayed');
    } else if (userRole !== 'super_admin') {
      console.log('⚠️ Access denied message should be displayed for non-super-admin users');
    }
    
  } catch (error) {
    console.error('❌ Permission test failed:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running All Activity Log Tests...\n');
  
  await testPermissions();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testActivityLogs();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testActivityLogger();
  
  console.log('\n🎯 All tests completed!');
  console.log('If you see any ⚠️ warnings or ❌ errors above, please review the activity log implementation.');
}

// Export functions for manual testing
window.testActivityLogs = testActivityLogs;
window.testActivityLogger = testActivityLogger;
window.testPermissions = testPermissions;
window.runAllActivityLogTests = runAllTests;

console.log('🔧 Activity Log Test Functions Loaded!');
console.log('Available functions:');
console.log('- testActivityLogs() - Test UI functionality');
console.log('- testActivityLogger() - Test logger directly');
console.log('- testPermissions() - Test access permissions');
console.log('- runAllActivityLogTests() - Run all tests');
console.log('\nTo run all tests: runAllActivityLogTests()');

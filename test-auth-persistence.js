/**
 * Simple test script to verify authentication persistence functionality
 * This can be run independently to test the storage mechanisms
 */

const AsyncStorage = require('@react-native-async-storage/async-storage');

// Mock user session for testing
const mockUserSession = {
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin',
  permissions: {
    dashboard: true,
    products: { view: true, add: true, edit: true, delete: false },
    inventory: { view: true, add: true, edit: true, delete: false, transfer: true },
    sales: { view: true, add: true, edit: true, delete: false, invoice: true },
    customers: { view: true, add: true, edit: true, delete: false },
    suppliers: { view: true, add: true, edit: true, delete: false },
    samples: { view: true, add: true, edit: true, delete: false },
    reports: { view: true, export: true },
    notifications: { view: true, manage: true },
    activityLogs: { view: true },
    settings: { view: true, userManagement: true, systemSettings: true },
    help: { view: true }
  },
  assignedLocations: [],
  assigned_location_id: null,
  loginTime: new Date().toISOString()
};

async function testAuthPersistence() {
  console.log('🧪 Testing Authentication Persistence...\n');

  try {
    // Test 1: Save session
    console.log('1️⃣ Testing session save...');
    await AsyncStorage.setItem('userSession', JSON.stringify(mockUserSession));
    console.log('✅ Session saved successfully');

    // Test 2: Retrieve session
    console.log('\n2️⃣ Testing session retrieval...');
    const retrievedSession = await AsyncStorage.getItem('userSession');
    
    if (retrievedSession) {
      const parsedSession = JSON.parse(retrievedSession);
      console.log('✅ Session retrieved successfully');
      console.log('📧 Email:', parsedSession.email);
      console.log('👤 Role:', parsedSession.role);
      console.log('⏰ Login Time:', parsedSession.loginTime);
    } else {
      console.log('❌ No session found');
      return false;
    }

    // Test 3: Session validation
    console.log('\n3️⃣ Testing session validation...');
    const sessionData = JSON.parse(retrievedSession);
    
    // Check session expiration (24 hours)
    const sessionAge = Date.now() - new Date(sessionData.loginTime).getTime();
    const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    if (sessionAge > sessionTimeout) {
      console.log('❌ Session expired');
      await AsyncStorage.removeItem('userSession');
      return false;
    } else {
      console.log('✅ Session is still valid');
      console.log('⏱️ Session age:', Math.round(sessionAge / (1000 * 60)), 'minutes');
    }

    // Test 4: Session cleanup
    console.log('\n4️⃣ Testing session cleanup...');
    await AsyncStorage.removeItem('userSession');
    
    const cleanupCheck = await AsyncStorage.getItem('userSession');
    if (cleanupCheck === null) {
      console.log('✅ Session cleaned up successfully');
    } else {
      console.log('❌ Session cleanup failed');
      return false;
    }

    console.log('\n🎉 All authentication persistence tests passed!');
    return true;

  } catch (error) {
    console.error('\n❌ Authentication persistence test failed:', error);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testAuthPersistence().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testAuthPersistence, mockUserSession };

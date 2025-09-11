import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Test AsyncStorage functionality specifically for mobile devices
 */
export async function testMobileStorage(): Promise<{
  success: boolean;
  error?: string;
  details: {
    canWrite: boolean;
    canRead: boolean;
    canDelete: boolean;
    dataIntegrity: boolean;
  };
}> {
  const testKey = 'mobile_storage_test_' + Date.now();
  const testData = {
    id: 'test-user-123',
    email: 'test@mobile.com',
    name: 'Mobile Test User',
    role: 'admin',
    permissions: { dashboard: true, users: true },
    assignedLocations: [1, 2, 3],
    assigned_location_id: 1,
    loginTime: new Date().toISOString()
  };
  
  const details = {
    canWrite: false,
    canRead: false,
    canDelete: false,
    dataIntegrity: false
  };

  try {
    console.log('🧪 Starting mobile storage test...');
    
    // Test 1: Write data
    console.log('📝 Testing write capability...');
    await AsyncStorage.setItem(testKey, JSON.stringify(testData));
    details.canWrite = true;
    console.log('✅ Write test passed');

    // Test 2: Read data
    console.log('📖 Testing read capability...');
    const retrievedData = await AsyncStorage.getItem(testKey);
    if (retrievedData) {
      details.canRead = true;
      console.log('✅ Read test passed');

      // Test 3: Data integrity
      console.log('🔍 Testing data integrity...');
      const parsedData = JSON.parse(retrievedData);
      if (parsedData.id === testData.id && 
          parsedData.email === testData.email && 
          parsedData.role === testData.role) {
        details.dataIntegrity = true;
        console.log('✅ Data integrity test passed');
      } else {
        console.error('❌ Data integrity test failed');
        console.error('Expected:', testData);
        console.error('Got:', parsedData);
      }
    } else {
      console.error('❌ Read test failed - no data retrieved');
    }

    // Test 4: Delete data
    console.log('🗑️ Testing delete capability...');
    await AsyncStorage.removeItem(testKey);
    const deletedCheck = await AsyncStorage.getItem(testKey);
    if (deletedCheck === null) {
      details.canDelete = true;
      console.log('✅ Delete test passed');
    } else {
      console.error('❌ Delete test failed - data still exists');
    }

    const success = details.canWrite && details.canRead && details.canDelete && details.dataIntegrity;
    console.log(success ? '🎉 All mobile storage tests passed!' : '❌ Some mobile storage tests failed');
    
    return { success, details };

  } catch (error: any) {
    console.error('❌ Mobile storage test error:', error);
    return {
      success: false,
      error: error.message,
      details
    };
  }
}

/**
 * Test session persistence specifically
 */
export async function testSessionPersistence(): Promise<boolean> {
  const sessionKey = 'userSession';
  const testSession = {
    id: 'test-session-123',
    email: 'admin@test.com',
    name: 'Test Admin',
    role: 'admin',
    permissions: { dashboard: true },
    assignedLocations: [],
    assigned_location_id: null,
    loginTime: new Date().toISOString()
  };

  try {
    console.log('🧪 Testing session persistence...');
    
    // Save session
    await AsyncStorage.setItem(sessionKey, JSON.stringify(testSession));
    console.log('💾 Test session saved');

    // Simulate app restart delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Retrieve session
    const retrievedSession = await AsyncStorage.getItem(sessionKey);
    if (retrievedSession) {
      const parsedSession = JSON.parse(retrievedSession);
      const isValid = parsedSession.email === testSession.email && 
                     parsedSession.id === testSession.id;
      
      console.log(isValid ? '✅ Session persistence test passed' : '❌ Session persistence test failed');
      
      // Clean up
      await AsyncStorage.removeItem(sessionKey);
      
      return isValid;
    } else {
      console.error('❌ Session persistence test failed - no session retrieved');
      return false;
    }
  } catch (error) {
    console.error('❌ Session persistence test error:', error);
    return false;
  }
}

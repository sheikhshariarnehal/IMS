/**
 * Storage debugging utilities to help troubleshoot authentication persistence issues
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import SafeStorage from './safeStorage';

// Use safe storage for web environment to handle localStorage issues
const isWeb = typeof window !== 'undefined';
const storage = isWeb ? SafeStorage : AsyncStorage;

export interface StorageDebugInfo {
  hasStorageAccess: boolean;
  storageType: 'AsyncStorage' | 'SafeStorage' | 'localStorage' | 'InMemory';
  canWrite: boolean;
  canRead: boolean;
  sessionExists: boolean;
  sessionData?: any;
  error?: string;
}

/**
 * Comprehensive storage debugging function
 */
export async function debugStorage(): Promise<StorageDebugInfo> {
  const debugInfo: StorageDebugInfo = {
    hasStorageAccess: false,
    storageType: isWeb ? 'SafeStorage' : 'AsyncStorage',
    canWrite: false,
    canRead: false,
    sessionExists: false,
  };

  try {
    // Test basic storage access
    console.log('🔍 Testing storage access...');
    
    // Test write capability
    const testKey = '__storage_debug_test__';
    const testValue = JSON.stringify({ test: true, timestamp: Date.now() });
    
    await storage.setItem(testKey, testValue);
    debugInfo.canWrite = true;
    console.log('✅ Storage write test passed');

    // Test read capability
    const retrievedValue = await storage.getItem(testKey);
    if (retrievedValue === testValue) {
      debugInfo.canRead = true;
      console.log('✅ Storage read test passed');
    } else {
      console.error('❌ Storage read test failed - value mismatch');
      debugInfo.error = 'Read/write mismatch';
    }

    // Clean up test data
    await storage.removeItem(testKey);

    debugInfo.hasStorageAccess = debugInfo.canWrite && debugInfo.canRead;

    // Check for existing session
    console.log('🔍 Checking for existing user session...');
    const sessionData = await storage.getItem('userSession');
    
    if (sessionData) {
      debugInfo.sessionExists = true;
      try {
        const parsedSession = JSON.parse(sessionData);
        debugInfo.sessionData = {
          email: parsedSession.email,
          loginTime: parsedSession.loginTime,
          hasPermissions: !!parsedSession.permissions,
          sessionAge: Date.now() - new Date(parsedSession.loginTime).getTime(),
        };
        console.log('✅ Found existing session for:', parsedSession.email);
      } catch (parseError) {
        console.error('❌ Failed to parse existing session:', parseError);
        debugInfo.error = 'Session parse error';
      }
    } else {
      console.log('📭 No existing session found');
    }

  } catch (error: any) {
    console.error('❌ Storage debug failed:', error);
    debugInfo.error = error.message || 'Unknown storage error';
  }

  return debugInfo;
}

/**
 * Log detailed storage information to console
 */
export async function logStorageDebugInfo(): Promise<void> {
  console.log('🔧 === STORAGE DEBUG INFO ===');

  const debugInfo = await debugStorage();

  console.log('📱 Platform:', isWeb ? 'Web' : 'Mobile');
  console.log('💾 Storage Type:', debugInfo.storageType);
  console.log('✅ Has Storage Access:', debugInfo.hasStorageAccess);
  console.log('📝 Can Write:', debugInfo.canWrite);
  console.log('📖 Can Read:', debugInfo.canRead);
  console.log('👤 Session Exists:', debugInfo.sessionExists);

  if (debugInfo.sessionData) {
    console.log('📊 Session Info:', debugInfo.sessionData);
  }

  if (debugInfo.error) {
    console.error('❌ Error:', debugInfo.error);
  }

  // Additional mobile-specific test
  if (!isWeb) {
    console.log('📱 Running mobile-specific storage test...');
    try {
      const testKey = 'mobile_storage_test';
      const testValue = 'mobile_test_value_' + Date.now();

      await storage.setItem(testKey, testValue);
      const retrieved = await storage.getItem(testKey);

      if (retrieved === testValue) {
        console.log('✅ Mobile storage test passed');
      } else {
        console.error('❌ Mobile storage test failed - value mismatch');
      }

      await storage.removeItem(testKey);
    } catch (error) {
      console.error('❌ Mobile storage test error:', error);
    }
  }

  console.log('🔧 === END DEBUG INFO ===');
}

/**
 * Clear all authentication-related storage (for debugging)
 */
export async function clearAuthStorage(): Promise<void> {
  try {
    console.log('🧹 Clearing authentication storage...');
    await storage.removeItem('userSession');
    console.log('✅ Authentication storage cleared');
  } catch (error) {
    console.error('❌ Failed to clear auth storage:', error);
  }
}

/**
 * Force save a test session (for debugging)
 */
export async function saveTestSession(): Promise<boolean> {
  try {
    const testSession = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
      permissions: {},
      assignedLocations: [],
      assigned_location_id: null,
      loginTime: new Date().toISOString()
    };

    console.log('💾 Saving test session...');
    await storage.setItem('userSession', JSON.stringify(testSession));
    
    // Verify it was saved
    const saved = await storage.getItem('userSession');
    if (saved) {
      console.log('✅ Test session saved successfully');
      return true;
    } else {
      console.error('❌ Test session was not saved');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to save test session:', error);
    return false;
  }
}

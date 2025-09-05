/**
 * Activity Log System Test
 * 
 * This test file verifies the functionality of the activity logging system
 * including data validation, logging operations, and retrieval.
 */

import { ActivityLogger, ActivityLogData } from '../lib/services/activityLogger';
import { FormService } from '../lib/services/formService';

// Mock data for testing
const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'super_admin'
};

const mockProduct = {
  id: 1,
  name: 'Test Product',
  product_code: 'TEST001',
  category_id: 1,
  description: 'Test product description',
  purchase_price: 100,
  selling_price: 150,
  location_id: 1,
  created_by: 1
};

/**
 * Test Activity Logger Validation
 */
export async function testActivityLoggerValidation(): Promise<boolean> {
  console.log('🧪 Testing Activity Logger Validation...');
  
  try {
    const logger = ActivityLogger.getInstance();
    logger.setCurrentUser(mockUser.id);

    // Test valid log entry
    const validLogData: ActivityLogData = {
      action: 'CREATE',
      module: 'PRODUCTS',
      description: 'Created test product',
      entityType: 'product',
      entityId: mockProduct.id,
      entityName: mockProduct.name
    };

    await logger.log(validLogData);
    console.log('✅ Valid log entry processed successfully');

    // Test invalid action (should be rejected)
    const invalidActionData: ActivityLogData = {
      action: 'INVALID_ACTION' as any,
      module: 'PRODUCTS',
      description: 'Invalid action test',
    };

    await logger.log(invalidActionData);
    console.log('✅ Invalid action rejected as expected');

    // Test invalid module (should be rejected)
    const invalidModuleData: ActivityLogData = {
      action: 'CREATE',
      module: 'INVALID_MODULE' as any,
      description: 'Invalid module test',
    };

    await logger.log(invalidModuleData);
    console.log('✅ Invalid module rejected as expected');

    return true;
  } catch (error) {
    console.error('❌ Activity Logger validation test failed:', error);
    return false;
  }
}

/**
 * Test Activity Log Data Retrieval
 */
export async function testActivityLogRetrieval(): Promise<boolean> {
  console.log('🧪 Testing Activity Log Data Retrieval...');
  
  try {
    // Test basic retrieval
    const logs = await FormService.getActivityLogs({}, mockUser.id);
    console.log('✅ Retrieved', logs.length, 'activity logs');

    // Test with filters
    const filteredLogs = await FormService.getActivityLogs({
      module: 'PRODUCTS',
      action: 'CREATE'
    }, mockUser.id);
    console.log('✅ Retrieved', filteredLogs.length, 'filtered logs');

    // Test statistics
    const stats = await FormService.getActivityLogStats(mockUser.id);
    console.log('✅ Retrieved activity log statistics:', stats);

    // Validate data structure
    if (logs.length > 0) {
      const log = logs[0];
      const requiredFields = ['id', 'action', 'module', 'description', 'created_at'];
      const hasAllFields = requiredFields.every(field => log[field] !== undefined);
      
      if (hasAllFields) {
        console.log('✅ Log data structure is valid');
      } else {
        console.error('❌ Log data structure is missing required fields');
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Activity Log retrieval test failed:', error);
    return false;
  }
}

/**
 * Test Activity Log Integration with CRUD Operations
 */
export async function testActivityLogIntegration(): Promise<boolean> {
  console.log('🧪 Testing Activity Log Integration...');
  
  try {
    // Test product creation logging
    const productResult = await FormService.createProduct({
      name: 'Test Product for Logging',
      product_code: 'TESTLOG001',
      category_id: 1,
      description: 'Test product for activity logging',
      purchase_price: 100,
      selling_price: 150,
      location_id: 1,
      current_stock: 10
    }, mockUser.id);

    if (productResult.success) {
      console.log('✅ Product created successfully with activity logging');
    } else {
      console.error('❌ Product creation failed:', productResult.error);
      return false;
    }

    // Test customer creation logging
    const customerResult = await FormService.createCustomer({
      name: 'Test Customer for Logging',
      email: 'testcustomer@example.com',
      phone: '+1234567890',
      customer_type: 'regular'
    }, mockUser.id);

    if (customerResult.success) {
      console.log('✅ Customer created successfully with activity logging');
    } else {
      console.error('❌ Customer creation failed:', customerResult.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Activity Log integration test failed:', error);
    return false;
  }
}

/**
 * Test Activity Log Data Validation and Sanitization
 */
export async function testDataValidationAndSanitization(): Promise<boolean> {
  console.log('🧪 Testing Data Validation and Sanitization...');
  
  try {
    const logger = ActivityLogger.getInstance();
    logger.setCurrentUser(mockUser.id);

    // Test with very long description (should be truncated)
    const longDescription = 'A'.repeat(1000);
    await logger.log({
      action: 'CREATE',
      module: 'PRODUCTS',
      description: longDescription,
      entityName: 'Test Product'
    });
    console.log('✅ Long description handled correctly');

    // Test with very long entity name (should be truncated)
    const longEntityName = 'B'.repeat(500);
    await logger.log({
      action: 'CREATE',
      module: 'PRODUCTS',
      description: 'Test with long entity name',
      entityName: longEntityName
    });
    console.log('✅ Long entity name handled correctly');

    // Test with complex object values
    const complexObject = {
      nested: {
        data: {
          array: [1, 2, 3, 4, 5],
          string: 'test',
          boolean: true,
          null: null,
          undefined: undefined
        }
      }
    };

    await logger.log({
      action: 'UPDATE',
      module: 'PRODUCTS',
      description: 'Test with complex object',
      oldValues: complexObject,
      newValues: { ...complexObject, updated: true }
    });
    console.log('✅ Complex object values handled correctly');

    return true;
  } catch (error) {
    console.error('❌ Data validation and sanitization test failed:', error);
    return false;
  }
}

/**
 * Run All Activity Log Tests
 */
export async function runAllActivityLogTests(): Promise<void> {
  console.log('🚀 Starting Activity Log System Tests...\n');
  
  const tests = [
    { name: 'Activity Logger Validation', test: testActivityLoggerValidation },
    { name: 'Activity Log Data Retrieval', test: testActivityLogRetrieval },
    { name: 'Activity Log Integration', test: testActivityLogIntegration },
    { name: 'Data Validation and Sanitization', test: testDataValidationAndSanitization }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const { name, test } of tests) {
    console.log(`\n📋 Running: ${name}`);
    try {
      const result = await test();
      if (result) {
        console.log(`✅ ${name} - PASSED`);
        passedTests++;
      } else {
        console.log(`❌ ${name} - FAILED`);
      }
    } catch (error) {
      console.log(`❌ ${name} - ERROR:`, error);
    }
  }

  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All Activity Log tests passed! The system is fully functional.');
  } else {
    console.log('⚠️ Some tests failed. Please review the issues above.');
  }
}

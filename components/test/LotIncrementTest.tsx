import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { FormService } from '@/lib/services/formService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface LotTestResult {
  batchNumber: number;
  lotNumber: number;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  success: boolean;
  error?: string;
}

export default function LotIncrementTest() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<LotTestResult[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number>(38); // Default to product ID 38
  const [newProductTest, setNewProductTest] = useState<any>(null);

  const runLotIncrementTest = async () => {
    if (!user?.id) {
      showToast('User not authenticated', 'error');
      return;
    }

    setIsLoading(true);
    setTestResults([]);
    const results: LotTestResult[] = [];

    try {
      showToast('🧪 Starting lot increment test...', 'info');

      // Test adding stock 3 times to see lot numbers increment
      for (let i = 1; i <= 3; i++) {
        const testStockData = {
          name: '',
          product_code: '',
          current_stock: 10 * i, // 10, 20, 30
          purchase_price: 100 + (i * 10), // 110, 120, 130
          selling_price: 150 + (i * 10), // 160, 170, 180
        };

        console.log(`📦 Adding stock batch ${i}...`);
        const result = await FormService.addStockToExistingProduct(
          selectedProductId, 
          testStockData, 
          user.id
        );

        const testResult: LotTestResult = {
          batchNumber: i,
          lotNumber: result.data?.lot?.lot_number || 0,
          quantity: testStockData.current_stock,
          purchasePrice: testStockData.purchase_price,
          sellingPrice: testStockData.selling_price,
          success: result.success,
          error: result.error,
        };

        results.push(testResult);
        setTestResults([...results]);

        if (result.success) {
          console.log(`✅ Batch ${i} added successfully. Lot number: ${result.data?.lot?.lot_number}`);
        } else {
          console.error(`❌ Batch ${i} failed: ${result.error}`);
          break; // Stop on first error
        }
      }

      if (results.every(r => r.success)) {
        showToast('✅ All lot increments successful!', 'success');
      } else {
        showToast('❌ Some lot increments failed', 'error');
      }

    } catch (error) {
      console.error('Test error:', error);
      showToast('Test failed with error', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const testNewProductCreation = async () => {
    if (!user?.id) {
      showToast('User not authenticated', 'error');
      return;
    }

    setIsLoading(true);
    try {
      showToast('🧪 Testing new product creation with first lot...', 'info');

      const newProductData = {
        name: `Test Product ${Date.now()}`,
        product_code: `TEST-${Date.now()}`,
        current_stock: 50, // This should create the first lot
        purchase_price: 100,
        selling_price: 150,
        description: 'Test product for lot functionality',
      };

      const result = await FormService.createProduct(newProductData, user.id);

      if (result.success) {
        setNewProductTest(result.data);
        showToast('✅ New product created successfully!', 'success');
      } else {
        showToast(`❌ Failed to create product: ${result.error}`, 'error');
      }
    } catch (error) {
      showToast('Test failed with error', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const recalculateAllStocks = async () => {
    setIsLoading(true);
    try {
      showToast('🔄 Recalculating all total stocks...', 'info');
      const result = await FormService.recalculateAllTotalStocks();

      if (result.success) {
        showToast(`✅ Updated ${result.updated} products`, 'success');
      } else {
        showToast(`❌ Failed: ${result.error}`, 'error');
      }
    } catch (error) {
      showToast('Recalculation failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const clearTestData = async () => {
    Alert.alert(
      'Clear Test Data',
      'This will reset test results. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setTestResults([]);
            setNewProductTest(null);
            showToast('Test data cleared', 'success');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Lot Number Increment Test</Text>
        <Text style={styles.subtitle}>
          Testing auto-increment functionality for product lots
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Configuration</Text>
        <Text style={styles.info}>Product ID: {selectedProductId}</Text>
        <Text style={styles.info}>Test: Add 3 stock batches with incrementing lot numbers</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testNewProductCreation}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '🔄 Testing...' : '🆕 Test New Product + First Lot'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={runLotIncrementTest}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '🔄 Running Test...' : '📈 Test Lot Increment'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.utilityButton]}
          onPress={recalculateAllStocks}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🔄 Recalculate All Stocks</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearTestData}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🗑️ Clear Test Data</Text>
        </TouchableOpacity>
      </View>

      {newProductTest && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>New Product Test Result</Text>
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>✅ Product Created</Text>
            <Text style={styles.resultText}>ID: {newProductTest.id}</Text>
            <Text style={styles.resultText}>Name: {newProductTest.name}</Text>
            <Text style={styles.resultText}>Code: {newProductTest.product_code}</Text>
            <Text style={styles.resultText}>Current Stock: {newProductTest.current_stock}</Text>
            <Text style={styles.resultText}>Total Stock: {newProductTest.total_stock}</Text>
            <Text style={styles.infoText}>
              ✅ First lot should be automatically created in products_lot table
            </Text>
          </View>
        </View>
      )}

      {testResults.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lot Increment Test Results</Text>
          {testResults.map((result, index) => (
            <View key={index} style={[styles.resultCard, result.success ? styles.successCard : styles.errorCard]}>
              <Text style={styles.resultTitle}>
                Batch {result.batchNumber} {result.success ? '✅' : '❌'}
              </Text>
              <Text style={styles.resultText}>Lot Number: {result.lotNumber}</Text>
              <Text style={styles.resultText}>Quantity: {result.quantity}</Text>
              <Text style={styles.resultText}>Purchase Price: ${result.purchasePrice}</Text>
              <Text style={styles.resultText}>Selling Price: ${result.sellingPrice}</Text>
              {result.error && (
                <Text style={styles.errorText}>Error: {result.error}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expected Behavior</Text>
        <Text style={styles.info}>🆕 <Text style={styles.bold}>New Product Creation:</Text></Text>
        <Text style={styles.info}>• Creates product with initial stock</Text>
        <Text style={styles.info}>• Automatically creates first lot (lot_number: 1)</Text>
        <Text style={styles.info}>• Sets total_stock = sum of all lot quantities</Text>

        <Text style={styles.info}>📈 <Text style={styles.bold}>Adding Stock to Existing:</Text></Text>
        <Text style={styles.info}>• Batch 1 should create Lot Number: 1 (or next available)</Text>
        <Text style={styles.info}>• Batch 2 should create Lot Number: 2</Text>
        <Text style={styles.info}>• Batch 3 should create Lot Number: 3</Text>
        <Text style={styles.info}>• Each lot saved to products_lot table</Text>
        <Text style={styles.info}>• total_stock automatically calculated from all lots</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  info: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#007AFF',
  },
  utilityButton: {
    backgroundColor: '#FF9500',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  bold: {
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultCard: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
  },
  successCard: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    fontStyle: 'italic',
  },
});

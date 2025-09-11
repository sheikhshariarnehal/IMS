import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import SessionStatus from '@/components/SessionStatus';

export default function AuthTestPage() {
  const { theme } = useTheme();
  const { user, login, logout, debugStorage, testPersistence, checkCurrentSession, testMobileStorageFunction } = useAuth();
  const router = useRouter();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const handleTestLogin = async () => {
    try {
      addTestResult('🔄 Testing login...');
      const result = await login({
        email: 'admin@serranotex.com',
        password: 'admin123'
      });

      if (result.success) {
        addTestResult('✅ Login successful');
      } else {
        addTestResult(`❌ Login failed: ${result.error}`);
      }
    } catch (error: any) {
      addTestResult(`❌ Login error: ${error.message}`);
    }
  };

  const handleTestLogout = async () => {
    try {
      addTestResult('🔄 Testing logout...');
      await logout();
      addTestResult('✅ Logout successful');
    } catch (error: any) {
      addTestResult(`❌ Logout error: ${error.message}`);
    }
  };

  const handleDebugStorage = async () => {
    try {
      addTestResult('🔄 Running storage debug...');
      if (debugStorage) {
        await debugStorage();
        addTestResult('✅ Storage debug completed (check console)');
      } else {
        addTestResult('⚠️ Debug storage not available');
      }
    } catch (error: any) {
      addTestResult(`❌ Debug error: ${error.message}`);
    }
  };

  const handleTestPersistence = async () => {
    try {
      addTestResult('🔄 Testing persistence...');
      if (testPersistence) {
        const result = await testPersistence();
        addTestResult(result ? '✅ Persistence test passed' : '❌ Persistence test failed');
      } else {
        addTestResult('⚠️ Test persistence not available');
      }
    } catch (error: any) {
      addTestResult(`❌ Persistence test error: ${error.message}`);
    }
  };

  const handleCheckSession = async () => {
    try {
      addTestResult('🔄 Checking current session...');
      if (checkCurrentSession) {
        await checkCurrentSession();
        addTestResult('✅ Session check completed (see console)');
      } else {
        addTestResult('⚠️ Check session not available');
      }
    } catch (error: any) {
      addTestResult(`❌ Session check error: ${error.message}`);
    }
  };

  const handleTestMobileStorage = async () => {
    try {
      addTestResult('🔄 Testing mobile storage...');
      if (testMobileStorageFunction) {
        const result = await testMobileStorageFunction();
        addTestResult(result ? '✅ Mobile storage test passed' : '❌ Mobile storage test failed');
      } else {
        addTestResult('⚠️ Mobile storage test not available');
      }
    } catch (error: any) {
      addTestResult(`❌ Mobile storage test error: ${error.message}`);
    }
  };

  const handleClearResults = () => {
    setTestResults([]);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    userInfo: {
      backgroundColor: theme.colors.surface,
      padding: 15,
      borderRadius: 8,
      marginBottom: 20,
    },
    userText: {
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 5,
    },
    buttonContainer: {
      marginBottom: 20,
    },
    button: {
      backgroundColor: theme.colors.primary,
      padding: 15,
      borderRadius: 8,
      marginBottom: 10,
      alignItems: 'center',
    },
    buttonText: {
      color: theme.colors.background,
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    secondaryButtonText: {
      color: theme.colors.text,
    },
    resultsContainer: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 15,
    },
    resultsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 10,
    },
    resultText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 5,
      fontFamily: 'monospace',
    },
    backButton: {
      backgroundColor: theme.colors.error,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Authentication Test</Text>
        <Text style={styles.subtitle}>Test authentication persistence functionality</Text>
      </View>

      <ScrollView style={styles.content}>
        <SessionStatus />

        {/* User Status */}
        <View style={styles.userInfo}>
          <Text style={styles.userText}>
            Status: {user ? '✅ Authenticated' : '❌ Not Authenticated'}
          </Text>
          {user && (
            <>
              <Text style={styles.userText}>Email: {user.email}</Text>
              <Text style={styles.userText}>Role: {user.role}</Text>
              <Text style={styles.userText}>
                Login Time: {new Date(user.loginTime).toLocaleString()}
              </Text>
            </>
          )}
        </View>

        {/* Test Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleTestLogin}>
            <Text style={styles.buttonText}>Test Login</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleTestLogout}>
            <Text style={styles.buttonText}>Test Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={handleDebugStorage}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Debug Storage
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleTestPersistence}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Test Persistence
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleCheckSession}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Check Session
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleTestMobileStorage}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Test Mobile Storage
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Back to App</Text>
          </TouchableOpacity>
        </View>

        {/* Test Results */}
        <View style={styles.resultsContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.resultsTitle}>Test Results</Text>
            <TouchableOpacity onPress={handleClearResults}>
              <Text style={{ color: theme.colors.primary }}>Clear</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={{ maxHeight: 300 }}>
            {testResults.length === 0 ? (
              <Text style={styles.resultText}>No test results yet...</Text>
            ) : (
              testResults.map((result, index) => (
                <Text key={index} style={styles.resultText}>
                  {result}
                </Text>
              ))
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

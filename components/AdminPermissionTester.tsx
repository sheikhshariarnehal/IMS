import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLocations } from '../contexts/LocationContext';
import { useTheme } from '../contexts/ThemeContext';

interface PermissionTest {
  module: string;
  action: string;
  locationId?: number;
  description: string;
}

export default function AdminPermissionTester() {
  const { theme } = useTheme();
  const { hasPermission, user, refreshUserData } = useAuth();
  const { locations } = useLocations();
  const [selectedLocationId, setSelectedLocationId] = useState<number | undefined>();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Test cases for admin permissions
  const permissionTests: PermissionTest[] = [
    // Product permissions
    { module: 'products', action: 'view', description: 'View products (any location)' },
    { module: 'products', action: 'add', description: 'Add products (warehouse only)' },
    { module: 'products', action: 'edit', description: 'Edit products (any assigned location)' },
    { module: 'products', action: 'delete', description: 'Delete products (❌ SHOULD BE DENIED)' },

    // Inventory permissions
    { module: 'inventory', action: 'view', description: 'View inventory (any location)' },
    { module: 'inventory', action: 'transfer', description: 'Transfer products (warehouse only)' },
    { module: 'inventory', action: 'add', description: 'Add inventory (any assigned location)' },
    { module: 'inventory', action: 'edit', description: 'Edit inventory (any assigned location)' },
    { module: 'inventory', action: 'delete', description: 'Delete inventory (❌ SHOULD BE DENIED)' },

    // Sales permissions
    { module: 'sales', action: 'view', description: 'View sales (any location)' },
    { module: 'sales', action: 'add', description: 'Create sales (showroom only)' },
    { module: 'sales', action: 'edit', description: 'Edit sales (any assigned location)' },
    { module: 'sales', action: 'delete', description: 'Delete sales (❌ SHOULD BE DENIED)' },

    // Customer, Supplier, Category permissions (should be allowed)
    { module: 'customers', action: 'view', description: 'View customers (✅ SHOULD BE ALLOWED)' },
    { module: 'customers', action: 'add', description: 'Add customers (✅ SHOULD BE ALLOWED)' },
    { module: 'customers', action: 'edit', description: 'Edit customers (✅ SHOULD BE ALLOWED)' },
    { module: 'customers', action: 'delete', description: 'Delete customers (❌ SHOULD BE DENIED)' },

    { module: 'suppliers', action: 'view', description: 'View suppliers (✅ SHOULD BE ALLOWED)' },
    { module: 'suppliers', action: 'add', description: 'Add suppliers (✅ SHOULD BE ALLOWED)' },
    { module: 'suppliers', action: 'edit', description: 'Edit suppliers (✅ SHOULD BE ALLOWED)' },
    { module: 'suppliers', action: 'delete', description: 'Delete suppliers (❌ SHOULD BE DENIED)' },

    { module: 'categories', action: 'view', description: 'View categories (✅ SHOULD BE ALLOWED)' },
    { module: 'categories', action: 'add', description: 'Add categories (✅ SHOULD BE ALLOWED)' },
    { module: 'categories', action: 'edit', description: 'Edit categories (✅ SHOULD BE ALLOWED)' },
    { module: 'categories', action: 'delete', description: 'Delete categories (❌ SHOULD BE DENIED)' },

    // User management (should be denied)
    { module: 'users', action: 'view', description: 'View users (depends on implementation)' },
    { module: 'users', action: 'add', description: 'Add users (❌ SHOULD BE DENIED)' },
    { module: 'users', action: 'edit', description: 'Edit users (❌ SHOULD BE DENIED)' },
    { module: 'users', action: 'delete', description: 'Delete users (❌ SHOULD BE DENIED)' },

    // Reports and dashboard
    { module: 'reports', action: 'view', description: 'View reports (✅ SHOULD BE ALLOWED)' },
    { module: 'reports', action: 'export', description: 'Export reports (✅ SHOULD BE ALLOWED)' },
    { module: 'dashboard', action: 'view', description: 'View dashboard (✅ SHOULD BE ALLOWED)' },
  ];

  if (user?.role !== 'admin') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          Admin Permission Tester
        </Text>
        <Text style={[styles.message, { color: theme.colors.text.secondary }]}>
          This component is only available for Admin users.
        </Text>
      </View>
    );
  }

  const adminLocations = user.permissions?.locations || [];

  const handleRefreshPermissions = async () => {
    setIsRefreshing(true);
    try {
      await refreshUserData();
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>
        Admin Permission Tester
      </Text>
      
      <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
        Current User: {user.name} ({user.email})
      </Text>
      
      <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
        Assigned Locations: {adminLocations.length > 0 ? adminLocations.join(', ') : 'None (try refreshing)'}
      </Text>

      {/* Refresh Button */}
      <TouchableOpacity
        style={[styles.refreshButton, { backgroundColor: theme.colors.primary.main }]}
        onPress={handleRefreshPermissions}
        disabled={isRefreshing}
      >
        <Text style={[styles.refreshButtonText, { color: theme.colors.primary.contrast }]}>
          {isRefreshing ? 'Refreshing...' : 'Refresh Permissions'}
        </Text>
      </TouchableOpacity>

      {/* Business Rules Summary */}
      <View style={[styles.section, { backgroundColor: theme.colors.background.secondary, padding: 16, borderRadius: 8, marginTop: 16 }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Admin Business Rules
        </Text>
        <Text style={[styles.ruleText, { color: theme.colors.text.secondary }]}>
          ✅ <Text style={{ fontWeight: 'bold' }}>CAN DO:</Text>
        </Text>
        <Text style={[styles.ruleText, { color: theme.colors.text.secondary }]}>
          • Add products (warehouse locations only)
        </Text>
        <Text style={[styles.ruleText, { color: theme.colors.text.secondary }]}>
          • Transfer products (warehouse locations only)
        </Text>
        <Text style={[styles.ruleText, { color: theme.colors.text.secondary }]}>
          • Create sales (showroom locations only)
        </Text>
        <Text style={[styles.ruleText, { color: theme.colors.text.secondary }]}>
          • Add/edit customers, suppliers, categories
        </Text>
        <Text style={[styles.ruleText, { color: theme.colors.text.secondary }]}>
          • View/export reports for assigned locations
        </Text>

        <Text style={[styles.ruleText, { color: theme.colors.error.main, marginTop: 8 }]}>
          ❌ <Text style={{ fontWeight: 'bold' }}>CANNOT DO:</Text>
        </Text>
        <Text style={[styles.ruleText, { color: theme.colors.error.main }]}>
          • Delete anything (products, sales, customers, etc.)
        </Text>
        <Text style={[styles.ruleText, { color: theme.colors.error.main }]}>
          • Create/manage users or admin accounts
        </Text>
        <Text style={[styles.ruleText, { color: theme.colors.error.main }]}>
          • Access locations not assigned to them
        </Text>
      </View>

      {/* Location Selector */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Test Location (Optional)
        </Text>
        <View style={styles.locationButtons}>
          <TouchableOpacity
            style={[
              styles.locationButton,
              { backgroundColor: theme.colors.background.secondary },
              !selectedLocationId && { backgroundColor: theme.colors.primary.main }
            ]}
            onPress={() => setSelectedLocationId(undefined)}
          >
            <Text style={[
              styles.locationButtonText,
              { color: theme.colors.text.primary },
              !selectedLocationId && { color: theme.colors.primary.contrast }
            ]}>
              No Location
            </Text>
          </TouchableOpacity>
          
          {locations.map(location => (
            <TouchableOpacity
              key={location.id}
              style={[
                styles.locationButton,
                { backgroundColor: theme.colors.background.secondary },
                selectedLocationId === location.id && { backgroundColor: theme.colors.primary.main }
              ]}
              onPress={() => setSelectedLocationId(location.id)}
            >
              <Text style={[
                styles.locationButtonText,
                { color: theme.colors.text.primary },
                selectedLocationId === location.id && { color: theme.colors.primary.contrast }
              ]}>
                {location.name} ({location.type})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Permission Tests */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Permission Test Results
        </Text>
        
        {permissionTests.map((test, index) => {
          const hasAccess = hasPermission(test.module, test.action, selectedLocationId?.toString());
          
          return (
            <View key={index} style={[styles.testRow, { borderBottomColor: theme.colors.border.light }]}>
              <View style={styles.testInfo}>
                <Text style={[styles.testDescription, { color: theme.colors.text.primary }]}>
                  {test.description}
                </Text>
                <Text style={[styles.testDetails, { color: theme.colors.text.secondary }]}>
                  {test.module}.{test.action}
                  {selectedLocationId && ` @ Location ${selectedLocationId}`}
                </Text>
              </View>
              
              <View style={[
                styles.resultBadge,
                { backgroundColor: hasAccess ? theme.colors.success.main : theme.colors.error.main }
              ]}>
                <Text style={[styles.resultText, { color: theme.colors.success.contrast }]}>
                  {hasAccess ? 'ALLOWED' : 'DENIED'}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  locationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  testRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  testInfo: {
    flex: 1,
  },
  testDescription: {
    fontSize: 16,
    fontWeight: '500',
  },
  testDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 12,
  },
  resultText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  ruleText: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  refreshButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

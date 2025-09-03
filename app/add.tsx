import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import {
  ShoppingCart,
  Users,
  Package,
  ArrowLeft,
  Plus,
} from 'lucide-react-native';
import SalesForm from '@/components/forms/SalesForm';
import CustomerAddForm from '@/components/forms/CustomerAddForm';

export default function AddPage() {
  const { theme } = useTheme();
  const { hasPermission, user } = useAuth();
  const router = useRouter();
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  const quickActions = [
    {
      id: 'sale',
      title: 'New Sale',
      subtitle: 'Create a new sale transaction',
      icon: ShoppingCart,
      color: theme.colors.primary,
      permission: 'sales',
      action: 'add',
      onPress: () => setShowSalesForm(true),
    },
    {
      id: 'customer',
      title: 'New Customer',
      subtitle: 'Add a new customer',
      icon: Users,
      color: theme.colors.success,
      permission: 'customers',
      action: 'add',
      onPress: () => setShowCustomerForm(true),
    },
  ];

  // Filter actions based on permissions
  const availableActions = quickActions.filter(action => 
    hasPermission(action.permission, action.action)
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    backButton: {
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    welcomeText: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 8,
    },
    subtitleText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: 32,
    },
    actionsGrid: {
      gap: 16,
    },
    actionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    actionIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    actionContent: {
      flex: 1,
    },
    actionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    actionSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
  });

  if (availableActions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
        
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quick Actions</Text>
        </View>

        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Plus size={64} color={theme.colors.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>No Actions Available</Text>
          <Text style={styles.emptySubtitle}>
            You don't have permission to perform any quick actions. Contact your administrator for access.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quick Actions</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.welcomeText}>
          Welcome, {user?.name || 'User'}!
        </Text>
        <Text style={styles.subtitleText}>
          What would you like to do today?
        </Text>

        <View style={styles.actionsGrid}>
          {availableActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View style={[
                styles.actionIconContainer,
                { backgroundColor: `${action.color}20` }
              ]}>
                <action.icon size={24} color={action.color} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Sales Form Modal */}
      <SalesForm
        visible={showSalesForm}
        onClose={() => setShowSalesForm(false)}
        onSuccess={() => {
          setShowSalesForm(false);
          router.push('/sales');
        }}
      />

      {/* Customer Form Modal */}
      <CustomerAddForm
        visible={showCustomerForm}
        onClose={() => setShowCustomerForm(false)}
        onSuccess={() => {
          setShowCustomerForm(false);
          router.push('/customers');
        }}
      />
    </SafeAreaView>
  );
}

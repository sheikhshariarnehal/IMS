import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { TrendingUp, DollarSign, Package, AlertTriangle, Database, CheckCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import SharedLayout from '@/components/SharedLayout';
import { FormService } from '@/lib/services/formService';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

// KPI data will be loaded from database

const Dashboard = React.memo(function Dashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false); // Always false for instant loading
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout, router]);

  // Load dashboard stats from database
  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        setIsLoading(true);
        setSupabaseStatus('checking');

        // Fetch dashboard statistics
        const stats = await FormService.getDashboardStats();

        setSupabaseStatus('connected');
        setDashboardStats(stats);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        setSupabaseStatus('disconnected');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadDashboardStats();
    }
  }, [user]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.background,
    },
    kpiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    kpiCard: {
      width: isMobile ? '48%' : '23%',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    kpiTitle: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs,
    },
    kpiValue: {
      fontSize: isMobile ? 18 : 22,
      fontWeight: 'bold',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    kpiChange: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.status.success,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }), [theme, isMobile]);

  const KPICard = React.memo(({ title, value, change, icon: Icon, color }: any) => (
    <View style={[styles.kpiCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={styles.kpiTitle}>{title}</Text>
        <Icon size={16} color={color} />
      </View>
      <Text style={styles.kpiValue}>{value.toLocaleString()}</Text>
      <Text style={[styles.kpiChange, { color: change > 0 ? theme.colors.status.success : theme.colors.status.error }]}>
        {change > 0 ? '+' : ''}{change.toLocaleString()}
      </Text>
    </View>
  ));

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10, color: theme.colors.text.secondary }}>Loading...</Text>
      </View>
    );
  }

  return (
    <SharedLayout title="Dashboard" onLogout={handleLogout}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Supabase Connection Status */}
        <View style={[styles.kpiCard, {
          backgroundColor: supabaseStatus === 'connected' ? theme.colors.status.success + '20' : theme.colors.status.error + '20',
          borderLeftColor: supabaseStatus === 'connected' ? theme.colors.status.success : theme.colors.status.error,
          borderLeftWidth: 3,
          marginBottom: 16
        }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.kpiTitle}>Supabase Database</Text>
            {supabaseStatus === 'checking' ? (
              <ActivityIndicator size={16} color={theme.colors.primary} />
            ) : (
              <CheckCircle
                size={16}
                color={supabaseStatus === 'connected' ? theme.colors.status.success : theme.colors.status.error}
              />
            )}
          </View>
          <Text style={[styles.kpiValue, { fontSize: 16 }]}>
            {supabaseStatus === 'connected' ? 'Connected' :
             supabaseStatus === 'checking' ? 'Checking...' : 'Disconnected'}
          </Text>
          <Text style={[styles.kpiChange, {
            color: supabaseStatus === 'connected' ? theme.colors.status.success : theme.colors.status.error
          }]}>
            Project: dbwoaiihjffzfqsozgjn
          </Text>
        </View>

        {/* User Information */}
        {user && (
          <View style={[styles.kpiCard, {
            backgroundColor: theme.colors.primary + '10',
            borderLeftColor: theme.colors.primary,
            borderLeftWidth: 3,
            marginBottom: 16
          }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.kpiTitle}>Current User</Text>
              <Database size={16} color={theme.colors.primary} />
            </View>
            <Text style={[styles.kpiValue, { fontSize: 16 }]}>{user.name}</Text>
            <Text style={[styles.kpiChange, { color: theme.colors.primary }]}>
              Role: {user.role.toUpperCase()} | ID: {user.id}
            </Text>
          </View>
        )}

        {/* Alerts */}
        {dashboardStats?.alerts?.map((alert: any, index: number) => (
          <View key={index} style={[styles.kpiCard, {
            backgroundColor: alert.type === 'error' ? theme.colors.status.error + '10' : theme.colors.status.warning + '10',
            borderLeftColor: alert.type === 'error' ? theme.colors.status.error : theme.colors.status.warning,
            borderLeftWidth: 3,
            marginBottom: 16
          }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.kpiTitle}>{alert.title}</Text>
              <AlertTriangle size={16} color={alert.type === 'error' ? theme.colors.status.error : theme.colors.status.warning} />
            </View>
            <Text style={[styles.kpiValue, { fontSize: 14 }]}>{alert.message}</Text>
            <Text style={[styles.kpiChange, { color: alert.type === 'error' ? theme.colors.status.error : theme.colors.status.warning }]}>
              {alert.action}
            </Text>
          </View>
        ))}

        <View style={styles.kpiGrid}>
          <KPICard
            title="TOTAL SALES"
            value={dashboardStats?.totalSales?.formatted || '৳0'}
            change={dashboardStats?.totalSales?.change || 0}
            icon={DollarSign}
            color={theme.colors.primary}
          />
          <KPICard
            title="PAID SALES"
            value={dashboardStats?.paidSales?.formatted || '৳0'}
            change={dashboardStats?.paidSales?.change || 0}
            icon={CheckCircle}
            color={theme.colors.status.success}
          />
          <KPICard
            title="TOTAL PRODUCTS"
            value={dashboardStats?.totalProducts?.formatted || '0'}
            change={dashboardStats?.totalProducts?.change || 0}
            icon={Package}
            color={theme.colors.status.info}
          />
          <KPICard
            title="LOW STOCK"
            value={dashboardStats?.lowStockCount?.formatted || '0'}
            change={dashboardStats?.lowStockCount?.change || 0}
            icon={AlertTriangle}
            color={theme.colors.status.warning}
          />
        </View>
      </ScrollView>
    </SharedLayout>
  );
});

export default Dashboard;
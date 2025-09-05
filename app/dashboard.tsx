import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { TrendingUp, DollarSign, Package, AlertTriangle, Database, CheckCircle, BarChart3, PieChart } from 'lucide-react-native';
import { LineChart, BarChart, PieChart as RNPieChart } from 'react-native-chart-kit';
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
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout, router]);

  // Load dashboard stats and chart data
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch dashboard statistics
      const [stats, salesStats] = await Promise.all([
        FormService.getDashboardStats(),
        FormService.getSalesStats()
      ]);

      setDashboardStats(stats);

      // Generate chart data
      const chartData = generateChartData(stats, salesStats);
      setChartData(chartData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadDashboardData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, loadDashboardData]);

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [loadDashboardData]);

  // Generate chart data from dashboard stats
  const generateChartData = useCallback((stats: any, salesStats: any) => {
    const now = new Date();
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;

    // Generate sales trend data for the last N days
    const salesTrendData = {
      labels: [],
      datasets: [{
        data: [],
        color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
        strokeWidth: 2
      }]
    };

    // Generate last 7 data points for the selected period
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      if (days === 7) {
        salesTrendData.labels.push(date.toLocaleDateString('en', { weekday: 'short' }));
      } else if (days === 30) {
        salesTrendData.labels.push(date.getDate().toString());
      } else {
        salesTrendData.labels.push(date.toLocaleDateString('en', { month: 'short', day: 'numeric' }));
      }

      // Mock data - in real app, this would come from actual sales data
      const randomSales = Math.floor(Math.random() * 50000) + 10000;
      salesTrendData.datasets[0].data.push(randomSales);
    }

    // Revenue distribution pie chart data
    const revenueDistribution = [
      {
        name: 'Paid Sales',
        population: stats?.paidSales?.value || 0,
        color: '#10B981',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
      {
        name: 'Pending Sales',
        population: (stats?.totalSales?.value || 0) - (stats?.paidSales?.value || 0),
        color: '#F59E0B',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      }
    ];

    // Product stock overview bar chart data
    const stockOverview = {
      labels: ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'],
      datasets: [{
        data: [85, 92, 78, 65, 88], // Mock stock percentages
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2
      }]
    };

    return {
      salesTrend: salesTrendData,
      revenueDistribution,
      stockOverview,
    };
  }, [selectedPeriod]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: isMobile ? theme.spacing.sm : theme.spacing.md,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.background,
    },
    kpiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: theme.spacing.lg,
      gap: isMobile ? theme.spacing.sm : theme.spacing.md,
      justifyContent: 'space-between',
    },
    kpiCard: {
      width: isMobile ? '48.5%' : '23%',
      borderRadius: theme.borderRadius.md,
      padding: isMobile ? theme.spacing.md : theme.spacing.lg,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 4,
      marginBottom: isMobile ? theme.spacing.xs : 0,
    },
    kpiTitle: {
      fontSize: isMobile ? 10 : 12,
      fontWeight: '600',
      color: theme.colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      flex: 1,
      lineHeight: isMobile ? 12 : 14,
    },
    kpiValue: {
      fontSize: isMobile ? 16 : 24,
      fontWeight: 'bold',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
      lineHeight: isMobile ? 20 : 28,
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
    kpiHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: isMobile ? theme.spacing.xs : theme.spacing.sm,
    },
    kpiIconContainer: {
      width: isMobile ? 28 : 32,
      height: isMobile ? 28 : 32,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: isMobile ? theme.spacing.xs : theme.spacing.sm,
    },
    kpiChangeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    periodSelector: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: isMobile ? 16 : 18,
      fontWeight: 'bold',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
    periodButtons: {
      flexDirection: 'row',
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      padding: 3,
    },
    periodButton: {
      flex: 1,
      paddingVertical: isMobile ? theme.spacing.xs : theme.spacing.sm,
      paddingHorizontal: isMobile ? theme.spacing.sm : theme.spacing.md,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
    },
    periodButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    periodButtonText: {
      fontSize: isMobile ? 12 : 14,
      fontWeight: '500',
      color: theme.colors.text.secondary,
    },
    periodButtonTextActive: {
      color: '#FFFFFF',
    },
    chartContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      padding: isMobile ? theme.spacing.sm : theme.spacing.md,
      marginBottom: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    chartTitle: {
      fontSize: isMobile ? 14 : 16,
      fontWeight: 'bold',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    chart: {
      borderRadius: theme.borderRadius.md,
    },
    pieChartContainer: {
      alignItems: 'center',
    },
  }), [theme, isMobile]);

  const KPICard = React.memo(({ title, value, change, icon: Icon, color }: any) => (
    <TouchableOpacity style={[styles.kpiCard, { borderLeftColor: color, borderLeftWidth: 3 }]} activeOpacity={0.7}>
      <View style={styles.kpiHeader}>
        <View style={[styles.kpiIconContainer, { backgroundColor: color + '15' }]}>
          <Icon size={isMobile ? 16 : 20} color={color} />
        </View>
        <Text style={styles.kpiTitle}>{title}</Text>
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      {change !== undefined && (
        <View style={styles.kpiChangeContainer}>
          <TrendingUp
            size={isMobile ? 10 : 12}
            color={change >= 0 ? theme.colors.status.success : theme.colors.status.error}
          />
          <Text style={[styles.kpiChange, {
            color: change >= 0 ? theme.colors.status.success : theme.colors.status.error,
            fontSize: isMobile ? 10 : 12,
          }]}>
            {change >= 0 ? '+' : ''}{Math.abs(change)}%
          </Text>
        </View>
      )}
    </TouchableOpacity>
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
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Main KPI Cards */}
        <View style={styles.kpiGrid}>
          <KPICard
            title="TOTAL SALES"
            value={dashboardStats?.totalSales?.formatted || '৳0'}
            change={5.2}
            icon={DollarSign}
            color={theme.colors.primary}
          />
          <KPICard
            title="PAID SALES"
            value={dashboardStats?.paidSales?.formatted || '৳0'}
            change={3.8}
            icon={CheckCircle}
            color={theme.colors.status.success}
          />
          <KPICard
            title="TOTAL PRODUCTS"
            value={dashboardStats?.totalProducts?.formatted || '0'}
            change={2.1}
            icon={Package}
            color={theme.colors.status.info}
          />
          <KPICard
            title="LOW STOCK"
            value={dashboardStats?.lowStockCount?.formatted || '0'}
            change={-1.5}
            icon={AlertTriangle}
            color={theme.colors.status.warning}
          />
        </View>

        {/* Period Selection */}
        <View style={styles.periodSelector}>
          <Text style={styles.sectionTitle}>Sales Analytics</Text>
          <View style={styles.periodButtons}>
            {(['7d', '30d', '90d'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive
                ]}
                onPress={() => setSelectedPeriod(period)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive
                ]}>
                  {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '90 Days'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sales Trend Chart */}
        {chartData?.salesTrend && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Sales Trend</Text>
            <LineChart
              data={chartData.salesTrend}
              width={width - (isMobile ? 24 : 32)}
              height={isMobile ? 180 : 220}
              chartConfig={{
                backgroundColor: theme.colors.card,
                backgroundGradientFrom: theme.colors.card,
                backgroundGradientTo: theme.colors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
                labelColor: (opacity = 1) => theme.colors.text.secondary,
                style: {
                  borderRadius: 12,
                },
                propsForDots: {
                  r: isMobile ? "3" : "4",
                  strokeWidth: "2",
                  stroke: theme.colors.primary
                }
              }}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {/* Revenue Distribution Chart */}
        {chartData?.revenueDistribution && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Revenue Distribution</Text>
            <View style={styles.pieChartContainer}>
              <RNPieChart
                data={chartData.revenueDistribution}
                width={width - (isMobile ? 24 : 32)}
                height={isMobile ? 160 : 200}
                chartConfig={{
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft={isMobile ? "10" : "15"}
                absolute
              />
            </View>
          </View>
        )}

        {/* Stock Overview Chart */}
        {chartData?.stockOverview && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Stock Overview by Category</Text>
            <BarChart
              data={chartData.stockOverview}
              width={width - (isMobile ? 24 : 32)}
              height={isMobile ? 180 : 220}
              yAxisLabel=""
              yAxisSuffix="%"
              chartConfig={{
                backgroundColor: theme.colors.card,
                backgroundGradientFrom: theme.colors.card,
                backgroundGradientTo: theme.colors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                labelColor: (opacity = 1) => theme.colors.text.secondary,
                style: {
                  borderRadius: 12,
                },
                barPercentage: 0.7,
              }}
              style={styles.chart}
              showValuesOnTopOfBars
            />
          </View>
        )}
      </ScrollView>
    </SharedLayout>
  );
});

export default Dashboard;
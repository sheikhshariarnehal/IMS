import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Clock,
  Search,
  Filter,
  Calendar,
  User,
  Package,
  DollarSign,
  Activity,
  Eye,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import SharedLayout from '@/components/SharedLayout';
import { FormService } from '@/lib/services/formService';

interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  module: string;
  description: string;
  entity_type?: string;
  entity_id?: number;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

interface SalesHistory {
  id: number;
  sale_number: string;
  customer_id?: number;
  customer_name?: string;
  total_amount: number;
  payment_status: string;
  sale_status: string;
  created_at: string;
  payment_method?: string;
}

interface HistoryFilters {
  search?: string;
  module?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  entityType?: string;
}

export default function HistoryScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'activity' | 'sales'>('activity');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [salesHistory, setSalesHistory] = useState<SalesHistory[]>([]);
  const [filters, setFilters] = useState<HistoryFilters>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Load activity logs and sales history
  const loadData = async () => {
    try {
      setLoading(true);

      // Load activity logs
      const logs = await FormService.getActivityLogs(filters);
      setActivityLogs(logs);

      // Load sales history
      const sales = await FormService.getSalesSummary(filters);
      const transformedSales: SalesHistory[] = sales.map((sale: any) => ({
        id: sale.id,
        sale_number: sale.sale_number,
        customer_id: sale.customer_id,
        customer_name: sale.customer_name,
        total_amount: parseFloat(sale.total_amount || '0'),
        payment_status: sale.payment_status,
        sale_status: sale.sale_status,
        created_at: sale.created_at,
        payment_method: sale.payment_method,
      }));
      setSalesHistory(transformedSales);

    } catch (error) {
      console.error('Failed to load history data:', error);
      Alert.alert('Error', 'Failed to load history data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter data based on search and filters
  const filteredActivityLogs = useMemo(() => {
    return activityLogs.filter(log => {
      if (filters.search &&
          !log.description.toLowerCase().includes(filters.search.toLowerCase()) &&
          !log.module.toLowerCase().includes(filters.search.toLowerCase()) &&
          !log.action.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.module && log.module !== filters.module) {
        return false;
      }
      if (filters.action && log.action !== filters.action) {
        return false;
      }
      return true;
    });
  }, [activityLogs, filters]);

  const filteredSalesHistory = useMemo(() => {
    return salesHistory.filter(sale => {
      if (filters.search &&
          !sale.sale_number.toLowerCase().includes(filters.search.toLowerCase()) &&
          !(sale.customer_name?.toLowerCase().includes(filters.search.toLowerCase()))) {
        return false;
      }
      return true;
    });
  }, [salesHistory, filters]);

  // Get icon for activity action
  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return <CheckCircle size={16} color={theme.colors.status.success} />;
      case 'update': return <Info size={16} color={theme.colors.status.info} />;
      case 'delete': return <XCircle size={16} color={theme.colors.status.error} />;
      case 'login': return <User size={16} color={theme.colors.primary} />;
      case 'logout': return <User size={16} color={theme.colors.text.secondary} />;
      default: return <Activity size={16} color={theme.colors.text.secondary} />;
    }
  };

  // Get color for module
  const getModuleColor = (module: string) => {
    switch (module.toLowerCase()) {
      case 'product': return theme.colors.status.info;
      case 'customer': return theme.colors.primary;
      case 'sale': return theme.colors.status.success;
      case 'payment': return theme.colors.status.warning;
      case 'inventory': return theme.colors.status.info;
      case 'sample': return theme.colors.secondary;
      case 'auth': return theme.colors.text.secondary;
      default: return theme.colors.text.muted;
    }
  };

  // Render activity log item
  const renderActivityItem = ({ item }: { item: ActivityLog }) => (
    <View style={[styles.historyCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.historyHeader}>
        <View style={styles.historyIconContainer}>
          {getActionIcon(item.action)}
        </View>
        <View style={styles.historyContent}>
          <View style={styles.historyTitleRow}>
            <Text style={[styles.historyTitle, { color: theme.colors.text.primary }]}>
              {item.description}
            </Text>
            <Text style={[styles.historyTime, { color: theme.colors.text.muted }]}>
              {new Date(item.created_at).toLocaleTimeString()}
            </Text>
          </View>
          <View style={styles.historyMetaRow}>
            <View style={[styles.moduleTag, { backgroundColor: getModuleColor(item.module) + '20' }]}>
              <Text style={[styles.moduleText, { color: getModuleColor(item.module) }]}>
                {item.module}
              </Text>
            </View>
            <Text style={[styles.actionText, { color: theme.colors.text.secondary }]}>
              {item.action}
            </Text>
          </View>
          {item.entity_type && (
            <Text style={[styles.entityText, { color: theme.colors.text.muted }]}>
              {item.entity_type} ID: {item.entity_id}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  // Render sales history item
  const renderSalesItem = ({ item }: { item: SalesHistory }) => (
    <View style={[styles.historyCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.historyHeader}>
        <View style={styles.historyIconContainer}>
          <DollarSign size={16} color={theme.colors.status.success} />
        </View>
        <View style={styles.historyContent}>
          <View style={styles.historyTitleRow}>
            <Text style={[styles.historyTitle, { color: theme.colors.text.primary }]}>
              {item.sale_number}
            </Text>
            <Text style={[styles.historyAmount, { color: theme.colors.status.success }]}>
              ৳{item.total_amount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.historyMetaRow}>
            <Text style={[styles.customerText, { color: theme.colors.text.secondary }]}>
              {item.customer_name || 'Walk-in Customer'}
            </Text>
            <View style={[
              styles.statusTag,
              { backgroundColor: item.payment_status === 'paid' ? theme.colors.status.success + '20' : theme.colors.status.warning + '20' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: item.payment_status === 'paid' ? theme.colors.status.success : theme.colors.status.warning }
              ]}>
                {item.payment_status}
              </Text>
            </View>
          </View>
          <Text style={[styles.historyTime, { color: theme.colors.text.muted }]}>
            {new Date(item.created_at).toLocaleDateString()} • {item.payment_method || 'N/A'}
          </Text>
        </View>
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.card,
      marginHorizontal: theme.spacing.md,
      marginTop: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.xs,
    },
    tab: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeTab: {
      backgroundColor: theme.colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text.secondary,
    },
    activeTabText: {
      color: theme.colors.text.inverse,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      margin: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.input,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchInput: {
      flex: 1,
      marginLeft: theme.spacing.sm,
      fontSize: 16,
      color: theme.colors.text.primary,
    },
    filterButton: {
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.backgroundSecondary,
    },
    historyCard: {
      marginHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      borderWidth: 1,
    },
    historyHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    historyIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.backgroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.sm,
    },
    historyContent: {
      flex: 1,
    },
    historyTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.xs,
    },
    historyTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
      marginRight: theme.spacing.sm,
    },
    historyTime: {
      fontSize: 12,
    },
    historyAmount: {
      fontSize: 14,
      fontWeight: '600',
    },
    historyMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xs,
    },
    moduleTag: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
    },
    moduleText: {
      fontSize: 12,
      fontWeight: '500',
    },
    actionText: {
      fontSize: 12,
      fontWeight: '500',
    },
    entityText: {
      fontSize: 12,
    },
    customerText: {
      fontSize: 12,
      flex: 1,
    },
    statusTag: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xl,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.md,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.text.muted,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.md,
    },
  });

  if (loading) {
    return (
      <SharedLayout title="History">
        <View style={styles.loadingContainer}>
          <Activity size={48} color={theme.colors.text.muted} />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </SharedLayout>
    );
  }

  return (
    <SharedLayout title="History">
      <View style={styles.container}>
        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
            onPress={() => setActiveTab('activity')}
          >
            <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>
              Activity Logs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sales' && styles.activeTab]}
            onPress={() => setActiveTab('sales')}
          >
            <Text style={[styles.tabText, activeTab === 'sales' && styles.activeTabText]}>
              Sales History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search and Filters */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color={theme.colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${activeTab === 'activity' ? 'activities' : 'sales'}...`}
              placeholderTextColor={theme.colors.text.muted}
              value={filters.search || ''}
              onChangeText={(text) => setFilters(prev => ({ ...prev, search: text }))}
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <FlatList
          data={activeTab === 'activity' ? filteredActivityLogs : filteredSalesHistory}
          renderItem={activeTab === 'activity' ? renderActivityItem : renderSalesItem}
          keyExtractor={(item) => `${activeTab}-${item.id}`}
          contentContainerStyle={{ paddingBottom: theme.spacing.lg }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Clock size={48} color={theme.colors.text.muted} />
              <Text style={styles.emptyText}>
                No {activeTab === 'activity' ? 'activity logs' : 'sales history'} found
              </Text>
              <Text style={styles.emptySubtext}>
                {activeTab === 'activity'
                  ? 'User activities will appear here as they occur'
                  : 'Sales transactions will appear here once created'
                }
              </Text>
            </View>
          }
        />
      </View>
    </SharedLayout>
  );
}
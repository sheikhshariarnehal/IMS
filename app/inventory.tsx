import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Plus,
  Search,
  Filter,
  Download,
  ArrowRightLeft,
  Warehouse,
  Store,
  AlertTriangle,
  TrendingUp,
  Package,
  MapPin,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import SharedLayout from '@/components/SharedLayout';
import { FormService } from '@/lib/services/formService';
// Mock interfaces for UI demo
interface StockItem {
  id: string;
  productName: string;
  productCode: string;
  locationName: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minimumThreshold: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

interface Location {
  id: string;
  name: string;
  type: 'warehouse' | 'showroom';
  address: string;
  capacity: number;
  currentStock: number;
  manager: string;
  phone: string;
  isActive: boolean;
}

interface Transfer {
  id: string;
  transferNumber: string;
  productName: string;
  fromLocationName: string;
  toLocationName: string;
  quantity: number;
  status: 'Pending' | 'Approved' | 'In Transit' | 'Completed';
  requestDate: Date;
}

interface InventoryFilters {
  search: string;
  location: string;
  status: string;
}

// Interfaces are now imported from inventory-service

// Mock data for UI demo

export default function InventoryPage() {
  const { theme } = useTheme();
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'stock' | 'locations' | 'transfers'>('stock');
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [filters, setFilters] = useState<InventoryFilters>({
    search: '',
    location: '',
    status: ''
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false); // Instant loading - no delays
  const [stats, setStats] = useState({
    totalStockItems: 0,
    lowStockItems: 0,
    pendingTransfers: 0,
    averageUtilization: 0
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Reload data when active tab changes (optimized)
  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  // Reload data when filters change (optimized)
  useEffect(() => {
    loadTabData();
  }, [filters.search, filters.location, filters.status]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load inventory summary and statistics
      const inventoryData = await FormService.getInventorySummary();
      const lowStockData = await FormService.getLowStockProducts();

      // Calculate stats
      const statsData = {
        totalStockItems: inventoryData.length,
        lowStockItems: lowStockData.length,
        pendingTransfers: 0, // Would need transfer table
        averageUtilization: inventoryData.length > 0 ?
          inventoryData.reduce((sum: number, item: any) => sum + (item.utilization || 0), 0) / inventoryData.length : 0
      };

      // Load locations
      const locationsData = await FormService.getLocations();
      const transformedLocations: Location[] = locationsData.map((location: any) => ({
        id: location.id.toString(),
        name: location.name,
        address: location.address || '',
        capacity: location.capacity || 0,
        currentUtilization: location.current_utilization || 0,
        manager: location.manager || 'N/A',
        status: location.status || 'active',
        type: location.type || 'warehouse',
      }));

      setStats(statsData);
      setLocations(transformedLocations);

      // Load initial tab data
      await loadTabData();
    } catch (error) {
      console.error('Error loading inventory data:', error);
      Alert.alert('Error', 'Failed to load inventory data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async () => {
    try {
      switch (activeTab) {
        case 'stock':
          // Load stock items from inventory summary
          const inventoryData = await FormService.getInventorySummary();
          const stockData: StockItem[] = inventoryData.map((item: any) => ({
            id: item.product_id?.toString() || '',
            productName: item.product_name || '',
            productCode: item.product_code || '',
            category: item.category_name || 'Uncategorized',
            currentStock: item.total_quantity || 0,
            reservedStock: item.reserved_quantity || 0,
            availableStock: (item.total_quantity || 0) - (item.reserved_quantity || 0),
            minimumThreshold: item.minimum_threshold || 0,
            location: item.location_name || 'Main Warehouse',
            lastUpdated: new Date(item.last_updated || Date.now()),
            status: item.total_quantity <= item.minimum_threshold ? 'Low Stock' :
                   item.total_quantity === 0 ? 'Out of Stock' : 'In Stock',
            unitPrice: item.average_price || 0,
            totalValue: (item.total_quantity || 0) * (item.average_price || 0),
          }));
          setStockItems(stockData);
          break;
        case 'transfers':
          // Mock transfer data for demo (would need transfer table)
          const transferData: Transfer[] = [];
          setTransfers(transferData);
          break;
        case 'locations':
          // Locations are already loaded
          break;
      }
    } catch (error) {
      console.error('Error loading tab data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return theme.colors.status.success;
      case 'Low Stock': return theme.colors.status.warning;
      case 'Out of Stock': return theme.colors.status.error;
      case 'Transfer in Progress': return theme.colors.status.info;
      case 'Reserved': return theme.colors.primary;
      case 'Pending': return theme.colors.status.warning;
      case 'Approved': return theme.colors.status.success;
      case 'In Transit': return theme.colors.status.info;
      case 'Completed': return theme.colors.status.success;
      case 'Cancelled': return theme.colors.status.error;
      default: return theme.colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'In Stock': return CheckCircle;
      case 'Low Stock': return AlertTriangle;
      case 'Out of Stock': return XCircle;
      case 'Transfer in Progress': return ArrowRightLeft;
      case 'Reserved': return Package;
      case 'Pending': return Clock;
      case 'Approved': return CheckCircle;
      case 'In Transit': return ArrowRightLeft;
      case 'Completed': return CheckCircle;
      case 'Cancelled': return XCircle;
      default: return Package;
    }
  };

  const handleAction = async (action: string, item: any) => {
    switch (action) {
      case 'view':
        Alert.alert('View Details', `Viewing details for ${item.product_name || item.name || item.transfer_number}`);
        break;
      case 'edit':
        if (!hasPermission('inventory', 'edit')) {
          Alert.alert('Permission Denied', 'You do not have permission to edit inventory.');
          return;
        }
        Alert.alert('Edit Item', `Editing ${item.product_name || item.name || item.transfer_number}`);
        break;
      case 'transfer':
        if (!hasPermission('inventory', 'transfer')) {
          Alert.alert('Permission Denied', 'You do not have permission to transfer stock.');
          return;
        }
        Alert.alert('Transfer Stock', `Initiating transfer for ${item.product_name}`);
        break;
      case 'approve':
        if (!hasPermission('inventory', 'edit')) {
          Alert.alert('Permission Denied', 'You do not have permission to approve transfers.');
          return;
        }
        Alert.alert(
          'Approve Transfer',
          `Approve transfer of ${item.requested_quantity} units of ${item.product_name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Approve',
              onPress: async () => {
                try {
                  // Mock transfer approval for demo
                  console.log('Mock approve transfer:', item.id);
                  Alert.alert('Success', 'Transfer approved successfully');
                  loadTabData(); // Refresh the data
                } catch (error) {
                  Alert.alert('Error', 'Failed to approve transfer');
                }
              }
            }
          ]
        );
        break;
    }
  };

  const renderKPICards = () => (
    <View style={styles.kpiContainer}>
      <View style={styles.kpiRow}>
        <View key="total-stock" style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.kpiIcon, { backgroundColor: theme.colors.primary + '20' }]}>
            <Package size={24} color={theme.colors.primary} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>
            {loading ? '...' : (stats.totalStockItems || 0).toLocaleString()}
          </Text>
          <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Total Stock Items</Text>
        </View>

        <View key="low-stock" style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.warning + '20' }]}>
            <AlertTriangle size={24} color={theme.colors.status.warning} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>
            {loading ? '...' : (stats.lowStockItems || 0).toLocaleString()}
          </Text>
          <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Low Stock Items</Text>
        </View>
      </View>

      <View style={styles.kpiRow}>
        <View key="pending-transfers" style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.info + '20' }]}>
            <ArrowRightLeft size={24} color={theme.colors.status.info} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>
            {loading ? '...' : (stats.pendingTransfers || 0).toLocaleString()}
          </Text>
          <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Pending Transfers</Text>
        </View>

        <View key="utilization" style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.success + '20' }]}>
            <TrendingUp size={24} color={theme.colors.status.success} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>
            {loading ? '...' : `${stats.averageUtilization}%`}
          </Text>
          <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Avg. Utilization</Text>
        </View>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={[styles.tabContainer, { borderBottomColor: theme.colors.border }]}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'stock' && { borderBottomColor: theme.colors.primary }]}
        onPress={() => setActiveTab('stock')}
      >
        <Package size={18} color={activeTab === 'stock' ? theme.colors.primary : theme.colors.text.secondary} />
        <Text style={[
          styles.tabText,
          { color: activeTab === 'stock' ? theme.colors.primary : theme.colors.text.secondary }
        ]}>
          Stock Items
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'locations' && { borderBottomColor: theme.colors.primary }]}
        onPress={() => setActiveTab('locations')}
      >
        <MapPin size={18} color={activeTab === 'locations' ? theme.colors.primary : theme.colors.text.secondary} />
        <Text style={[
          styles.tabText,
          { color: activeTab === 'locations' ? theme.colors.primary : theme.colors.text.secondary }
        ]}>
          Locations
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'transfers' && { borderBottomColor: theme.colors.primary }]}
        onPress={() => setActiveTab('transfers')}
      >
        <ArrowRightLeft size={18} color={activeTab === 'transfers' ? theme.colors.primary : theme.colors.text.secondary} />
        <Text style={[
          styles.tabText,
          { color: activeTab === 'transfers' ? theme.colors.primary : theme.colors.text.secondary }
        ]}>
          Transfers
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStockItem = ({ item }: { item: StockItem }) => {
    const getStockStatus = () => {
      if (item.quantity <= 0) return 'Out of Stock';
      if (item.quantity <= item.minimumThreshold) return 'Low Stock';
      if (item.reservedQuantity > 0) return 'Reserved';
      return 'In Stock';
    };

    const stockStatus = getStockStatus();
    const StatusIcon = getStatusIcon(stockStatus);

    return (
      <View style={[styles.itemCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: theme.colors.text.primary }]}>
              {item.productName || 'Unknown Product'}
            </Text>
            <Text style={[styles.itemCode, { color: theme.colors.text.secondary }]}>
              {item.productCode}
            </Text>
            <View style={styles.statusContainer}>
              <StatusIcon size={12} color={getStatusColor(stockStatus)} />
              <Text style={[styles.statusText, { color: getStatusColor(stockStatus) }]}>
                {stockStatus}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Location:</Text>
            <View style={styles.locationContainer}>
              <Warehouse size={12} color={theme.colors.primary} />
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                {item.locationName}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Status:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
              {item.status}
            </Text>
          </View>

          <View style={styles.stockInfo}>
            <View key="current" style={styles.stockItem}>
              <Text style={[styles.stockLabel, { color: theme.colors.text.secondary }]}>Current</Text>
              <Text style={[styles.stockValue, { color: theme.colors.text.primary }]}>
                {item.quantity}
              </Text>
            </View>
            <View key="available" style={styles.stockItem}>
              <Text style={[styles.stockLabel, { color: theme.colors.text.secondary }]}>Available</Text>
              <Text style={[styles.stockValue, { color: theme.colors.status.success }]}>
                {item.availableQuantity}
              </Text>
            </View>
            <View key="reserved" style={styles.stockItem}>
              <Text style={[styles.stockLabel, { color: theme.colors.text.secondary }]}>Reserved</Text>
              <Text style={[styles.stockValue, { color: theme.colors.status.warning }]}>
                {item.reservedQuantity}
              </Text>
            </View>
            <View key="threshold" style={styles.stockItem}>
              <Text style={[styles.stockLabel, { color: theme.colors.text.secondary }]}>Min. Threshold</Text>
              <Text style={[styles.stockValue, { color: theme.colors.status.error }]}>
                {item.minimumThreshold}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.itemActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.status.info + '20' }]}
            onPress={() => handleAction('view', item)}
          >
            <Eye size={16} color={theme.colors.status.info} />
          </TouchableOpacity>

          {hasPermission('inventory', 'transfer') && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary + '20' }]}
              onPress={() => handleAction('transfer', item)}
            >
              <ArrowRightLeft size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          )}

          {hasPermission('inventory', 'edit') && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.status.warning + '20' }]}
              onPress={() => handleAction('edit', item)}
            >
              <Edit size={16} color={theme.colors.status.warning} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderLocationItem = ({ item }: { item: Location }) => {
    const utilization = Math.round((item.currentStock / item.capacity) * 100);

    return (
      <View style={[styles.itemCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: theme.colors.text.primary }]}>
              {item.name}
            </Text>
            <Text style={[styles.itemCode, { color: theme.colors.text.secondary }]}>
              {item.address}
            </Text>
            <View style={styles.statusContainer}>
              {item.type === 'warehouse' ?
                <Warehouse size={12} color={theme.colors.primary} /> :
                <Store size={12} color={theme.colors.status.info} />
              }
              <Text style={[styles.statusText, { color: item.type === 'warehouse' ? theme.colors.primary : theme.colors.status.info }]}>
                {item.type === 'warehouse' ? 'Warehouse' : 'Showroom'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Manager:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{item.manager || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Phone:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{item.phone || 'N/A'}</Text>
          </View>

          <View style={styles.utilizationContainer}>
            <View style={styles.utilizationHeader}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Utilization</Text>
              <Text style={[styles.utilizationPercent, { color: theme.colors.text.primary }]}>{utilization}%</Text>
            </View>
            <View style={[styles.utilizationBar, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <View style={[
                styles.utilizationFill,
                {
                  width: `${utilization}%`,
                  backgroundColor: utilization > 80 ? theme.colors.status.error :
                    utilization > 60 ? theme.colors.status.warning : theme.colors.status.success
                }
              ]} />
            </View>
            <View style={styles.capacityInfo}>
              <Text style={[styles.capacityText, { color: theme.colors.text.secondary }]}>
                {(item.currentStock || 0).toLocaleString()} / {(item.capacity || 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.itemActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.status.info + '20' }]}
            onPress={() => handleAction('view', item)}
          >
            <Eye size={16} color={theme.colors.status.info} />
          </TouchableOpacity>

          {hasPermission('inventory', 'edit') && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.status.warning + '20' }]}
              onPress={() => handleAction('edit', item)}
            >
              <Edit size={16} color={theme.colors.status.warning} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderTransferItem = ({ item }: { item: Transfer }) => {
    const StatusIcon = getStatusIcon(item.status);
    const priorityColor = theme.colors.status.info;

    return (
      <View style={[styles.itemCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: theme.colors.text.primary }]}>
              {item.productName || 'Unknown Product'}
            </Text>
            <Text style={[styles.itemCode, { color: theme.colors.text.secondary }]}>
              {item.transferNumber}
            </Text>
            <View style={styles.statusContainer}>
              <StatusIcon size={12} color={getStatusColor(item.status)} />
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.transferRoute}>
          <View style={styles.transferLocation}>
            <Text style={[styles.transferLabel, { color: theme.colors.text.secondary }]}>From</Text>
            <Text style={[styles.transferValue, { color: theme.colors.text.primary }]}>
              {item.fromLocationName}
            </Text>
          </View>
          <ArrowRightLeft size={16} color={theme.colors.text.secondary} />
          <View style={styles.transferLocation}>
            <Text style={[styles.transferLabel, { color: theme.colors.text.secondary }]}>To</Text>
            <Text style={[styles.transferValue, { color: theme.colors.text.primary }]}>
              {item.toLocationName}
            </Text>
          </View>
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Quantity:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
              {item.quantity} units
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Request Date:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
              {new Date(item.requestDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.itemActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.status.info + '20' }]}
            onPress={() => handleAction('view', item)}
          >
            <Eye size={16} color={theme.colors.status.info} />
          </TouchableOpacity>

          {item.status === 'Pending' && hasPermission('inventory', 'edit') && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.status.success + '20' }]}
              onPress={() => handleAction('approve', item)}
            >
              <CheckCircle size={16} color={theme.colors.status.success} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  type InventoryItem = StockItem | Location | Transfer;

  const getCurrentData = (): InventoryItem[] => {
    switch (activeTab) {
      case 'stock':
        return stockItems;
      case 'locations':
        return locations;
      case 'transfers':
        return transfers;
      default:
        return [];
    }
  };

  const renderInventoryItem = ({ item }: { item: InventoryItem }) => {
    switch (activeTab) {
      case 'stock':
        return renderStockItem({ item: item as StockItem });
      case 'locations':
        return renderLocationItem({ item: item as Location });
      case 'transfers':
        return renderTransferItem({ item: item as Transfer });
      default:
        return null;
    }
  };

  return (
    <SharedLayout title="Inventory">
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: theme.colors.backgroundSecondary }]}
        >
          <Download size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        {hasPermission('inventory', 'add') && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => Alert.alert('Add Item', 'Add inventory item functionality')}
          >
            <Plus size={20} color={theme.colors.text.inverse} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* KPI Cards */}
        {renderKPICards()}

        {/* Tabs */}
        {renderTabs()}

        {/* Search and Filters */}
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
          <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.input, borderColor: theme.colors.border }]}>
            <Search size={20} color={theme.colors.text.secondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text.primary }]}
              placeholder="Search ..."
              placeholderTextColor={theme.colors.text.muted}
              value={filters.search || ''}
              onChangeText={(text) => setFilters(prev => ({ ...prev, search: text }))}
            />
          </View>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: theme.colors.backgroundSecondary }]}
          >
            <Filter size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Data List */}
        <FlatList<InventoryItem>
          data={getCurrentData()}
          renderItem={renderInventoryItem}
          keyExtractor={(item, index) => item.id || `item-${index}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package size={48} color={theme.colors.text.muted} />
              <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                No {activeTab} found
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.text.muted }]}>
                Try adjusting your search or filters
              </Text>
            </View>
          }
        />
      </ScrollView>
    </SharedLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiContainer: {
    padding: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  kpiIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    marginHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  itemCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemCode: {
    fontSize: 12,
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stockItem: {
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  utilizationContainer: {
    marginTop: 8,
  },
  utilizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  utilizationPercent: {
    fontSize: 14,
    fontWeight: '600',
  },
  utilizationBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  utilizationFill: {
    height: '100%',
    borderRadius: 4,
  },
  capacityInfo: {
    alignItems: 'center',
    marginTop: 4,
  },
  capacityText: {
    fontSize: 10,
  },
  transferRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 8,
  },
  transferLocation: {
    flex: 1,
    alignItems: 'center',
  },
  transferLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  transferValue: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
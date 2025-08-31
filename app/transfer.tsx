import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Dimensions,
  Modal,
  RefreshControl,
} from 'react-native';
import {
  Search,
  Filter,
  Package,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Send,
  AlertTriangle,
  Calendar,
  BarChart,
  Repeat,
  ChevronDown,
  X,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import SharedLayout from '@/components/SharedLayout';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

// Types
interface Product {
  id: string;
  name: string;
  productCode: string;
  image?: string;
  stock: number;
  location: string;
  category: string;
  lot?: string;
}

interface TransferRequest {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  sourceLocation: string;
  destinationLocation: string;
  requestedBy: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
}

// Mock data
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Sofa Fabric',
    productCode: 'SF-1001',
    stock: 120,
    location: 'Main Warehouse',
    category: 'Sofa Fabrics',
    lot: 'LOT-A1',
  },
  {
    id: '2',
    name: 'Luxury Curtain Material',
    productCode: 'CM-2002',
    stock: 85,
    location: 'Main Warehouse',
    category: 'Curtain Fabrics',
    lot: 'LOT-B2',
  },
];

const mockTransferRequests: TransferRequest[] = [
  {
    id: 'TR-001',
    productId: '1',
    productName: 'Premium Sofa Fabric',
    quantity: 20,
    sourceLocation: 'Main Warehouse',
    destinationLocation: 'Showroom A',
    requestedBy: 'John Doe',
    requestedAt: new Date('2024-05-10T10:30:00'),
    status: 'pending',
  },
  {
    id: 'TR-002',
    productId: '2',
    productName: 'Luxury Curtain Material',
    quantity: 15,
    sourceLocation: 'Main Warehouse',
    destinationLocation: 'Showroom B',
    requestedBy: 'Jane Smith',
    requestedAt: new Date('2024-05-09T14:45:00'),
    status: 'approved',
  },
];

const locations = [
  'Main Warehouse',
  'Secondary Warehouse',
  'Showroom A',
  'Showroom B',
  'Showroom C',
];

const TransferPage = React.memo(function TransferPage() {
  const { theme } = useTheme();
  const { user } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    status: '',
  });

  const isAdminOrSuperAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // Optimized styles with useMemo
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    tabBar: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      gap: 8,
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text.secondary,
    },
    activeTabText: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    searchContainer: {
      flexDirection: 'row',
      padding: 12,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: 8,
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.input,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 12,
    },
    searchInput: {
      flex: 1,
      height: 40,
      fontSize: 14,
      color: theme.colors.text.primary,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.card,
      borderRadius: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    productCard: {
      flexDirection: 'row',
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    productInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    productName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    productCode: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      marginBottom: 8,
    },
    productMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    productMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    productMetaText: {
      fontSize: 12,
      color: theme.colors.text.secondary,
    },
    productActions: {
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
    actionButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    requestCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    requestHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    requestId: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text.secondary,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    requestDetails: {
      marginTop: 12,
      gap: 8,
    },
    requestDetailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    requestDetailText: {
      fontSize: 14,
      color: theme.colors.text.primary,
    },
    requestActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 16,
      gap: 8,
    },
    requestActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 4,
    },
    requestActionText: {
      fontSize: 14,
      fontWeight: '500',
    },
    listContainer: {
      padding: 12,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 64,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.secondary,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.text.muted,
      marginTop: 8,
    },
  }), [theme]);

  // Filter products based on search query and filters
  const filteredProducts = useMemo(() => {
    return mockProducts.filter(product => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.productCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = !filters.category || product.category === filters.category;
      const matchesLocation = !filters.location || product.location === filters.location;

      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [searchQuery, filters]);

  // Filter transfer requests
  const filteredRequests = useMemo(() => {
    return mockTransferRequests.filter(request => {
      const matchesSearch =
        request.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = !filters.status || request.status === filters.status;

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, filters]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'products' && styles.activeTab]}
        onPress={() => setActiveTab('products')}
      >
        <Package size={20} color={activeTab === 'products' ? theme.colors.primary : theme.colors.text.secondary} />
        <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>Products</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
        onPress={() => setActiveTab('requests')}
      >
        <Send size={20} color={activeTab === 'requests' ? theme.colors.primary : theme.colors.text.secondary} />
        <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>Requests</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'status' && styles.activeTab]}
        onPress={() => setActiveTab('status')}
      >
        <BarChart size={20} color={activeTab === 'status' ? theme.colors.primary : theme.colors.text.secondary} />
        <Text style={[styles.tabText, activeTab === 'status' && styles.activeTabText]}>Status</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Search size={20} color={theme.colors.text.secondary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeTab === 'products' ? 'products' : 'requests'}...`}
          placeholderTextColor={theme.colors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={18} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilterModal(true)}
      >
        <Filter size={20} color={theme.colors.primary} />
        <ChevronDown size={16} color={theme.colors.primary} style={{ marginLeft: 2 }} />
      </TouchableOpacity>
    </View>
  );

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productCode}>{item.productCode}</Text>

        <View style={styles.productMetaRow}>
          <View style={styles.productMetaItem}>
            <MapPin size={14} color={theme.colors.text.secondary} />
            <Text style={styles.productMetaText}>{item.location}</Text>
          </View>

          <View style={styles.productMetaItem}>
            <Package size={14} color={theme.colors.text.secondary} />
            <Text style={styles.productMetaText}>Stock: {item.stock}</Text>
          </View>
        </View>
      </View>

      <View style={styles.productActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: `${theme.colors.primary}20` }]}
          onPress={() => {/* Handle transfer */}}
        >
          <Repeat size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRequestItem = ({ item }: { item: TransferRequest }) => {
    let statusColor;
    let StatusIcon;

    switch (item.status) {
      case 'pending':
        statusColor = theme.colors.status.warning;
        StatusIcon = Clock;
        break;
      case 'approved':
        statusColor = theme.colors.status.info;
        StatusIcon = CheckCircle;
        break;
      case 'rejected':
        statusColor = theme.colors.status.error;
        StatusIcon = XCircle;
        break;
      case 'completed':
        statusColor = theme.colors.status.success;
        StatusIcon = CheckCircle;
        break;
      default:
        statusColor = theme.colors.text.secondary;
        StatusIcon = AlertTriangle;
    }

    return (
      <View style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <Text style={styles.requestId}>{item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <StatusIcon size={14} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <Text style={styles.productName} numberOfLines={1}>{item.productName}</Text>

        <View style={styles.requestDetails}>
          <View style={styles.requestDetailItem}>
            <Package size={14} color={theme.colors.text.secondary} />
            <Text style={styles.requestDetailText}>Qty: {item.quantity}</Text>
          </View>

          <View style={styles.requestDetailItem}>
            <MapPin size={14} color={theme.colors.text.secondary} />
            <Text style={styles.requestDetailText}>
              {item.sourceLocation} → {item.destinationLocation}
            </Text>
          </View>

          <View style={styles.requestDetailItem}>
            <User size={14} color={theme.colors.text.secondary} />
            <Text style={styles.requestDetailText}>{item.requestedBy}</Text>
          </View>

          <View style={styles.requestDetailItem}>
            <Calendar size={14} color={theme.colors.text.secondary} />
            <Text style={styles.requestDetailText}>
              {item.requestedAt.toLocaleDateString()}
            </Text>
          </View>
        </View>

        {isAdminOrSuperAdmin && item.status === 'pending' && (
          <View style={styles.requestActions}>
            <TouchableOpacity
              style={[styles.requestActionButton, { backgroundColor: `${theme.colors.status.success}20` }]}
            >
              <CheckCircle size={18} color={theme.colors.status.success} />
              <Text style={[styles.requestActionText, { color: theme.colors.status.success }]}>Approve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.requestActionButton, { backgroundColor: `${theme.colors.status.error}20` }]}
            >
              <XCircle size={18} color={theme.colors.status.error} />
              <Text style={[styles.requestActionText, { color: theme.colors.status.error }]}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return (
          <FlatList
            data={filteredProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Package size={48} color={theme.colors.text.muted} />
                <Text style={styles.emptyText}>No products found</Text>
                <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
              </View>
            }
          />
        );

      case 'requests':
        return (
          <FlatList
            data={filteredRequests}
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Send size={48} color={theme.colors.text.muted} />
                <Text style={styles.emptyText}>No transfer requests found</Text>
                <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
              </View>
            }
          />
        );

      case 'status':
        return (
          <ScrollView
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View style={styles.emptyContainer}>
              <BarChart size={48} color={theme.colors.text.muted} />
              <Text style={styles.emptyText}>Transfer Status Overview</Text>
              <Text style={styles.emptySubtext}>Status tracking and analytics coming soon</Text>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <SharedLayout title="Transfer">
      <View style={styles.container}>
        {renderTabBar()}
        {renderSearchBar()}
        {renderContent()}
      </View>
    </SharedLayout>
  );
});

export default TransferPage;
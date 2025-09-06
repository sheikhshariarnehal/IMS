import React, { useState, useMemo, useEffect } from 'react';
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
import TransferForm from '@/components/forms/TransferForm';
import LocationDebug from '@/components/debug/LocationDebug';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

// Types
interface Product {
  id: string | number;
  name: string;
  product_code: string;
  image?: string;
  current_stock: number | string;
  total_stock: number | string;
  location_id: number | string;
  location_name: string;
  category_id: number | string;
  category_name?: string;
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
  status: 'requested' | 'approved' | 'rejected' | 'completed' | 'in_transit';
  fromLocationId?: number;
  toLocationId?: number;
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
  const { user, getAccessibleLocations } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    status: '',
  });

  const isAdminOrSuperAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // Fetch products from database
  useEffect(() => {
    fetchProducts();
    fetchTransferRequests();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('🔄 Transfer page: Fetching products...');
      console.log('👤 Current user:', { id: user?.id, role: user?.role });

      // Set user context for RLS policies
      if (user?.id) {
        console.log('🔧 Setting user context for user ID:', user.id);
        await supabase.rpc('set_user_context', { user_id: user.id });
      } else {
        console.warn('⚠️ No user ID available for setting context');
      }

      // Get accessible locations for current user
      const accessibleLocations = getAccessibleLocations();
      console.log('📍 Accessible locations for user:', accessibleLocations);

      // Apply location filtering for non-super admin users
      if (user?.role !== 'super_admin' && accessibleLocations.length > 0) {
        console.log('🔒 Applying location filter for role:', user?.role);
        console.log('📍 Filtering by accessible locations:', accessibleLocations);
        const locationIds = accessibleLocations.map(id => parseInt(id));

        // Query products that have lots in accessible locations
        // This ensures we show products that have any lots in permitted locations
        const { data: productsWithAccessibleLots, error: lotError } = await supabase
          .from('products_lot')
          .select('product_id')
          .in('location_id', locationIds)
          .gt('quantity', 0); // Only lots with available quantity

        if (lotError) {
          console.error('❌ Error fetching accessible product lots:', lotError);
          return;
        }

        const accessibleProductIds = [...new Set(productsWithAccessibleLots?.map(lot => lot.product_id) || [])];
        console.log('📦 Products with lots in accessible locations:', accessibleProductIds);

        if (accessibleProductIds.length === 0) {
          console.log('📭 No products found with lots in accessible locations');
          setProducts([]);
          return;
        }

        // Query products that have lots in accessible locations
        const query = supabase
          .from('products')
          .select(`
            id,
            name,
            product_code,
            current_stock,
            total_stock,
            location_id,
            category_id,
            locations(name),
            categories(name)
          `)
          .in('id', accessibleProductIds)
          .gt('total_stock', 0);

        const { data, error } = await query.order('name');

        if (error) {
          console.error('❌ Error fetching products:', error);
          return;
        }

        console.log('✅ Fetched products with accessible lots:', data?.length || 0);
        const transformedProducts = data?.map(product => ({
          id: product.id.toString(),
          name: product.name,
          product_code: product.product_code,
          current_stock: product.current_stock,
          total_stock: product.total_stock,
          location_id: product.location_id,
          location_name: product.locations?.name || 'Unknown Location',
          category_id: product.category_id,
          category_name: product.categories?.name || 'Uncategorized',
        })) || [];

        setProducts(transformedProducts);
        return;
      }

      // For super admin users, show all products
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          product_code,
          current_stock,
          total_stock,
          location_id,
          category_id,
          locations(name),
          categories(name)
        `)
        .gt('total_stock', 0);

      const { data, error } = await query.order('name');

      if (error) {
        console.error('❌ Error fetching products:', error);
        return;
      }

      console.log('📦 Raw products data:', data?.length, 'products found');
      console.log('📦 First few products:', data?.slice(0, 3));

      const formattedProducts = data?.map(product => ({
        id: product.id.toString(),
        name: product.name,
        product_code: product.product_code,
        current_stock: product.current_stock,
        total_stock: product.total_stock,
        location_id: product.location_id,
        location_name: product.locations?.name || 'Unknown Location',
        category_id: product.category_id,
        category_name: product.categories?.name || 'Unknown Category',
      })) || [];

      console.log('✅ Formatted products:', formattedProducts.length, 'products');
      console.log('📍 Products by location:', formattedProducts.reduce((acc, p) => {
        acc[p.location_name] = (acc[p.location_name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>));

      setProducts(formattedProducts);
    } catch (error) {
      console.error('❌ Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransferRequests = async () => {
    try {
      // Set user context for RLS policies
      if (user?.id) {
        await supabase.rpc('set_user_context', { user_id: user.id });
      }

      // Get accessible locations for current user
      const accessibleLocations = getAccessibleLocations();
      console.log('📍 Fetching transfers for accessible locations:', accessibleLocations);

      let query = supabase
        .from('transfers')
        .select(`
          id,
          product_id,
          quantity,
          transfer_status,
          notes,
          requested_at,
          from_location_id,
          to_location_id,
          products(name),
          from_location:locations!transfers_from_location_id_fkey(name),
          to_location:locations!transfers_to_location_id_fkey(name),
          requested_by_user:users!transfers_requested_by_fkey(name)
        `);

      // Apply location filtering for non-super admin users
      if (user?.role !== 'super_admin' && accessibleLocations.length > 0) {
        console.log('🔒 Applying location filter for transfers');
        const locationIds = accessibleLocations.map(id => parseInt(id));
        // Show transfers where user has access to either source OR destination location
        query = query.or(`from_location_id.in.(${locationIds.join(',')}),to_location_id.in.(${locationIds.join(',')})`);
      }

      const { data, error } = await query.order('requested_at', { ascending: false });

      if (error) {
        console.error('Error fetching transfer requests:', error);
        return;
      }

      const formattedRequests = data?.map(transfer => ({
        id: transfer.id.toString(),
        productId: transfer.product_id.toString(),
        productName: transfer.products?.name || 'Unknown Product',
        quantity: transfer.quantity,
        sourceLocation: transfer.from_location?.name || 'Unknown',
        destinationLocation: transfer.to_location?.name || 'Unknown',
        requestedBy: transfer.requested_by_user?.name || 'Unknown User',
        requestedAt: new Date(transfer.requested_at),
        status: transfer.transfer_status as 'pending' | 'approved' | 'rejected' | 'completed',
        fromLocationId: transfer.from_location_id,
        toLocationId: transfer.to_location_id,
      })) || [];

      console.log('📋 Transfer requests found:', formattedRequests.length);
      setTransferRequests(formattedRequests);
    } catch (error) {
      console.error('Error fetching transfer requests:', error);
    }
  };

  const handleTransferProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowTransferForm(true);
  };

  const handleTransferSubmit = async (transferData: any) => {
    try {
      // Show immediate feedback
      console.log('Transfer completed:', transferData);

      // Refresh the data after successful transfer
      await Promise.all([
        fetchProducts(),
        fetchTransferRequests()
      ]);

      // Reset form state
      setShowTransferForm(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error refreshing data after transfer:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), fetchTransferRequests()]);
    setRefreshing(false);
  };

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
    console.log('🔍 Filtering products:', {
      totalProducts: products.length,
      searchQuery,
      filters,
    });

    const filtered = products.filter(product => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.product_code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = !filters.category || product.category_name === filters.category;
      const matchesLocation = !filters.location || product.location_name === filters.location;

      const passes = matchesSearch && matchesCategory && matchesLocation;

      if (!passes) {
        console.log('❌ Product filtered out:', {
          name: product.name,
          matchesSearch,
          matchesCategory,
          matchesLocation,
          category_name: product.category_name,
          location_name: product.location_name,
        });
      }

      return passes;
    });

    console.log('✅ Filtered products result:', filtered.length, 'products');
    return filtered;
  }, [searchQuery, filters, products]);

  // Filter transfer requests
  const filteredRequests = useMemo(() => {
    return transferRequests.filter(request => {
      const matchesSearch =
        request.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = !filters.status || request.status === filters.status;

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, filters, transferRequests]);

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

      <TouchableOpacity
        style={[styles.tab, activeTab === 'debug' && styles.activeTab]}
        onPress={() => setActiveTab('debug')}
      >
        <AlertTriangle size={20} color={activeTab === 'debug' ? theme.colors.primary : theme.colors.text.secondary} />
        <Text style={[styles.tabText, activeTab === 'debug' && styles.activeTabText]}>Debug</Text>
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
        <Text style={styles.productCode}>{item.product_code}</Text>

        <View style={styles.productMetaRow}>
          <View style={styles.productMetaItem}>
            <MapPin size={14} color={theme.colors.text.secondary} />
            <Text style={styles.productMetaText}>{item.location_name}</Text>
          </View>

          <View style={styles.productMetaItem}>
            <Package size={14} color={theme.colors.text.secondary} />
            <Text style={styles.productMetaText}>Stock: {item.total_stock}</Text>
          </View>
        </View>
      </View>

      <View style={styles.productActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: `${theme.colors.primary}20` }]}
          onPress={() => handleTransferProduct(item)}
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
      case 'requested':
        statusColor = theme.colors.status.warning;
        StatusIcon = Clock;
        break;
      case 'approved':
        statusColor = theme.colors.status.info;
        StatusIcon = CheckCircle;
        break;
      case 'in_transit':
        statusColor = theme.colors.status.info;
        StatusIcon = Send;
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
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Package size={48} color={theme.colors.text.muted} />
                <Text style={styles.emptyText}>
                  {loading ? 'Loading products...' : 'No products found'}
                </Text>
                <Text style={styles.emptySubtext}>
                  {loading
                    ? 'Please wait while we fetch products from the database'
                    : `Total products: ${products.length}, Filtered: ${filteredProducts.length}`
                  }
                </Text>
                {!loading && products.length > 0 && filteredProducts.length === 0 && (
                  <Text style={[styles.emptySubtext, { marginTop: 8, color: theme.colors.status.warning }]}>
                    Try adjusting your search or filters
                  </Text>
                )}
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

      case 'debug':
        return <LocationDebug />;

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

      {/* Transfer Form Modal */}
      <TransferForm
        visible={showTransferForm}
        onClose={() => {
          setShowTransferForm(false);
          setSelectedProduct(null);
        }}
        onSubmit={handleTransferSubmit}
        product={selectedProduct}
      />
    </SharedLayout>
  );
});

export default TransferPage;
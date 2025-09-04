import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Image,
  FlatList,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Package,
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import SharedLayout from '@/components/SharedLayout';
import ProductAddForm from '@/components/forms/ProductAddForm';
import { FormService } from '@/lib/services/formService';
// Mock product interface for UI demo
interface Product {
  id: string;
  name: string;
  productCode: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  supplier: string;
  dateAdded: Date;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  location: string;
  available: number;
  reserved: number;
  onHand: number;
  minimumThreshold: number;
  image?: string;
}

interface ProductFilters {
  search: string;
  category: string; // Will store category ID
  status: string;
  location: string; // Will store location ID
}

// Product interfaces are now imported from product-service

const ProductsPage = React.memo(function ProductsPage() {
  const { theme } = useTheme();
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false); // Instant loading - no delays
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: '',
    status: '',
    location: ''
  });
  const [refreshing, setRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState<'list' | 'grid'>('list');
  const [showProductForm, setShowProductForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter options data
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loadingFilterData, setLoadingFilterData] = useState(false);


  // Load mock products for UI demo
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);

      // Apply location filtering for admin and sales manager users
      let enhancedFilters = { ...filters };
      if (user?.role === 'admin') {
        const adminLocations = user.permissions?.locations || [];
        if (adminLocations.length > 0 && !filters.location) {
          // If admin has location restrictions and no specific location filter is set,
          // we'll let the RLS handle the filtering at the database level
          // The RLS policies should already restrict products to admin's locations
        }
      } else if (user?.role === 'sales_manager' && user.assigned_location_id) {
        // For sales managers, always filter by their assigned location
        enhancedFilters.location = user.assigned_location_id.toString();
      }

      // Fetch products from database
      const productsData = await FormService.getProducts(enhancedFilters, user?.id);

      // Transform database products to UI format
      const transformedProducts: Product[] = productsData.map((product: any) => ({
        id: product.id.toString(),
        name: product.name,
        productCode: product.product_code,
        category: product.category_name || 'Uncategorized',
        purchasePrice: 0, // Will be calculated from lots
        sellingPrice: 0, // Will be calculated from lots
        currentStock: product.current_stock || 0,
        supplier: product.supplier_name || 'Unknown',
        dateAdded: new Date(product.created_at),
        status: product.current_stock <= product.minimum_threshold ? 'Low Stock' :
                product.current_stock === 0 ? 'Out of Stock' : 'In Stock',
        location: product.location_name || 'Main Warehouse',
        available: product.current_stock || 0,
        reserved: 0, // Would need to calculate from pending orders
        onHand: product.current_stock || 0,
        minimumThreshold: product.minimum_threshold || 0,
        image: product.image_url || null,
      }));

      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Reload products when filters change
  useEffect(() => {
    loadProducts();
  }, [loadProducts, filters]);

  // Load filter options data
  const loadFilterOptions = useCallback(async () => {
    try {
      setLoadingFilterData(true);

      const [categoriesData, locationsData] = await Promise.all([
        FormService.getCategories(),
        FormService.getLocations()
      ]);

      setCategories(categoriesData);

      // Filter locations based on user permissions
      let filteredLocations = locationsData.data || locationsData;
      if (user?.role === 'admin') {
        const adminLocations = user.permissions?.locations || [];
        if (adminLocations.length > 0) {
          filteredLocations = filteredLocations.filter((location: any) =>
            adminLocations.includes(location.id)
          );
        }
      } else if (user?.role === 'sales_manager' && user.assigned_location_id) {
        // For sales managers, only show their assigned location
        filteredLocations = filteredLocations.filter((location: any) =>
          location.id === user.assigned_location_id
        );
      }

      setLocations(filteredLocations);
    } catch (error) {
      console.error('Error loading filter options:', error);
    } finally {
      setLoadingFilterData(false);
    }
  }, [user]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }, [loadProducts]);

  // Filter products based on current filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search filter - check name and product code
      if (filters.search &&
          !product.name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !product.productCode.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Category filter - compare by category name since we display category names
      if (filters.category) {
        const selectedCategory = categories.find(cat => cat.id.toString() === filters.category);
        if (selectedCategory && product.category !== selectedCategory.name) {
          return false;
        }
      }

      // Status filter
      if (filters.status && product.status !== filters.status) {
        return false;
      }

      // Location filter - compare by location name since we display location names
      if (filters.location) {
        const selectedLocation = locations.find(loc => loc.id.toString() === filters.location);
        if (selectedLocation && product.location !== selectedLocation.name) {
          return false;
        }
      }

      return true;
    });
  }, [products, filters, categories, locations]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'In Stock': return theme.colors.status.success;
      case 'Low Stock': return theme.colors.status.warning;
      case 'Out of Stock': return theme.colors.status.error;
      default: return theme.colors.text.secondary;
    }
  }, [theme]);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'In Stock': return CheckCircle;
      case 'Low Stock': return AlertTriangle;
      case 'Out of Stock': return AlertTriangle;
      default: return Package;
    }
  }, []);

  const handleProductAction = useCallback(async (action: 'view' | 'edit' | 'delete', product: Product) => {
    switch (action) {
      case 'view':
        // Navigate to product details
        Alert.alert('View Product', `Viewing ${product.name}`);
        break;
      case 'edit':
        if (!hasPermission('products', 'edit')) {
          Alert.alert('Permission Denied', 'You do not have permission to edit products.');
          return;
        }
        Alert.alert('Edit Product', `Editing ${product.name}`);
        break;
      case 'delete':
        if (!hasPermission('products', 'delete')) {
          Alert.alert('Permission Denied', 'You do not have permission to delete products.');
          return;
        }
        Alert.alert(
          'Delete Product',
          `Are you sure you want to delete ${product.name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  console.log('Deleting product:', product.name, product.id);
                  // Mock product deletion for demo
                  console.log('Mock delete product:', product.id);
                  Alert.alert('Success', `Product "${product.name}" deleted successfully`);
                  loadProducts(); // Refresh the list
                } catch (error) {
                  console.error('Delete product error:', error);
                  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                  Alert.alert('Error', `Failed to delete product: ${errorMessage}`);
                }
              }
            }
          ]
        );
        break;
    }
  }, [hasPermission, loadProducts]);

  const renderProductCard = useCallback(({ item: product }: { item: Product }) => {
    const StatusIcon = getStatusIcon(product.status || 'In Stock');

    return (
      <View style={[styles.productCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.productHeader}>
          <Image
            source={{ uri: product.image || 'https://via.placeholder.com/60x60?text=No+Image' }}
            style={styles.productImage}
          />
          <View style={styles.productInfo}>
            <Text style={[styles.productName, { color: theme.colors.text.primary }]} numberOfLines={2}>
              {product.name}
            </Text>
            <Text style={[styles.productCode, { color: theme.colors.text.secondary }]}>
              {product.productCode}
            </Text>
            <View style={styles.statusContainer}>
              <StatusIcon size={12} color={getStatusColor(product.status || 'In Stock')} />
              <Text style={[styles.statusText, { color: getStatusColor(product.status || 'In Stock') }]}>
                {product.status || 'In Stock'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.productDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Category:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{product.category || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Location:</Text>
            <View style={styles.locationContainer}>
              <MapPin size={12} color={theme.colors.text.secondary} />
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{product.location || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.stockInfo}>
            <View style={styles.stockItem}>
              <Text style={[styles.stockLabel, { color: theme.colors.text.secondary }]}>Available</Text>
              <Text style={[styles.stockValue, { color: theme.colors.primary }]}>{product.available}</Text>
            </View>
            <View style={styles.stockItem}>
              <Text style={[styles.stockLabel, { color: theme.colors.text.secondary }]}>Current</Text>
              <Text style={[styles.stockValue, { color: theme.colors.primary }]}>{product.currentStock}</Text>
            </View>
            <View style={styles.stockItem}>
              <Text style={[styles.stockLabel, { color: theme.colors.text.secondary }]}>Reserved</Text>
              <Text style={[styles.stockValue, { color: theme.colors.primary }]}>{product.reserved}</Text>
            </View>
          </View>
        </View>

        <View style={styles.productActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.status.info + '20' }]}
            onPress={() => handleProductAction('view', product)}
          >
            <Eye size={16} color={theme.colors.status.info} />
          </TouchableOpacity>

          {hasPermission('products', 'edit') && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.status.warning + '20' }]}
              onPress={() => handleProductAction('edit', product)}
            >
              <Edit size={16} color={theme.colors.status.warning} />
            </TouchableOpacity>
          )}

          {hasPermission('products', 'delete') && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.status.error + '20' }]}
              onPress={() => handleProductAction('delete', product)}
            >
              <Trash2 size={16} color={theme.colors.status.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }, [theme, getStatusColor, getStatusIcon, handleProductAction, hasPermission]);

  const handleAddProduct = useCallback(() => {
    if (!hasPermission('products', 'add')) {
      Alert.alert('Permission Denied', 'You do not have permission to add products.');
      return;
    }
    setShowProductForm(true); // Use complex form
  }, [hasPermission]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      category: '',
      status: '',
      location: ''
    });
  }, []);

  // Apply filters and close modal
  const applyFilters = useCallback(() => {
    setShowFilters(false);
  }, []);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.status) count++;
    if (filters.location) count++;
    return count;
  }, [filters]);

  // Render filter modal
  const renderFilterModal = () => {
    const statusOptions = ['In Stock', 'Low Stock', 'Out of Stock'];

    return (
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView style={[styles.filterModal, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.filterHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.filterTitle, { color: theme.colors.text.primary }]}>
              Filter Products
            </Text>
            <TouchableOpacity
              onPress={() => setShowFilters(false)}
              style={styles.closeButton}
            >
              <Text style={[styles.closeButtonText, { color: theme.colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent}>
            {/* Category Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: theme.colors.text.primary }]}>
                Category
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: !filters.category ? theme.colors.primary : theme.colors.backgroundSecondary,
                      borderColor: !filters.category ? theme.colors.primary : theme.colors.border,
                    }
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, category: '' }))}
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: !filters.category ? theme.colors.background : theme.colors.text.primary }
                  ]}>
                    All Categories
                  </Text>
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: filters.category === category.id.toString() ? theme.colors.primary : theme.colors.backgroundSecondary,
                        borderColor: filters.category === category.id.toString() ? theme.colors.primary : theme.colors.border,
                      }
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, category: category.id.toString() }))}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { color: filters.category === category.id.toString() ? theme.colors.background : theme.colors.text.primary }
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: theme.colors.text.primary }]}>
                Stock Status
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: !filters.status ? theme.colors.primary : theme.colors.backgroundSecondary,
                      borderColor: !filters.status ? theme.colors.primary : theme.colors.border,
                    }
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, status: '' }))}
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: !filters.status ? theme.colors.background : theme.colors.text.primary }
                  ]}>
                    All Status
                  </Text>
                </TouchableOpacity>
                {statusOptions.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: filters.status === status ? theme.colors.primary : theme.colors.backgroundSecondary,
                        borderColor: filters.status === status ? theme.colors.primary : theme.colors.border,
                      }
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, status }))}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { color: filters.status === status ? theme.colors.background : theme.colors.text.primary }
                    ]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Location Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: theme.colors.text.primary }]}>
                Location
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: !filters.location ? theme.colors.primary : theme.colors.backgroundSecondary,
                      borderColor: !filters.location ? theme.colors.primary : theme.colors.border,
                    }
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, location: '' }))}
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: !filters.location ? theme.colors.background : theme.colors.text.primary }
                  ]}>
                    All Locations
                  </Text>
                </TouchableOpacity>
                {locations.map((location) => (
                  <TouchableOpacity
                    key={location.id}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: filters.location === location.id.toString() ? theme.colors.primary : theme.colors.backgroundSecondary,
                        borderColor: filters.location === location.id.toString() ? theme.colors.primary : theme.colors.border,
                      }
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, location: location.id.toString() }))}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { color: filters.location === location.id.toString() ? theme.colors.background : theme.colors.text.primary }
                    ]}>
                      {location.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          {/* Filter Actions */}
          <View style={[styles.filterActions, { borderTopColor: theme.colors.border }]}>
            <TouchableOpacity
              style={[styles.clearButton, { borderColor: theme.colors.border }]}
              onPress={clearFilters}
            >
              <Text style={[styles.clearButtonText, { color: theme.colors.text.secondary }]}>
                Clear All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: theme.colors.primary }]}
              onPress={applyFilters}
            >
              <Text style={[styles.applyButtonText, { color: theme.colors.background }]}>
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  const handleAddProductComplex = useCallback(() => {
    if (!hasPermission('products', 'add')) {
      Alert.alert('Permission Denied', 'You do not have permission to add products.');
      return;
    }
    setShowProductForm(true);
  }, [hasPermission]);



  const handleProductSubmit = useCallback(async (data: any) => {
    console.log('🚀 === COMPLEX FORM SUBMIT CALLED ===');
    console.log('Received data:', data);
    console.log('Current user:', user);
    console.log('User permissions:', hasPermission('products', 'add'));

    // Add an alert to make sure this function is being called
    Alert.alert('DEBUG', 'COMPLEX form handleProductSubmit was called!');

    if (!user) {
      Alert.alert('Authentication Error', 'You must be logged in to add products.');
      return;
    }

    try {
      console.log('Mock product creation for demo...');
      console.log('User ID:', user?.id);
      // Mock product creation for demo
      const result = { id: Date.now().toString(), ...data };
      console.log('✅ Product created successfully:', result);

      Alert.alert('Success', 'Product added successfully!');
      setShowProductForm(false);
      loadProducts(); // Refresh the list
    } catch (error) {
      console.error('=== ERROR IN PRODUCT SUBMISSION ===');
      console.error('Error adding product:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

      // Show more specific error messages
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      Alert.alert('Error', `Failed to add product: ${errorMessage}`);
    }
  }, [user, loadProducts]);

  return (
    <SharedLayout title="Products">
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: theme.colors.backgroundSecondary }]}
        >
          <Download size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        {hasPermission('products', 'add') && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleAddProduct}
          >
            <Plus size={20} color={theme.colors.text.inverse} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search and Filters */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.input, borderColor: theme.colors.border }]}>
          <Search size={20} color={theme.colors.text.secondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text.primary }]}
            placeholder="Search products..."
            placeholderTextColor={theme.colors.text.muted}
            value={filters.search || ''}
            onChangeText={(text) => setFilters(prev => ({ ...prev, search: text }))}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: theme.colors.backgroundSecondary }]}
          onPress={() => setShowFilters(true)}
        >
          <Filter size={20} color={theme.colors.primary} />
          {activeFilterCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: theme.colors.status.error }]}>
              <Text style={[styles.filterBadgeText, { color: theme.colors.background }]}>
                {activeFilterCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filters */}
      {(filters.category || filters.status || filters.location) && (
        <View style={[styles.activeFiltersContainer, { backgroundColor: theme.colors.card }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFiltersScroll}>
            {filters.category && (
              <View style={[styles.activeFilterChip, { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }]}>
                <Text style={[styles.activeFilterText, { color: theme.colors.primary }]}>
                  Category: {categories.find(cat => cat.id.toString() === filters.category)?.name || filters.category}
                </Text>
                <TouchableOpacity
                  onPress={() => setFilters(prev => ({ ...prev, category: '' }))}
                  style={styles.removeFilterButton}
                >
                  <Text style={[styles.removeFilterText, { color: theme.colors.primary }]}>×</Text>
                </TouchableOpacity>
              </View>
            )}
            {filters.status && (
              <View style={[styles.activeFilterChip, { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }]}>
                <Text style={[styles.activeFilterText, { color: theme.colors.primary }]}>
                  Status: {filters.status}
                </Text>
                <TouchableOpacity
                  onPress={() => setFilters(prev => ({ ...prev, status: '' }))}
                  style={styles.removeFilterButton}
                >
                  <Text style={[styles.removeFilterText, { color: theme.colors.primary }]}>×</Text>
                </TouchableOpacity>
              </View>
            )}
            {filters.location && (
              <View style={[styles.activeFilterChip, { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }]}>
                <Text style={[styles.activeFilterText, { color: theme.colors.primary }]}>
                  Location: {locations.find(loc => loc.id.toString() === filters.location)?.name || filters.location}
                </Text>
                <TouchableOpacity
                  onPress={() => setFilters(prev => ({ ...prev, location: '' }))}
                  style={styles.removeFilterButton}
                >
                  <Text style={[styles.removeFilterText, { color: theme.colors.primary }]}>×</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={[styles.clearAllFiltersButton, { borderColor: theme.colors.text.secondary }]}
              onPress={clearFilters}
            >
              <Text style={[styles.clearAllFiltersText, { color: theme.colors.text.secondary }]}>
                Clear All
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductCard}
        keyExtractor={(item) => item.id}
        style={styles.productsList}
        contentContainerStyle={styles.productsContainer}
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
            <Package size={48} color={theme.colors.text.muted} />
            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
              {loading ? 'Loading products...' : 'No products found'}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.text.muted }]}>
              {loading ? 'Please wait...' : 'Try adding a new product or adjusting your search'}
            </Text>
          </View>
        }
      />

      {/* Product Add Form */}
      <ProductAddForm
        visible={showProductForm}
        onClose={() => setShowProductForm(false)}
        onSubmit={handleProductSubmit}
      />

      {/* Filter Modal */}
      {renderFilterModal()}

    </SharedLayout>
  );
});

export default ProductsPage;

const styles = StyleSheet.create({
  container: {
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  productsList: {
    flex: 1,
  },
  productsContainer: {
    padding: 16,
    gap: 12,
  },
  productCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productCode: {
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
  productDetails: {
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
  productActions: {
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
  // Filter styles
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  filterModal: {
    flex: 1,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filterContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginVertical: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Active filters styles
  activeFiltersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  activeFiltersScroll: {
    flexDirection: 'row',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  removeFilterButton: {
    marginLeft: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeFilterText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  clearAllFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearAllFiltersText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
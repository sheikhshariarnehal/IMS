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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Star,
  X,
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
  _originalData?: any; // Store original database data for editing
}

interface ProductFilters {
  search: string;
  category: string; // Will store category ID
  status: string;
  location: string; // Will store location ID
  sortBy: 'name' | 'price' | 'stock' | 'date' | 'topSelling';
  sortOrder: 'asc' | 'desc';
}

// Product interfaces are now imported from product-service

const ProductsPage = React.memo(function ProductsPage() {
  const { theme } = useTheme();
  const { user, hasPermission, getAccessibleLocations } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false); // Instant loading - no delays
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: '',
    status: '',
    location: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [refreshing, setRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState<'list' | 'grid'>('list');
  const [showProductForm, setShowProductForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter options data
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loadingFilterData, setLoadingFilterData] = useState(false);


  // Load mock products for UI demo
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);

      console.log('🔄 Products page: Loading products...');
      console.log('👤 Current user:', { id: user?.id, role: user?.role });

      // Get accessible locations for current user
      const accessibleLocations = getAccessibleLocations();
      console.log('📍 Accessible locations for user:', accessibleLocations);

      // Apply location filtering for admin and sales manager users
      let enhancedFilters = { ...filters };

      // Apply location filtering for non-super admin users
      if (user?.role !== 'super_admin' && accessibleLocations.length > 0) {
        console.log('🔒 Applying location filter for role:', user?.role);

        if (user?.role === 'sales_manager') {
          // Sales managers can only see products from their assigned location
          enhancedFilters.location = accessibleLocations[0]; // Sales manager has only one location
        } else if (user?.role === 'admin') {
          // Admins can see products from their accessible locations
          if (filters.location) {
            // If a specific location filter is set, verify it's accessible
            if (!accessibleLocations.includes(filters.location)) {
              console.warn('⚠️ Admin trying to access non-permitted location, resetting filter');
              enhancedFilters.location = accessibleLocations; // Use all accessible locations
            }
            // If valid location filter is set, keep it as is
          } else {
            // If no specific location filter is set, filter by all accessible locations
            enhancedFilters.location = accessibleLocations;
          }
        }
      }

      console.log('🔍 Enhanced filters:', enhancedFilters);

      // Fetch products from database
      const productsData = await FormService.getProducts(enhancedFilters, user?.id);
      console.log('📦 Raw products data:', productsData.length, 'products found');

      // Debug: Log first product to see available fields
      if (productsData.length > 0) {
        console.log('🔍 First product data structure:', productsData[0]);
        console.log('🔍 Available price fields:', {
          purchase_price: productsData[0].purchase_price,
          selling_price: productsData[0].selling_price,
          per_meter_price: productsData[0].per_meter_price,
          purchasePrice: productsData[0].purchasePrice,
          sellingPrice: productsData[0].sellingPrice
        });
      }

      // Transform database products to UI format
      const transformedProducts: Product[] = productsData.map((product: any) => {
        // Helper function to safely parse numeric values
        const parsePrice = (value: any): number => {
          if (value === null || value === undefined) return 0;
          const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
          return isNaN(parsed) ? 0 : parsed;
        };

        // Get the best available price - prioritize selling_price, then per_meter_price, then purchase_price
        const sellingPrice = parsePrice(product.selling_price) || parsePrice(product.per_meter_price) || 0;
        const purchasePrice = parsePrice(product.purchase_price) || 0;

        console.log(`💰 Product "${product.name}" prices:`, {
          raw_selling_price: product.selling_price,
          raw_per_meter_price: product.per_meter_price,
          raw_purchase_price: product.purchase_price,
          parsed_selling: sellingPrice,
          parsed_purchase: purchasePrice,
          product_object: product
        });

        return {
          id: product.id.toString(),
          name: product.name || 'Unknown Product',
          productCode: product.product_code || 'N/A',
          category: product.category_name || 'Uncategorized',
          purchasePrice: purchasePrice,
          sellingPrice: sellingPrice,
          currentStock: parsePrice(product.current_stock),
          supplier: product.supplier_name || 'Unknown',
          dateAdded: new Date(product.created_at || Date.now()),
          status: (parsePrice(product.current_stock) <= (product.minimum_threshold || 0)) ? 'Low Stock' :
                  parsePrice(product.current_stock) === 0 ? 'Out of Stock' : 'In Stock',
          location: product.location_name || 'Main Warehouse',
          available: parsePrice(product.current_stock),
          reserved: 0, // Would need to calculate from pending orders
          onHand: parsePrice(product.current_stock),
          minimumThreshold: product.minimum_threshold || 0,
          image: product.image_url || null,
          // Store original database fields for editing
          _originalData: product,
        };
      });

      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, user?.id, user?.role, getAccessibleLocations]);

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

  // Filter and sort products based on current filters
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
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

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.sellingPrice - b.sellingPrice;
          break;
        case 'stock':
          comparison = a.currentStock - b.currentStock;
          break;
        case 'date':
          comparison = new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
          break;
        case 'topSelling':
          // For top selling, we'll use current stock as a proxy (lower stock = more sold)
          comparison = a.currentStock - b.currentStock;
          break;
        default:
          comparison = 0;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
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

        // Use the original database data for editing
        const originalData = (product as any)._originalData;
        if (!originalData) {
          Alert.alert('Error', 'Product data not available for editing.');
          return;
        }

        console.log('🔄 Setting editing product with original data:', originalData);
        setEditingProduct(originalData);
        setShowEditForm(true);
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
    const statusColor = getStatusColor(product.status || 'In Stock');

    return (
      <View style={[styles.productCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        {/* Header with Image and Basic Info */}
        <View style={styles.productHeader}>
          <View style={styles.productImageContainer}>
            <Image
              source={{ uri: product.image || 'https://via.placeholder.com/72x72?text=No+Image' }}
              style={[styles.productImage, { backgroundColor: theme.colors.backgroundSecondary }]}
              resizeMode="cover"
            />
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <StatusIcon size={10} color={theme.colors.background} />
            </View>
          </View>

          <View style={styles.productInfo}>
            <Text style={[styles.productName, { color: theme.colors.text.primary }]} numberOfLines={2}>
              {product.name}
            </Text>
            <Text style={[styles.productCode, { color: theme.colors.text.secondary }]}>
              {product.productCode}
            </Text>

            {/* Price Information */}
            <View style={styles.priceContainer}>
              {product.sellingPrice > 0 ? (
                <>
                  <Text style={[styles.priceLabel, { color: theme.colors.text.secondary }]}>Selling:</Text>
                  <Text style={[styles.priceValue, { color: theme.colors.primary }]}>
                    ৳{product.sellingPrice.toLocaleString()}
                  </Text>
                </>
              ) : product.purchasePrice > 0 ? (
                <>
                  <Text style={[styles.priceLabel, { color: theme.colors.text.secondary }]}>Purchase:</Text>
                  <Text style={[styles.priceValue, { color: theme.colors.status.warning }]}>
                    ৳{product.purchasePrice.toLocaleString()}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.priceLabel, { color: theme.colors.text.secondary }]}>Price:</Text>
                  <Text style={[styles.priceValue, { color: theme.colors.text.muted }]}>N/A</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Status and Category Row */}
        <View style={styles.infoRow}>
          <View style={[styles.statusContainer, { backgroundColor: statusColor + '15' }]}>
            <StatusIcon size={12} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {product.status || 'In Stock'}
            </Text>
          </View>

          <View style={[styles.categoryContainer, { backgroundColor: theme.colors.primary + '10' }]}>
            <Package size={12} color={theme.colors.primary} />
            <Text style={[styles.categoryText, { color: theme.colors.primary }]}>
              {product.category || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Location */}
        <View style={[styles.locationContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <MapPin size={14} color={theme.colors.text.secondary} />
          <Text style={[styles.locationText, { color: theme.colors.text.primary }]}>
            {product.location || 'No Location'}
          </Text>
        </View>

        {/* Stock Information */}
        <View style={[styles.stockInfo, { backgroundColor: theme.colors.backgroundTertiary }]}>
          <View style={styles.stockItem}>
            <Text style={[styles.stockLabel, { color: theme.colors.text.secondary }]}>Available</Text>
            <Text style={[styles.stockValue, { color: theme.colors.status.success }]}>
              {product.available || 0}
            </Text>
          </View>
          <View style={styles.stockDivider} />
          <View style={styles.stockItem}>
            <Text style={[styles.stockLabel, { color: theme.colors.text.secondary }]}>Current</Text>
            <Text style={[styles.stockValue, { color: theme.colors.primary }]}>
              {product.currentStock || 0}
            </Text>
          </View>
          <View style={styles.stockDivider} />
          <View style={styles.stockItem}>
            <Text style={[styles.stockLabel, { color: theme.colors.text.secondary }]}>Reserved</Text>
            <Text style={[styles.stockValue, { color: theme.colors.status.warning }]}>
              {product.reserved || 0}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.productActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.status.info + '15' }]}
            onPress={() => handleProductAction('view', product)}
          >
            <Eye size={18} color={theme.colors.status.info} />
          </TouchableOpacity>

          {hasPermission('products', 'edit') && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.status.warning + '15' }]}
              onPress={() => handleProductAction('edit', product)}
            >
              <Edit size={18} color={theme.colors.status.warning} />
            </TouchableOpacity>
          )}

          {hasPermission('products', 'delete') && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.status.error + '15' }]}
              onPress={() => handleProductAction('delete', product)}
            >
              <Trash2 size={18} color={theme.colors.status.error} />
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
      location: '',
      sortBy: 'name',
      sortOrder: 'asc'
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

            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: theme.colors.text.primary }]}>
                Sort By
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                {[
                  { key: 'name', label: 'Name', icon: ArrowUpDown },
                  { key: 'price', label: 'Price', icon: ArrowUpDown },
                  { key: 'stock', label: 'Stock', icon: ArrowUpDown },
                  { key: 'date', label: 'Date Added', icon: ArrowUpDown },
                  { key: 'topSelling', label: 'Top Selling', icon: Star },
                ].map((sortOption) => {
                  const IconComponent = sortOption.icon;
                  const isSelected = filters.sortBy === sortOption.key;
                  return (
                    <TouchableOpacity
                      key={sortOption.key}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: isSelected ? theme.colors.primary : theme.colors.backgroundSecondary,
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        }
                      ]}
                      onPress={() => setFilters(prev => ({ ...prev, sortBy: sortOption.key as any }))}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <IconComponent
                          size={14}
                          color={isSelected ? theme.colors.background : theme.colors.text.primary}
                        />
                        <Text style={[
                          styles.filterChipText,
                          { color: isSelected ? theme.colors.background : theme.colors.text.primary }
                        ]}>
                          {sortOption.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
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

  const handleProductEdit = useCallback(async (data: any) => {
    console.log('=== PRODUCT EDIT STARTED ===');
    console.log('Edit data received:', data);
    console.log('Editing product:', editingProduct?.name);

    if (!user) {
      Alert.alert('Authentication Error', 'You must be logged in to edit products.');
      return;
    }

    if (!editingProduct?.id) {
      Alert.alert('Error', 'No product selected for editing.');
      return;
    }

    try {
      console.log('Updating product via FormService...');
      console.log('User ID:', user?.id);
      console.log('Product ID:', editingProduct?.id);

      // Use the real FormService.updateProduct method
      const result = await FormService.updateProduct(editingProduct.id, data, user.id);

      if (result.success && result.data) {
        console.log('✅ Product updated successfully:', result.data);
        Alert.alert('Success', `Product "${editingProduct?.name}" updated successfully!`);
        setShowEditForm(false);
        setEditingProduct(null);
        loadProducts(); // Refresh the list
      } else {
        console.error('❌ Product update failed:', result.error);
        Alert.alert('Error', `Failed to update product: ${result.error}`);
      }
    } catch (error) {
      console.error('=== ERROR IN PRODUCT EDIT ===');
      console.error('Error updating product:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to update product: ${errorMessage}`);
    }
  }, [user, editingProduct, loadProducts]);

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
          style={[styles.sortButton, { backgroundColor: theme.colors.backgroundSecondary }]}
          onPress={() => {
            const newOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc';
            setFilters(prev => ({ ...prev, sortOrder: newOrder }));
          }}
        >
          {filters.sortOrder === 'asc' ? (
            <ArrowUp size={18} color={theme.colors.primary} />
          ) : (
            <ArrowDown size={18} color={theme.colors.primary} />
          )}
        </TouchableOpacity>
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

      {/* Product Edit Form */}
      <ProductAddForm
        visible={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setEditingProduct(null);
        }}
        onSubmit={handleProductEdit}
        existingProduct={editingProduct}
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
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: 'transparent',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
  },
  sortButton: {
    width: 44,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginRight: 8,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  productsList: {
    flex: 1,
  },
  productsContainer: {
    padding: 20,
    gap: 16,
    paddingBottom: 100, // Extra padding for bottom navigation
  },
  productCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: 2, // Prevent shadow clipping
  },
  productHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  productImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  productImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  statusBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 24,
  },
  productCode: {
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '500',
    opacity: 0.8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flex: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flex: 1,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  stockItem: {
    alignItems: 'center',
    flex: 1,
  },
  stockDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 8,
  },
  stockLabel: {
    fontSize: 11,
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  stockValue: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
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
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filterContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  filterSection: {
    marginVertical: 24,
  },
  filterSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    marginRight: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Active filters styles
  activeFiltersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  activeFiltersScroll: {
    flexDirection: 'row',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeFilterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  removeFilterButton: {
    marginLeft: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeFilterText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  clearAllFiltersButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearAllFiltersText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
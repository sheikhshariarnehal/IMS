import React, { useState, useMemo } from 'react';
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
  Tag,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  ChevronRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import BottomNavBar from '@/components/BottomNavBar';
import TopNavBar from '@/components/TopNavBar';
import CategoryAddForm from '@/components/forms/CategoryAddForm';

// Interfaces
interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  parentCategory?: string;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
  metaTitle?: string;
  metaDescription?: string;
  createdBy: string;
  lastUpdated: Date;
}

interface CategoryFilters {
  search?: string;
  isActive?: boolean;
  parentCategory?: string;
}

// Mock data
const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Sofa Fabrics',
    code: 'SOF001',
    description: 'High-quality fabrics for sofas and couches',
    color: '#FF6B6B',
    isActive: true,
    sortOrder: 1,
    productCount: 45,
    metaTitle: 'Sofa Fabrics - Premium Quality',
    metaDescription: 'Explore our collection of premium sofa fabrics',
    createdBy: 'Admin User',
    lastUpdated: new Date(),
  },
  {
    id: '2',
    name: 'Curtain Fabrics',
    code: 'CUR002',
    description: 'Elegant fabrics for curtains and drapes',
    color: '#4ECDC4',
    isActive: true,
    sortOrder: 2,
    productCount: 38,
    metaTitle: 'Curtain Fabrics - Elegant Designs',
    metaDescription: 'Discover elegant curtain fabrics for your home',
    createdBy: 'Admin User',
    lastUpdated: new Date(),
  },
  {
    id: '3',
    name: 'Artificial Leather',
    code: 'ARL003',
    description: 'High-quality artificial leather for furniture',
    color: '#45B7D1',
    isActive: true,
    sortOrder: 3,
    productCount: 22,
    metaTitle: 'Artificial Leather - Durable & Stylish',
    metaDescription: 'Premium artificial leather for furniture upholstery',
    createdBy: 'Admin User',
    lastUpdated: new Date(),
  },
  {
    id: '4',
    name: 'Bed Sheets',
    code: 'BED004',
    description: 'Comfortable fabrics for bed sheets and covers',
    color: '#96CEB4',
    isActive: false,
    sortOrder: 4,
    productCount: 0,
    createdBy: 'Admin User',
    lastUpdated: new Date(),
  },
  {
    id: '5',
    name: 'Upholstery Fabrics',
    code: 'UPH005',
    description: 'Durable fabrics for furniture upholstery',
    color: '#FFEAA7',
    isActive: true,
    sortOrder: 5,
    productCount: 27,
    metaTitle: 'Upholstery Fabrics - Durable & Stylish',
    metaDescription: 'Find the perfect upholstery fabric for your furniture',
    createdBy: 'Admin User',
    lastUpdated: new Date(),
  },
];

export default function CategoriesPage() {
  const { theme } = useTheme();
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const [categories] = useState<Category[]>(mockCategories);
  const [filters, setFilters] = useState<CategoryFilters>({});
  const [refreshing, setRefreshing] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const filteredCategories = useMemo(() => {
    return categories.filter(category => {
      if (filters.search && 
          !category.name.toLowerCase().includes(filters.search.toLowerCase()) && 
          !category.code.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.isActive !== undefined && category.isActive !== filters.isActive) {
        return false;
      }
      if (filters.parentCategory && category.parentCategory !== filters.parentCategory) {
        return false;
      }
      return true;
    });
  }, [categories, filters]);

  const analytics = useMemo(() => {
    const totalCategories = categories.length;
    const activeCategories = categories.filter(c => c.isActive).length;
    const totalProducts = categories.reduce((sum, c) => sum + c.productCount, 0);
    
    return {
      totalCategories,
      activeCategories,
      totalProducts,
    };
  }, [categories]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAddCategory = () => {
    if (!hasPermission('products', 'add')) {
      Alert.alert('Permission Denied', 'You do not have permission to add categories.');
      return;
    }
    setShowCategoryForm(true);
  };

  const handleCategorySubmit = (data: any) => {
    console.log('Category form submitted:', data);
    // Here you would normally save the category data
    Alert.alert('Success', 'Category added successfully!');
    setShowCategoryForm(false);
  };

  const handleAction = (action: string, category: Category) => {
    switch (action) {
      case 'view':
        Alert.alert('View Category', `Viewing ${category.name}`);
        break;
      case 'edit':
        if (!hasPermission('products', 'edit')) {
          Alert.alert('Permission Denied', 'You do not have permission to edit categories.');
          return;
        }
        Alert.alert('Edit Category', `Editing ${category.name}`);
        break;
      case 'delete':
        if (!hasPermission('products', 'delete')) {
          Alert.alert('Permission Denied', 'You do not have permission to delete categories.');
          return;
        }
        Alert.alert(
          'Delete Category',
          `Are you sure you want to delete ${category.name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete category') }
          ]
        );
        break;
      case 'toggle':
        if (!hasPermission('products', 'edit')) {
          Alert.alert('Permission Denied', 'You do not have permission to edit categories.');
          return;
        }
        const action = category.isActive ? 'Deactivate' : 'Activate';
        Alert.alert(`${action} Category`, `${action} ${category.name}?`);
        break;
    }
  };

  const renderKPICards = () => (
    <View style={styles.kpiContainer}>
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.kpiIcon, { backgroundColor: theme.colors.primary + '20' }]}>
            <Tag size={24} color={theme.colors.primary} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>{analytics.totalCategories}</Text>
          <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Total Categories</Text>
        </View>
        
        <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.success + '20' }]}>
            <CheckCircle size={24} color={theme.colors.status.success} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>{analytics.activeCategories}</Text>
          <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Active Categories</Text>
        </View>
      </View>
    </View>
  );

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <View style={[styles.itemCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.itemHeader}>
        <View style={styles.categoryInfo}>
          <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
          <View style={styles.categoryDetails}>
            <Text style={[styles.categoryName, { 
              color: item.isActive ? theme.colors.text.primary : theme.colors.text.muted 
            }]}>
              {item.name}
            </Text>
            <Text style={[styles.categoryCode, { color: theme.colors.text.secondary }]}>
              {item.code}
            </Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          {item.isActive ? (
            <CheckCircle size={16} color={theme.colors.status.success} />
          ) : (
            <XCircle size={16} color={theme.colors.status.error} />
          )}
          <Text style={[
            styles.statusText, 
            { color: item.isActive ? theme.colors.status.success : theme.colors.status.error }
          ]}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {item.description && (
        <Text style={[styles.description, { color: theme.colors.text.secondary }]} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Products:</Text>
          <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
            {item.productCount}
          </Text>
        </View>
        
        {item.parentCategory && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Parent:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
              {item.parentCategory}
            </Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Sort Order:</Text>
          <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
            {item.sortOrder}
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
        
        {hasPermission('products', 'edit') && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.status.warning + '20' }]}
              onPress={() => handleAction('edit', item)}
            >
              <Edit size={16} color={theme.colors.status.warning} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { 
                backgroundColor: item.isActive ? theme.colors.status.error + '20' : theme.colors.status.success + '20' 
              }]}
              onPress={() => handleAction('toggle', item)}
            >
              {item.isActive ? 
                <XCircle size={16} color={theme.colors.status.error} /> :
                <CheckCircle size={16} color={theme.colors.status.success} />
              }
            </TouchableOpacity>
          </>
        )}
        
        {hasPermission('products', 'delete') && item.productCount === 0 && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.status.error + '20' }]}
            onPress={() => handleAction('delete', item)}
          >
            <Trash2 size={16} color={theme.colors.status.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TopNavBar
        title="Categories"
        subtitle={`${filteredCategories.length} categories`}
        showBackButton={true}
        rightContent={
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.headerButton, { backgroundColor: theme.colors.backgroundSecondary }]}
            >
              <Download size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            {hasPermission('products', 'add') && (
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleAddCategory}
              >
                <Plus size={20} color={theme.colors.text.inverse} />
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* KPI Cards */}
        {renderKPICards()}

        {/* Search and Filters */}
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
          <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.input, borderColor: theme.colors.border }]}>
            <Search size={20} color={theme.colors.text.secondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text.primary }]}
              placeholder="Search categories..."
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

        {/* Categories List */}
        <FlatList
          data={filteredCategories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
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
              <Tag size={48} color={theme.colors.text.muted} />
              <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                No categories found
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.text.muted }]}>
                Try adjusting your search or filters
              </Text>
            </View>
          }
        />
      </ScrollView>

      {/* Category Add Form */}
      <CategoryAddForm
        visible={showCategoryForm}
        onClose={() => setShowCategoryForm(false)}
        onSubmit={handleCategorySubmit}
      />

      <BottomNavBar activeTab="search" />
    </SafeAreaView>
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 12,
    textAlign: 'center',
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
    gap: 16,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryCode: {
    fontSize: 12,
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
  description: {
    fontSize: 14,
    marginBottom: 12,
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
});
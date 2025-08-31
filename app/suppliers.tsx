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
  Truck,
  Star,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Building,
  User,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import SharedLayout from '@/components/SharedLayout';
import SupplierAddForm from '@/components/forms/SupplierAddForm';
import { FormService } from '@/lib/services/formService';
// Mock interfaces for UI demo
interface SupplierType {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

interface SupplierFilters {
  search?: string;
  isActive?: boolean;
}

export default function SuppliersPage() {
  const { theme } = useTheme();
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<SupplierType[]>([]);
  const [loading, setLoading] = useState(false); // Always false for instant loading
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalSpent: 0,
  });
  const [filters, setFilters] = useState<SupplierFilters>({});
  const [refreshing, setRefreshing] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);

  // Load suppliers when component mounts
  useEffect(() => {
    loadSuppliers();
    loadStats();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);

      // Fetch suppliers from database
      const suppliersData = await FormService.getSuppliers();

      // Transform database suppliers to UI format
      const transformedSuppliers: SupplierType[] = suppliersData.map((supplier: any) => ({
        id: supplier.id.toString(),
        name: supplier.name,
        contact_person: supplier.contact_person,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        city: supplier.city,
        state: supplier.state,
        country: supplier.country,
        postal_code: supplier.postal_code,
        tax_number: supplier.tax_number,
        payment_terms: supplier.payment_terms || 30,
        credit_limit: supplier.credit_limit || 0,
        current_balance: supplier.current_balance || 0,
        total_orders: supplier.total_orders || 0,
        total_spent: supplier.total_spent || 0,
        last_order_date: supplier.last_order_date,
        last_payment_date: supplier.last_payment_date,
        is_active: supplier.is_active !== false,
        rating: supplier.rating || 0,
        notes: supplier.notes,
        created_at: supplier.created_at,
        updated_at: supplier.updated_at,
      }));

      setSuppliers(transformedSuppliers);

      // Calculate stats
      const stats = {
        total: transformedSuppliers.length,
        active: transformedSuppliers.filter(s => s.is_active).length,
        inactive: transformedSuppliers.filter(s => !s.is_active).length,
        totalSpent: transformedSuppliers.reduce((sum, s) => sum + (s.total_spent || 0), 0),
      };
      setStats(stats);

    } catch (error) {
      console.error('Failed to load suppliers:', error);
      Alert.alert('Error', 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    // Stats are now loaded in loadSuppliers
  };

  const handleSupplierAdded = () => {
    loadSuppliers();
    loadStats();
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      if (filters.search &&
        !supplier.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !(supplier.contact_person || '').toLowerCase().includes(filters.search.toLowerCase()) &&
        !(supplier.email || '').toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      // Note: supplier_type filter removed as it doesn't exist in the actual Supplier type
      if (filters.isActive !== undefined && supplier.is_active !== filters.isActive) {
        return false;
      }
      return true;
    });
  }, [suppliers, filters]);

  const analytics = useMemo(() => {
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter(s => s.is_active).length;
    const totalSpent = 0; // This would come from orders/purchases data
    const averageRating = 0; // Rating system not implemented yet

    return {
      totalSuppliers,
      activeSuppliers,
      averageRating,
      totalSpent,
    };
  }, [suppliers]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadSuppliers(), loadStats()]);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getSupplierTypeColor = (type?: string) => {
    // Default color since supplier_type doesn't exist in current schema
    return theme.colors.primary;
  };

  const getRatingColor = (rating?: number) => {
    // Default color since rating doesn't exist in current schema
    return theme.colors.status.info;
  };

  const handleAction = (action: string, supplier: SupplierType) => {
    switch (action) {
      case 'view':
        Alert.alert('View Details', `Viewing details for ${supplier.name}`);
        break;
      case 'edit':
        if (!hasPermission('suppliers', 'edit')) {
          Alert.alert('Permission Denied', 'You do not have permission to edit suppliers.');
          return;
        }
        Alert.alert('Edit Supplier', `Editing ${supplier.name}`);
        break;
      case 'activate':
        if (!hasPermission('suppliers', 'edit')) {
          Alert.alert('Permission Denied', 'You do not have permission to manage supplier status.');
          return;
        }
        const actionText = supplier.is_active ? 'Deactivate' : 'Activate';
        Alert.alert(`${actionText} Supplier`, `${actionText} ${supplier.name}?`);
        break;
      case 'contact':
        Alert.alert('Contact Supplier', `Contacting ${supplier.contact_person || 'N/A'} at ${supplier.phone || 'N/A'}`);
        break;
    }
  };

  const handleAddSupplier = () => {
    if (!hasPermission('suppliers', 'add')) {
      Alert.alert('Permission Denied', 'You do not have permission to add suppliers.');
      return;
    }
    setShowSupplierForm(true);
  };

  const handleSupplierSubmit = (data: any) => {
    console.log('Supplier form submitted:', data);
    // Here you would normally save the supplier data
    Alert.alert('Success', 'Supplier added successfully!');
    setShowSupplierForm(false);
  };

  const renderKPICards = () => (
    <View style={styles.kpiContainer}>
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.kpiIcon, { backgroundColor: theme.colors.primary + '20' }]}>
            <Truck size={24} color={theme.colors.primary} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>{stats.total}</Text>
          <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Total Suppliers</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.success + '20' }]}>
            <UserCheck size={24} color={theme.colors.status.success} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>{stats.active}</Text>
          <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Active Suppliers</Text>
        </View>
      </View>

      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.warning + '20' }]}>
            <UserX size={24} color={theme.colors.status.warning} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>
            {stats.inactive}
          </Text>
          <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Inactive Suppliers</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.info + '20' }]}>
            <DollarSign size={24} color={theme.colors.status.info} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>
            ৳{stats.totalSpent ? stats.totalSpent.toLocaleString() : '0'}
          </Text>
          <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Total Spent</Text>
        </View>
      </View>
    </View>
  );

  const renderStarRating = (rating: number) => (
    <View style={styles.ratingContainer}>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={12}
            color={star <= rating ? theme.colors.status.warning : theme.colors.text.muted}
            fill={star <= rating ? theme.colors.status.warning : 'none'}
          />
        ))}
      </View>
      <Text style={[styles.ratingText, { color: getRatingColor(rating) }]}>
        {rating ? rating.toFixed(1) : '0.0'}
      </Text>
    </View>
  );

  const renderSupplierItem = ({ item }: { item: SupplierType }) => (
    <View style={[styles.itemCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.itemHeader}>
        <View style={styles.supplierInfo}>
          <View style={styles.supplierAvatar}>
            <View style={[
              styles.avatar,
              { backgroundColor: item.is_active ? getSupplierTypeColor() : theme.colors.text.muted }
            ]}>
              <Text style={[styles.avatarText, { color: theme.colors.text.inverse }]}>
                {item.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.supplierDetails}>
              <Text style={[styles.supplierName, {
                color: item.is_active ? theme.colors.text.primary : theme.colors.text.muted
              }]}>
                {item.name}
              </Text>
              <Text style={[styles.companyName, { color: theme.colors.text.secondary }]} numberOfLines={1}>
                {item.contact_person || 'N/A'}
              </Text>
              <View style={styles.supplierTypeContainer}>
                <Text style={[
                  styles.supplierType,
                  {
                    color: getSupplierTypeColor(),
                    backgroundColor: getSupplierTypeColor() + '20'
                  }
                ]}>
                  Supplier
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.statusContainer}>
            {item.is_active ? (
              <CheckCircle size={16} color={theme.colors.status.success} />
            ) : (
              <XCircle size={16} color={theme.colors.status.error} />
            )}
            <Text style={[
              styles.statusText,
              { color: item.is_active ? theme.colors.status.success : theme.colors.status.error }
            ]}>
              {item.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.contactInfo}>
        <View style={styles.contactItem}>
          <User size={12} color={theme.colors.text.muted} />
          <Text style={[styles.contactText, { color: theme.colors.text.muted }]}>
            {item.contact_person || 'N/A'}
          </Text>
        </View>
        <View style={styles.contactItem}>
          <Phone size={12} color={theme.colors.text.muted} />
          <Text style={[styles.contactText, { color: theme.colors.text.muted }]}>
            {item.phone || 'N/A'}
          </Text>
        </View>
        <View style={styles.contactItem}>
          <Mail size={12} color={theme.colors.text.muted} />
          <Text style={[styles.contactText, { color: theme.colors.text.muted }]} numberOfLines={1}>
            {item.email || 'N/A'}
          </Text>
        </View>
        <View style={styles.contactItem}>
          <MapPin size={12} color={theme.colors.text.muted} />
          <Text style={[styles.contactText, { color: theme.colors.text.muted }]} numberOfLines={1}>
            {item.address || 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.itemDetails}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Status</Text>
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
              {item.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Created</Text>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Updated</Text>
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
              {new Date(item.updated_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Created By:</Text>
          <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
            {item.created_by || 'N/A'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>ID:</Text>
          <Text style={[styles.detailValue, { color: theme.colors.status.info }]}>
            {item.id.substring(0, 8)}...
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

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary + '20' }]}
          onPress={() => handleAction('contact', item)}
        >
          <Phone size={16} color={theme.colors.primary} />
        </TouchableOpacity>

        {hasPermission('suppliers', 'edit') && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.status.warning + '20' }]}
              onPress={() => handleAction('edit', item)}
            >
              <Edit size={16} color={theme.colors.status.warning} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, {
                backgroundColor: item.is_active ? theme.colors.status.error + '20' : theme.colors.status.success + '20'
              }]}
              onPress={() => handleAction('activate', item)}
            >
              {item.is_active ?
                <UserX size={16} color={theme.colors.status.error} /> :
                <UserCheck size={16} color={theme.colors.status.success} />
              }
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <SharedLayout title="Suppliers">
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: theme.colors.backgroundSecondary }]}
        >
          <Download size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        {hasPermission('suppliers', 'add') && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleAddSupplier}
          >
            <Plus size={20} color={theme.colors.text.inverse} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* KPI Cards */}
        {renderKPICards()}

        {/* Search and Filters */}
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
          <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.input, borderColor: theme.colors.border }]}>
            <Search size={20} color={theme.colors.text.secondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text.primary }]}
              placeholder="Search suppliers..."
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

        {/* Suppliers List */}
        <FlatList
          data={filteredSuppliers}
          renderItem={renderSupplierItem}
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
              <Truck size={48} color={theme.colors.text.muted} />
              <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                No suppliers found
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.text.muted }]}>
                Try adjusting your search or filters
              </Text>
            </View>
          }
        />
      </ScrollView>

      {/* Supplier Add Form */}
      <SupplierAddForm
        visible={showSupplierForm}
        onClose={() => setShowSupplierForm(false)}
        onSubmit={handleSupplierAdded}
      />
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
    marginBottom: 12,
  },
  supplierInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  supplierAvatar: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  supplierDetails: {
    flex: 1,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  companyName: {
    fontSize: 12,
    marginBottom: 4,
  },
  supplierTypeContainer: {
    flexDirection: 'row',
  },
  supplierType: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    textAlign: 'center',
    overflow: 'hidden',
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
  contactInfo: {
    marginBottom: 12,
    gap: 6,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 12,
    flex: 1,
  },
  itemDetails: {
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
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
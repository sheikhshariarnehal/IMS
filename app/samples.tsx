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
  TestTube,
  Package,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  ShoppingCart
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import SharedLayout from '@/components/SharedLayout';
import { Sample, SampleFilters, SampleStatus, SamplePurpose, DeliveryMethod, SampleAnalytics } from '@/types/sample';
import { FormService } from '@/lib/services/formService';

// Mock data removed - now using real database data
const mockSamples: Sample[] = [];

export default function SamplesPage() {
  const { theme } = useTheme();
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'samples' | 'analytics' | 'conversions' | 'costs'>('samples');
  const [samples, setSamples] = useState<Sample[]>([]);
  const [filters, setFilters] = useState<SampleFilters>({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load samples from database
  const loadSamples = async () => {
    try {
      setLoading(true);

      // Fetch sample tracking data from database
      const sampleData = await FormService.getSampleTracking();

      // Transform database samples to UI format
      const transformedSamples: Sample[] = sampleData.map((sample: any) => ({
        id: sample.id.toString(),
        sampleNumber: `SMP-${sample.id.toString().padStart(4, '0')}`,
        sampleName: `${sample.products?.name || 'Unknown Product'} Sample`,
        description: sample.notes || 'Product sample for evaluation',

        customerId: sample.customer_id?.toString() || '',
        customerName: sample.customers?.name || 'Unknown Customer',
        customerPhone: sample.customers?.phone || '',
        customerEmail: sample.customers?.email || '',

        productId: sample.product_id?.toString() || '',
        productName: sample.products?.name || 'Unknown Product',
        productCode: sample.product_code || '',

        quantity: sample.quantity || 0,
        cost: sample.cost || 0,
        purpose: sample.purpose as SamplePurpose || 'Quality Check',

        status: sample.sample_status as SampleStatus || 'requested',
        requestDate: new Date(sample.created_at),
        expectedReturnDate: sample.expected_return_date ? new Date(sample.expected_return_date) : undefined,
        actualReturnDate: sample.actual_return_date ? new Date(sample.actual_return_date) : undefined,

        deliveryAddress: sample.delivery_address || '',
        deliveryMethod: 'courier' as DeliveryMethod,
        deliveryPerson: sample.delivery_person || '',

        conversionSaleId: sample.conversion_sale_id?.toString(),
        conversionAmount: sample.conversion_amount || 0,
        conversionDate: sample.conversion_date ? new Date(sample.conversion_date) : undefined,

        notes: sample.notes || '',
        createdBy: sample.created_by?.toString() || '',
        createdAt: new Date(sample.created_at),
        updatedAt: new Date(sample.updated_at || sample.created_at),
      }));

      setSamples(transformedSamples);
    } catch (error) {
      console.error('Failed to load samples:', error);
      Alert.alert('Error', 'Failed to load samples');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  React.useEffect(() => {
    loadSamples();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSamples();
    setRefreshing(false);
  };

  // Filter samples based on current filters
  const filteredSamples = useMemo(() => {
    return samples.filter(sample => {
      if (filters.search &&
        !sample.sampleName.toLowerCase().includes(filters.search.toLowerCase()) &&
        !sample.sampleNumber.toLowerCase().includes(filters.search.toLowerCase()) &&
        !sample.customerName.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.status && sample.status !== filters.status) {
        return false;
      }
      if (filters.customerId && sample.customerId !== filters.customerId) {
        return false;
      }

      if (filters.purpose && sample.purpose !== filters.purpose) {
        return false;
      }
      if (filters.deliveryMethod && sample.deliveryMethod !== filters.deliveryMethod) {
        return false;
      }
      if (filters.overdueOnly) {
        const isOverdue = sample.status === 'Delivered' &&
          new Date() > sample.expectedReturnDate &&
          !sample.actualReturnDate;
        if (!isOverdue) return false;
      }
      if (filters.convertedOnly && sample.status !== 'Converted to Sale') {
        return false;
      }
      return true;
    });
  }, [samples, filters]);

  // Calculate analytics
  const analytics = useMemo((): SampleAnalytics => {
    const totalSamples = samples.length;
    const activeSamples = samples.filter(s => ['Requested', 'Prepared', 'Delivered'].includes(s.status)).length;
    const deliveredSamples = samples.filter(s => s.status === 'Delivered').length;
    const returnedSamples = samples.filter(s => s.status === 'Returned').length;
    const convertedSamples = samples.filter(s => s.status === 'Converted to Sale').length;
    const overdueSamples = samples.filter(s =>
      s.status === 'Delivered' && new Date() > s.expectedReturnDate && !s.actualReturnDate
    ).length;
    const conversionRate = totalSamples > 0 ? (convertedSamples / totalSamples) * 100 : 0;
    const totalSampleCosts = samples.reduce((sum, s) => sum + s.totalCost, 0);
    const averageCostPerSample = totalSamples > 0 ? totalSampleCosts / totalSamples : 0;
    const revenueFromConversions = samples
      .filter(s => s.conversionToSale)
      .reduce((sum, s) => sum + (s.conversionToSale?.saleAmount || 0), 0);
    const costPerConversion = convertedSamples > 0 ? totalSampleCosts / convertedSamples : 0;

    return {
      totalSamples,
      activeSamples,
      deliveredSamples,
      returnedSamples,
      convertedSamples,
      overdueSamples,
      conversionRate,
      averageCostPerSample,
      totalSampleCosts,
      revenueFromConversions,
      costPerConversion,
    };
  }, [samples]);

  const getStatusColor = (status: SampleStatus) => {
    switch (status) {
      case 'Requested': return theme.colors.status.info;
      case 'Prepared': return theme.colors.status.warning;
      case 'Delivered': return theme.colors.primary;
      case 'Returned': return theme.colors.status.success;
      case 'Converted to Sale': return theme.colors.status.success;
      case 'Lost/Damaged': return theme.colors.status.error;
      case 'Expired': return theme.colors.status.error;
      default: return theme.colors.text.secondary;
    }
  };

  const getStatusIcon = (status: SampleStatus) => {
    switch (status) {
      case 'Requested': return Package;
      case 'Prepared': return Clock;
      case 'Delivered': return Truck;
      case 'Returned': return CheckCircle;
      case 'Converted to Sale': return ShoppingCart;
      case 'Lost/Damaged': return XCircle;
      case 'Expired': return AlertTriangle;
      default: return Package;
    }
  };

  const isOverdue = (sample: Sample) => {
    return sample.status === 'Delivered' &&
      new Date() > sample.expectedReturnDate &&
      !sample.actualReturnDate;
  };

  const getDaysOverdue = (sample: Sample) => {
    if (!isOverdue(sample)) return 0;
    const today = new Date();
    const diffTime = today.getTime() - sample.expectedReturnDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSampleAction = (action: string, sample: Sample) => {
    switch (action) {
      case 'view':
        Alert.alert('View Sample', `Viewing ${sample.sampleName}`);
        break;
      case 'edit':
        if (!hasPermission('samples', 'edit')) {
          Alert.alert('Permission Denied', 'You do not have permission to edit samples.');
          return;
        }
        Alert.alert('Edit Sample', `Editing ${sample.sampleName}`);
        break;
      case 'return':
        if (!hasPermission('samples', 'edit')) {
          Alert.alert('Permission Denied', 'You do not have permission to manage samples.');
          return;
        }
        Alert.alert('Mark as Returned', `Mark ${sample.sampleName} as returned?`);
        break;
      case 'email':
        Alert.alert('Send Email', `Sending sample details to ${sample.customerEmail}`);
        break;
    }
  };

  const renderTabs = () => (
    <View style={[styles.tabContainer, { borderBottomColor: theme.colors.border }]}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'samples' && { borderBottomColor: theme.colors.primary }]}
        onPress={() => setActiveTab('samples')}
      >
        <TestTube size={18} color={activeTab === 'samples' ? theme.colors.primary : theme.colors.text.secondary} />
        <Text style={[
          styles.tabText,
          { color: activeTab === 'samples' ? theme.colors.primary : theme.colors.text.secondary }
        ]}>
          Samples
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'analytics' && { borderBottomColor: theme.colors.primary }]}
        onPress={() => setActiveTab('analytics')}
      >
        <TrendingUp size={18} color={activeTab === 'analytics' ? theme.colors.primary : theme.colors.text.secondary} />
        <Text style={[
          styles.tabText,
          { color: activeTab === 'analytics' ? theme.colors.primary : theme.colors.text.secondary }
        ]}>
          Analytics
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'conversions' && { borderBottomColor: theme.colors.primary }]}
        onPress={() => setActiveTab('conversions')}
      >
        <ShoppingCart size={18} color={activeTab === 'conversions' ? theme.colors.primary : theme.colors.text.secondary} />
        <Text style={[
          styles.tabText,
          { color: activeTab === 'conversions' ? theme.colors.primary : theme.colors.text.secondary }
        ]}>
          Conversions
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'costs' && { borderBottomColor: theme.colors.primary }]}
        onPress={() => setActiveTab('costs')}
      >
        <DollarSign size={18} color={activeTab === 'costs' ? theme.colors.primary : theme.colors.text.secondary} />
        <Text style={[
          styles.tabText,
          { color: activeTab === 'costs' ? theme.colors.primary : theme.colors.text.secondary }
        ]}>
          Costs
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderKPICards = () => (
    <View style={styles.kpiContainer}>
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.kpiIcon, { backgroundColor: theme.colors.primary + '20' }]}>
            <TestTube size={24} color={theme.colors.primary} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>{analytics.totalSamples}</Text>
          <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Total Samples</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.info + '20' }]}>
            <Truck size={24} color={theme.colors.status.info} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>{analytics.deliveredSamples}</Text>
          <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Delivered</Text>
        </View>
      </View>

      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.success + '20' }]}>
            <TrendingUp size={24} color={theme.colors.status.success} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>{analytics.conversionRate.toFixed(1)}%</Text>
          <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Conversion Rate</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.error + '20' }]}>
            <AlertTriangle size={24} color={theme.colors.status.error} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>{analytics.overdueSamples}</Text>
          <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Overdue</Text>
        </View>
      </View>
    </View>
  );

  const renderAnalyticsView = () => (
    <View style={styles.analyticsContainer}>
      <View style={[styles.analyticsCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.analyticsTitle, { color: theme.colors.text.primary }]}>
          Sample Performance
        </Text>
        <View style={styles.analyticsContent}>
          <View style={styles.analyticsRow}>
            <Text style={[styles.analyticsLabel, { color: theme.colors.text.secondary }]}>Conversion Rate:</Text>
            <Text style={[styles.analyticsValue, { color: theme.colors.status.success }]}>
              {analytics.conversionRate.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.analyticsRow}>
            <Text style={[styles.analyticsLabel, { color: theme.colors.text.secondary }]}>Avg Cost per Sample:</Text>
            <Text style={[styles.analyticsValue, { color: theme.colors.text.primary }]}>
              ৳{analytics.averageCostPerSample.toLocaleString()}
            </Text>
          </View>
          <View style={styles.analyticsRow}>
            <Text style={[styles.analyticsLabel, { color: theme.colors.text.secondary }]}>Cost per Conversion:</Text>
            <Text style={[styles.analyticsValue, { color: theme.colors.text.primary }]}>
              ৳{analytics.costPerConversion.toLocaleString()}
            </Text>
          </View>
          <View style={styles.analyticsRow}>
            <Text style={[styles.analyticsLabel, { color: theme.colors.text.secondary }]}>Revenue from Conversions:</Text>
            <Text style={[styles.analyticsValue, { color: theme.colors.status.success }]}>
              ৳{analytics.revenueFromConversions.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.analyticsCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.analyticsTitle, { color: theme.colors.text.primary }]}>
          Sample Status Distribution
        </Text>
        <View style={styles.analyticsContent}>
          {[
            { label: 'Active Samples', value: analytics.activeSamples, color: theme.colors.primary },
            { label: 'Delivered', value: analytics.deliveredSamples, color: theme.colors.status.info },
            { label: 'Returned', value: analytics.returnedSamples, color: theme.colors.status.success },
            { label: 'Converted', value: analytics.convertedSamples, color: theme.colors.status.success },
            { label: 'Overdue', value: analytics.overdueSamples, color: theme.colors.status.error },
          ].map((item, index) => (
            <View key={index} style={styles.statusDistributionRow}>
              <View style={styles.statusDistributionLeft}>
                <View style={[styles.statusDot, { backgroundColor: item.color }]} />
                <Text style={[styles.analyticsLabel, { color: theme.colors.text.secondary }]}>{item.label}:</Text>
              </View>
              <Text style={[styles.analyticsValue, { color: theme.colors.text.primary }]}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderPlaceholderView = (title: string, subtitle: string) => (
    <View style={styles.placeholderContainer}>
      <TestTube size={48} color={theme.colors.text.muted} />
      <Text style={[styles.placeholderTitle, { color: theme.colors.text.secondary }]}>
        {title}
      </Text>
      <Text style={[styles.placeholderSubtitle, { color: theme.colors.text.muted }]}>
        {subtitle}
      </Text>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'samples':
        return (
          <FlatList
            data={filteredSamples}
            renderItem={renderSampleCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.samplesContainer}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <TestTube size={48} color={theme.colors.text.muted} />
                <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                  No samples found
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.colors.text.muted }]}>
                  Try adjusting your search or filters
                </Text>
              </View>
            }
          />
        );
      case 'analytics':
        return renderAnalyticsView();
      case 'conversions':
        return renderPlaceholderView('Sample Conversions', 'Conversion tracking interface coming soon...');
      case 'costs':
        return renderPlaceholderView('Cost Analysis', 'Cost analysis and breakdown interface coming soon...');
      default:
        return null;
    }
  };

  const renderSampleCard = ({ item: sample }: { item: Sample }) => {
    const StatusIcon = getStatusIcon(sample.status);

    return (
      <View style={[styles.sampleCard, {
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border,
        borderLeftColor: isOverdue(sample) ? theme.colors.status.error : theme.colors.border,
        borderLeftWidth: isOverdue(sample) ? 4 : 1,
      }]}>
        <View style={styles.sampleHeader}>
          <View style={styles.sampleInfo}>
            <Text style={[styles.sampleTitle, { color: theme.colors.text.primary }]} numberOfLines={2}>
              {sample.sampleName}
            </Text>
            <Text style={[styles.sampleNumber, { color: theme.colors.text.secondary }]}>
              {sample.sampleNumber}
            </Text>
            {isOverdue(sample) && (
              <Text style={[styles.overdueText, { color: theme.colors.status.error }]}>
                {getDaysOverdue(sample)} days overdue
              </Text>
            )}
          </View>
          <View style={styles.statusContainer}>
            <StatusIcon size={12} color={getStatusColor(sample.status)} />
            <Text style={[styles.statusText, { color: getStatusColor(sample.status) }]}>
              {sample.status}
            </Text>
          </View>
        </View>

        <View style={styles.sampleDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Customer:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary }]} numberOfLines={1}>
              {sample.customerName}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Purpose:</Text>
            <Text style={[styles.purposeBadge, {
              color: theme.colors.primary,
              backgroundColor: theme.colors.primary + '20'
            }]}>
              {sample.purpose}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Quantity:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.primary }]}>
              {sample.quantity}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Purpose:</Text>
            <Text style={[styles.purposeBadge, {
              color: theme.colors.primary,
              backgroundColor: theme.colors.primary + '20'
            }]}>
              {sample.purpose}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Expected Return:</Text>
            <Text style={[
              styles.detailValue,
              { color: isOverdue(sample) ? theme.colors.status.error : theme.colors.text.primary }
            ]}>
              {sample.expectedReturnDate.toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Total Cost:</Text>
            <View style={styles.costContainer}>
              <Text style={[styles.costValue, { color: theme.colors.primary }]}>
                ৳{sample.totalCost.toLocaleString()}
              </Text>
              {sample.conversionToSale && (
                <View style={styles.conversionInfo}>
                  <ShoppingCart size={10} color={theme.colors.status.success} />
                  <Text style={[styles.conversionText, { color: theme.colors.status.success }]}>
                    ৳{sample.conversionToSale.saleAmount.toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.sampleActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.status.info + '20' }]}
            onPress={() => handleSampleAction('view', sample)}
          >
            <Eye size={16} color={theme.colors.status.info} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary + '20' }]}
            onPress={() => handleSampleAction('email', sample)}
          >
            <Mail size={16} color={theme.colors.primary} />
          </TouchableOpacity>

          {hasPermission('samples', 'edit') && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.status.warning + '20' }]}
                onPress={() => handleSampleAction('edit', sample)}
              >
                <Edit size={16} color={theme.colors.status.warning} />
              </TouchableOpacity>

              {sample.status === 'Delivered' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.colors.status.success + '20' }]}
                  onPress={() => handleSampleAction('return', sample)}
                >
                  <RotateCcw size={16} color={theme.colors.status.success} />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <SharedLayout title="Sample Tracking">
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: theme.colors.backgroundSecondary }]}
        >
          <Download size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        {hasPermission('samples', 'add') && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => Alert.alert('Add Sample', 'Add new sample functionality')}
          >
            <Plus size={20} color={theme.colors.text.inverse} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* KPI Cards */}
        {renderKPICards()}

        {/* Tabs */}
        {renderTabs()}

        {/* Search and Filters - Only show for samples tab */}
        {activeTab === 'samples' && (
          <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.input, borderColor: theme.colors.border }]}>
              <Search size={20} color={theme.colors.text.secondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.colors.text.primary }]}
                placeholder="Search samples..."
                placeholderTextColor={theme.colors.text.muted}
                value={filters.search || ''}
                onChangeText={(text) => setFilters(prev => ({ ...prev, search: text }))}
              />
            </View>
            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: theme.colors.backgroundSecondary }]}
              onPress={() => {
                setFilters(prev => ({ ...prev, overdueOnly: !prev.overdueOnly }));
              }}
            >
              <Filter size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Tab Content */}
        {renderTabContent()}
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
  samplesContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 100, // Extra padding at bottom for better scrolling
  },
  sampleCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sampleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sampleInfo: {
    flex: 1,
    marginRight: 8,
  },
  sampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sampleNumber: {
    fontSize: 12,
    marginBottom: 4,
  },
  overdueText: {
    fontSize: 12,
    fontWeight: '500',
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
  sampleDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  purposeBadge: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  costContainer: {
    alignItems: 'flex-end',
  },
  costValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  conversionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  conversionText: {
    fontSize: 10,
    fontWeight: '600',
  },
  sampleActions: {
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
  analyticsContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 100, // Extra padding at bottom for better scrolling
  },
  analyticsCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  analyticsContent: {
    gap: 12,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analyticsLabel: {
    fontSize: 14,
  },
  analyticsValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusDistributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusDistributionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 16,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  placeholderSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
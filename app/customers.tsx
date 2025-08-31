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
  Users,
  Crown,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Clock,
  UserX,
  UserCheck,
  Star,
  Package,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import SharedLayout from '@/components/SharedLayout';
import CustomerAddForm from '@/components/forms/CustomerAddForm';
import { FormService } from '@/lib/services/formService';
import type { Customer as DBCustomer } from '@/lib/supabase';

// Customer interface for UI (extends database Customer)
interface Customer extends DBCustomer {
  payment_status: 'good' | 'warning' | 'overdue' | 'red_listed';
  credit_limit: number;
  current_balance: number;
  total_sales: number;
  total_orders: number;
  last_order_date?: string;
  last_payment_date?: string;
  is_active: boolean;
  notes?: string;
  created_by?: string;
  updated_by?: string;
  total_spent: number;
  average_order_value: number;
  purchase_frequency: number;
  outstanding_amount: number;
  days_past_due: number;
  payment_terms: number;
}

interface PurchaseHistory {
  id: string;
  customerId: string;
  saleId: string;
  saleNumber: string;
  purchaseDate: Date;
  products: {
    productId: string;
    productName: string;
    productCode: string;
    category: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: 'good' | 'warning' | 'overdue' | 'red_listed';
  dueDate?: Date;
  paidAmount: number;
  remainingAmount: number;
  notes: string;
}

interface CustomerFilters {
  search?: string;
  customer_type?: 'vip' | 'regular' | 'wholesale';
  payment_status?: 'good' | 'warning' | 'overdue' | 'red_listed';
  is_red_listed?: boolean;
  is_active?: boolean;
}

// Mock purchase history data for UI demo
const mockPurchaseHistory: PurchaseHistory[] = [
  {
    id: '1',
    customerId: '1',
    saleId: 'SAL-2025-001',
    saleNumber: 'SAL-2025-001',
    purchaseDate: new Date('2025-01-05'),
    products: [
      {
        productId: '1',
        productName: 'Premium Velvet Sofa Fabric',
        productCode: '#LWIL02012',
        category: 'Sofa Fabrics',
        quantity: 50,
        unitPrice: 1200,
        totalPrice: 60000,
      }
    ],
    subtotal: 60000,
    discountAmount: 3000,
    taxAmount: 5700,
    totalAmount: 62700,
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'good',
    paidAmount: 62700,
    remainingAmount: 0,
    notes: 'Premium customer order',
  },
  {
    id: '2',
    customerId: '2',
    saleId: 'SAL-2025-002',
    saleNumber: 'SAL-2025-002',
    purchaseDate: new Date('2025-01-08'),
    products: [
      {
        productId: '2',
        productName: 'Silk Curtain Material',
        productCode: '#LWIL02013',
        category: 'Curtains',
        quantity: 30,
        unitPrice: 800,
        totalPrice: 24000,
      }
    ],
    subtotal: 24000,
    discountAmount: 0,
    taxAmount: 2400,
    totalAmount: 26400,
    paymentMethod: 'Cash',
    paymentStatus: 'warning',
    dueDate: new Date('2025-01-23'),
    paidAmount: 0,
    remainingAmount: 26400,
    notes: 'Payment pending',
  },
  {
    id: '2',
    customerId: '2',
    saleId: 'SAL-2025-002',
    saleNumber: 'SAL-2025-002',
    purchaseDate: new Date('2025-01-08'),
    products: [
      {
        productId: '2',
        productName: 'Silk Curtain Material',
        productCode: '#LWIL02013',
        category: 'Curtains',
        quantity: 30,
        unitPrice: 800,
        totalPrice: 24000,
      }
    ],
    subtotal: 24000,
    discountAmount: 0,
    taxAmount: 2400,
    totalAmount: 26400,
    paymentMethod: 'Cash',
    paymentStatus: 'warning',
    dueDate: new Date('2025-01-23'),
    paidAmount: 0,
    remainingAmount: 26400,
    notes: 'Payment pending',
  },
];

export default function CustomersPage() {
  const { theme } = useTheme();
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'customers' | 'purchase-history' | 'red-list' | 'top-customers'>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [redListCustomers, setRedListCustomers] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [refreshing, setRefreshing] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load customers from database
  const loadCustomers = async () => {
    try {
      setLoading(true);

      // Load all customers
      const customersData = await FormService.getCustomers();

      // Transform database customers to UI format
      const transformedCustomers: Customer[] = customersData.map((customer: DBCustomer) => ({
        ...customer,
        id: customer.id.toString(),
        payment_status: customer.red_list_status ? 'red_listed' :
                       customer.total_due && customer.total_due > 0 ? 'warning' : 'good',
        credit_limit: 50000, // Default credit limit
        current_balance: customer.total_due || 0,
        total_sales: customer.total_purchases || 0,
        total_orders: 0, // Will be calculated from sales
        is_active: true,
        total_spent: customer.total_purchases || 0,
        average_order_value: 0, // Will be calculated
        purchase_frequency: 0, // Will be calculated
        outstanding_amount: customer.total_due || 0,
        days_past_due: 0, // Will be calculated
        payment_terms: 30, // Default payment terms
      }));

      setCustomers(transformedCustomers);

      // Load red list customers
      const redListData = await FormService.getRedListCustomers();
      setRedListCustomers(redListData);

      // Load purchase history (sales summary)
      const salesData = await FormService.getSalesSummary();
      const transformedHistory: PurchaseHistory[] = salesData.map((sale: any) => ({
        id: sale.id.toString(),
        customerId: sale.customer_id?.toString() || '',
        saleId: sale.id.toString(),
        saleNumber: sale.sale_number,
        purchaseDate: new Date(sale.created_at),
        products: [], // Will be loaded separately if needed
        subtotal: parseFloat(sale.total_amount || '0'),
        discountAmount: parseFloat(sale.discount_amount || '0'),
        taxAmount: 0,
        totalAmount: parseFloat(sale.total_amount || '0'),
        paymentMethod: sale.payment_method || 'cash',
        paymentStatus: sale.payment_status === 'paid' ? 'good' :
                      sale.payment_status === 'overdue' ? 'overdue' : 'warning',
        dueDate: sale.due_date ? new Date(sale.due_date) : undefined,
        paidAmount: parseFloat(sale.paid_amount || '0'),
        remainingAmount: parseFloat(sale.due_amount || '0'),
        notes: ''
      }));

      setPurchaseHistory(transformedHistory);

    } catch (error) {
      console.error('Failed to load customers:', error);
      Alert.alert('Error', 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      if (filters.search &&
        !customer.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !(customer.email?.toLowerCase().includes(filters.search.toLowerCase())) &&
        !(customer.phone?.includes(filters.search))) {
        return false;
      }
      if (filters.customer_type && customer.customer_type !== filters.customer_type) {
        return false;
      }
      if (filters.payment_status && customer.payment_status !== filters.payment_status) {
        return false;
      }
      if (filters.is_red_listed !== undefined && customer.is_red_listed !== filters.is_red_listed) {
        return false;
      }
      if (filters.is_active !== undefined && customer.is_active !== filters.is_active) {
        return false;
      }
      return true;
    });
  }, [customers, filters]);

  const analytics = useMemo(() => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.is_active).length;
    const vipCustomers = customers.filter(c => c.customer_type === 'vip').length;
    const redListedCustomers = customers.filter(c => c.is_red_listed).length;
    const averageCreditLimit = customers.reduce((sum, c) => sum + c.credit_limit, 0) / (totalCustomers || 1);
    const topCustomersByCredit = [...customers].sort((a, b) => b.credit_limit - a.credit_limit).slice(0, 5);

    return {
      totalCustomers,
      activeCustomers,
      vipCustomers,
      redListedCustomers,
      averageCustomerValue: averageCreditLimit,
      topCustomersByRevenue: topCustomersByCredit,
    };
  }, [customers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return theme.colors.status.success;
      case 'warning': return theme.colors.status.warning;
      case 'overdue': return theme.colors.status.error;
      case 'red_listed': return theme.colors.status.error;
      default: return theme.colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'overdue': return Clock;
      case 'red_listed': return XCircle;
      default: return Clock;
    }
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'vip': return theme.colors.status.warning;
      case 'wholesale': return theme.colors.primary;
      case 'regular': return theme.colors.status.info;
      default: return theme.colors.text.secondary;
    }
  };

  const handleAction = (action: string, item: any) => {
    switch (action) {
      case 'view':
        Alert.alert('View Details', `Viewing details for ${item.name || item.saleNumber}`);
        break;
      case 'edit':
        if (!hasPermission('customers', 'edit')) {
          Alert.alert('Permission Denied', 'You do not have permission to edit customers.');
          return;
        }
        Alert.alert('Edit Customer', `Editing ${item.name || item.saleNumber}`);
        break;
      case 'redlist':
        if (!hasPermission('customers', 'edit')) {
          Alert.alert('Permission Denied', 'You do not have permission to manage red list.');
          return;
        }
        const action = item.is_red_listed ? 'Remove from' : 'Add to';
        Alert.alert(`${action} Red List`, `${action} red list for ${item.name}`);
        break;
      case 'reminder':
        Alert.alert('Send Reminder', `Sending payment reminder to ${item.name}`);
        break;
    }
  };

  const handleAddCustomer = () => {
    if (!hasPermission('customers', 'add')) {
      Alert.alert('Permission Denied', 'You do not have permission to add customers.');
      return;
    }
    setShowCustomerForm(true);
  };

  const handleCustomerSubmit = async (data: any) => {
    console.log('Customer form submitted:', data);
    setShowCustomerForm(false);
    // Reload customers to show the new one
    await loadCustomers();
  };

  const renderKPICards = () => (
    <View style={styles.kpiContainer}>
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.kpiIcon, { backgroundColor: theme.colors.primary + '20' }]}>
            <Users size={24} color={theme.colors.primary} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>{analytics.totalCustomers}</Text>
          <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Total Customers</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.warning + '20' }]}>
            <Crown size={24} color={theme.colors.status.warning} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>{analytics.vipCustomers}</Text>
          <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>VIP Customers</Text>
        </View>
      </View>

      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.error + '20' }]}>
            <AlertTriangle size={24} color={theme.colors.status.error} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>{analytics.redListedCustomers}</Text>
          <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Red Listed</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.success + '20' }]}>
            <DollarSign size={24} color={theme.colors.status.success} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>৳{Math.round(analytics.averageCustomerValue).toLocaleString()}</Text>
          <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Avg Customer Value</Text>
        </View>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={[styles.tabContainer, { borderBottomColor: theme.colors.border }]}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'customers' && { borderBottomColor: theme.colors.primary }]}
        onPress={() => setActiveTab('customers')}
      >
        <Users size={16} color={activeTab === 'customers' ? theme.colors.primary : theme.colors.text.secondary} />
        <Text style={[
          styles.tabText,
          { color: activeTab === 'customers' ? theme.colors.primary : theme.colors.text.secondary }
        ]}>
          All
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'purchase-history' && { borderBottomColor: theme.colors.primary }]}
        onPress={() => setActiveTab('purchase-history')}
      >
        <Package size={16} color={activeTab === 'purchase-history' ? theme.colors.primary : theme.colors.text.secondary} />
        <Text style={[
          styles.tabText,
          { color: activeTab === 'purchase-history' ? theme.colors.primary : theme.colors.text.secondary }
        ]}>
          History
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'red-list' && { borderBottomColor: theme.colors.primary }]}
        onPress={() => setActiveTab('red-list')}
      >
        <AlertTriangle size={16} color={activeTab === 'red-list' ? theme.colors.primary : theme.colors.text.secondary} />
        <Text style={[
          styles.tabText,
          { color: activeTab === 'red-list' ? theme.colors.primary : theme.colors.text.secondary }
        ]}>
          Red List
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'top-customers' && { borderBottomColor: theme.colors.primary }]}
        onPress={() => setActiveTab('top-customers')}
      >
        <Star size={16} color={activeTab === 'top-customers' ? theme.colors.primary : theme.colors.text.secondary} />
        <Text style={[
          styles.tabText,
          { color: activeTab === 'top-customers' ? theme.colors.primary : theme.colors.text.secondary }
        ]}>
          Top
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCustomerItem = ({ item }: { item: Customer }) => {
    const StatusIcon = getStatusIcon(item.payment_status);

    return (
      <View style={[styles.itemCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.itemHeader}>
          <View style={styles.customerAvatar}>
            <View style={[
              styles.avatar,
              { backgroundColor: item.is_red_listed ? theme.colors.status.error : getCustomerTypeColor(item.customer_type) }
            ]}>
              <Text style={[styles.avatarText, { color: theme.colors.text.inverse }]}>
                {item.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={[
                styles.customerName,
                { color: item.is_red_listed ? theme.colors.status.error : theme.colors.text.primary }
              ]}>
                {item.name}
                {item.is_red_listed && (
                  <Text style={[styles.redListBadge, { color: theme.colors.status.error }]}>
                    {' '}[RED LIST]
                  </Text>
                )}
              </Text>
              <View style={styles.customerTypeContainer}>
                <Text style={[
                  styles.customerType,
                  {
                    color: getCustomerTypeColor(item.customer_type),
                    backgroundColor: getCustomerTypeColor(item.customer_type) + '20'
                  }
                ]}>
                  {item.customer_type === 'vip' && '👑 '}
                  {item.customer_type.charAt(0).toUpperCase() + item.customer_type.slice(1)}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <StatusIcon size={12} color={getStatusColor(item.payment_status)} />
            <Text style={[styles.statusText, { color: getStatusColor(item.payment_status) }]}>
              {item.payment_status}
            </Text>
          </View>
        </View>

        <View style={styles.contactInfo}>
          {item.phone && (
            <View style={styles.contactItem}>
              <Phone size={12} color={theme.colors.text.muted} />
              <Text style={[styles.contactText, { color: theme.colors.text.muted }]}>
                {item.phone}
              </Text>
            </View>
          )}
          {item.email && (
            <View style={styles.contactItem}>
              <Mail size={12} color={theme.colors.text.muted} />
              <Text style={[styles.contactText, { color: theme.colors.text.muted }]} numberOfLines={1}>
                {item.email}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Credit Limit</Text>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                ৳{item.credit_limit.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Payment Terms</Text>
              <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                {item.payment_terms} days
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Outstanding</Text>
              <Text style={[
                styles.statValue,
                { color: item.outstanding_amount > 0 ? theme.colors.status.error : theme.colors.status.success }
              ]}>
                ৳{item.outstanding_amount.toLocaleString()}
              </Text>
            </View>
          </View>

          {item.days_past_due > 0 && (
            <View style={styles.overdueContainer}>
              <AlertTriangle size={12} color={theme.colors.status.error} />
              <Text style={[styles.overdueText, { color: theme.colors.status.error }]}>
                {item.days_past_due} days overdue
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Created:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
              {new Date(item.created_at).toLocaleDateString()}
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

          {hasPermission('customers', 'edit') && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.status.warning + '20' }]}
                onPress={() => handleAction('edit', item)}
              >
                <Edit size={16} color={theme.colors.status.warning} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, {
                  backgroundColor: item.is_red_listed ? theme.colors.status.success + '20' : theme.colors.status.error + '20'
                }]}
                onPress={() => handleAction('redlist', item)}
              >
                {item.is_red_listed ?
                  <UserCheck size={16} color={theme.colors.status.success} /> :
                  <UserX size={16} color={theme.colors.status.error} />
                }
              </TouchableOpacity>
            </>
          )}

          {item.outstanding_amount > 0 && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary + '20' }]}
              onPress={() => handleAction('reminder', item)}
            >
              <Clock size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderPurchaseHistoryItem = ({ item }: { item: PurchaseHistory }) => {
    const customer = customers.find(c => c.id === item.customerId);
    const StatusIcon = getStatusIcon(item.paymentStatus);

    return (
      <View style={[styles.itemCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: theme.colors.text.primary }]}>
              {item.saleNumber}
            </Text>
            <Text style={[styles.itemCode, { color: theme.colors.text.secondary }]}>
              {customer?.name}
            </Text>
            <View style={styles.customerTypeContainer}>
              <Text style={[
                styles.customerType,
                {
                  color: getCustomerTypeColor(customer?.customer_type || 'regular'),
                  backgroundColor: getCustomerTypeColor(customer?.customer_type || 'regular') + '20'
                }
              ]}>
                {customer?.customer_type || 'regular'}
              </Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <StatusIcon size={12} color={getStatusColor(item.paymentStatus)} />
            <Text style={[styles.statusText, { color: getStatusColor(item.paymentStatus) }]}>
              {item.paymentStatus}
            </Text>
          </View>
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Date:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
              {item.purchaseDate.toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Products:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
              {item.products.length} item(s)
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Amount:</Text>
            <Text style={[styles.amountValue, { color: theme.colors.primary }]}>
              ৳{item.totalAmount.toLocaleString()}
            </Text>
          </View>

          {item.discountAmount > 0 && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Discount:</Text>
              <Text style={[styles.discountValue, { color: theme.colors.status.success }]}>
                -৳{item.discountAmount.toLocaleString()}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Outstanding:</Text>
            <Text style={[
              styles.detailValue,
              { color: item.remainingAmount > 0 ? theme.colors.status.error : theme.colors.status.success }
            ]}>
              ৳{item.remainingAmount.toLocaleString()}
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
        </View>
      </View>
    );
  };

  type CustomerItem = Customer | PurchaseHistory;

  const getCurrentData = (): CustomerItem[] => {
    switch (activeTab) {
      case 'customers':
        return filteredCustomers;
      case 'purchase-history':
        return purchaseHistory;
      case 'red-list':
        return redListCustomers.map((customer: any) => ({
          ...customer,
          id: customer.customer_id.toString(),
          name: customer.customer_name,
          payment_status: 'red_listed' as const,
          is_red_listed: true,
          outstanding_amount: customer.total_due || 0,
          days_past_due: customer.overdue_count || 0,
        }));
      case 'top-customers':
        return analytics.topCustomersByRevenue;
      default:
        return [];
    }
  };

  const renderCustomersItem = ({ item }: { item: CustomerItem }) => {
    if ('saleNumber' in item) {
      return renderPurchaseHistoryItem({ item: item as PurchaseHistory });
    } else {
      return renderCustomerItem({ item: item as Customer });
    }
  };

  return (
    <SharedLayout title="Customers">
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: theme.colors.backgroundSecondary }]}
        >
          <Download size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        {hasPermission('customers', 'add') && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleAddCustomer}
          >
            <Plus size={20} color={theme.colors.text.inverse} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
            Loading customers...
          </Text>
        </View>
      ) : (
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
              placeholder="Search customers..."
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

        {/* Red List Warning */}
        {activeTab === 'red-list' && (
          <View style={[styles.warningContainer, {
            backgroundColor: theme.colors.status.error + '10',
            borderColor: theme.colors.status.error + '30'
          }]}>
            <View style={styles.warningHeader}>
              <AlertTriangle size={20} color={theme.colors.status.error} />
              <Text style={[styles.warningTitle, { color: theme.colors.status.error }]}>
                Red Listed Customers ({customers.filter(c => c.is_red_listed).length})
              </Text>
            </View>
            <Text style={[styles.warningText, { color: theme.colors.text.secondary }]}>
              Customers with payments overdue for more than 60 days require immediate attention.
            </Text>
          </View>
        )}

        {/* Data List */}
        <FlatList<CustomerItem>
          data={getCurrentData()}
          renderItem={renderCustomersItem}
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
              <Users size={48} color={theme.colors.text.muted} />
              <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                No {activeTab.replace('-', ' ')} found
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.text.muted }]}>
                Try adjusting your search or filters
              </Text>
            </View>
          }
        />
      </ScrollView>
      )}

      {/* Customer Add Form */}
      <CustomerAddForm
        visible={showCustomerForm}
        onClose={() => setShowCustomerForm(false)}
        onSubmit={handleCustomerSubmit}
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
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 12,
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
  warningContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 14,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  customerAvatar: {
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
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  redListBadge: {
    fontSize: 10,
    fontWeight: '700',
  },
  customerTypeContainer: {
    flexDirection: 'row',
  },
  customerType: {
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
    gap: 4,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  overdueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  overdueText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  discountValue: {
    fontSize: 12,
    fontWeight: '600',
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
    fontSize: 14,
    marginBottom: 6,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
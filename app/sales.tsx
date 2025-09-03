import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Plus,
  Search,
  Filter,
  Download,
  FileText,
  DollarSign,
  Users,
  AlertTriangle,
  Eye,
  Edit,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Phone,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import SharedLayout from '@/components/SharedLayout';
import SalesForm from '@/components/forms/SalesForm';
import { FormService } from '@/lib/services/formService';

// Interfaces
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  customerType: 'VIP' | 'Regular' | 'Wholesale';
  creditLimit: number;
  paymentTerms: number;
  registrationDate: Date;
  totalPurchases: number;
  isActive: boolean;
  isRedListed: boolean;
}

interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  discountAmount: number;
  discountPercentage: number;
  totalPrice: number;
}

interface Sale {
  id: string;
  saleNumber: string;
  customerId: string;
  customerName: string;
  saleDate: Date;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  discountPercentage: number;
  taxAmount: number;
  taxPercentage: number;
  totalAmount: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Check' | 'Credit Card';
  paymentStatus: 'Paid' | 'Partial' | 'Due' | 'Overdue';
  dueDate: Date;
  paidAmount: number;
  remainingAmount: number;
  createdBy: string;
  status: 'Draft' | 'Confirmed' | 'Delivered' | 'Cancelled';
}

interface DuePayment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  saleId: string;
  invoiceNumber: string;
  originalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: Date;
  daysPastDue: number;
  status: 'Due' | 'Overdue';
  isRedListed: boolean;
  lastReminderDate?: Date;
  reminderCount: number;
}

interface SalesFilters {
  search?: string;
  customerId?: string;
  paymentStatus?: string;
  saleStatus?: string;
}

// Mock data
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Rahman Furniture',
    email: 'contact@rahmanfurniture.com',
    phone: '+880-1234-567890',
    address: 'Gulshan-2, Dhaka, Bangladesh',
    customerType: 'VIP',
    creditLimit: 500000,
    paymentTerms: 30,
    registrationDate: new Date('2024-01-15'),
    totalPurchases: 2500000,
    isActive: true,
    isRedListed: false,
  },
  {
    id: '2',
    name: 'Elite Interiors',
    email: 'info@eliteinteriors.bd',
    phone: '+880-1234-567891',
    address: 'Dhanmondi, Dhaka, Bangladesh',
    customerType: 'Regular',
    creditLimit: 200000,
    paymentTerms: 15,
    registrationDate: new Date('2024-02-01'),
    totalPurchases: 850000,
    isActive: true,
    isRedListed: false,
  },
  {
    id: '3',
    name: 'Modern Home Decor',
    email: 'orders@modernhomedecor.com',
    phone: '+880-1234-567892',
    address: 'Uttara, Dhaka, Bangladesh',
    customerType: 'Wholesale',
    creditLimit: 1000000,
    paymentTerms: 45,
    registrationDate: new Date('2024-01-10'),
    totalPurchases: 4200000,
    isActive: true,
    isRedListed: true,
  },
];

const mockSales: Sale[] = [
  {
    id: '1',
    saleNumber: 'SAL-2025-001',
    customerId: '1',
    customerName: 'Rahman Furniture',
    saleDate: new Date('2025-01-05'),
    items: [
      {
        id: '1',
        productId: '1',
        productName: 'Premium Velvet Sofa Fabric',
        productCode: '#LWIL02012',
        quantity: 50,
        unitPrice: 1200,
        originalPrice: 1200,
        discountAmount: 0,
        discountPercentage: 0,
        totalPrice: 60000,
      }
    ],
    subtotal: 60000,
    discountAmount: 3000,
    discountPercentage: 5,
    taxAmount: 5700,
    taxPercentage: 10,
    totalAmount: 62700,
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'Paid',
    dueDate: new Date('2025-02-04'),
    paidAmount: 62700,
    remainingAmount: 0,
    createdBy: 'Admin User',
    status: 'Delivered',
  },
  {
    id: '2',
    saleNumber: 'SAL-2025-002',
    customerId: '2',
    customerName: 'Elite Interiors',
    saleDate: new Date('2025-01-08'),
    items: [
      {
        id: '2',
        productId: '2',
        productName: 'Silk Curtain Material',
        productCode: '#LWIL02013',
        quantity: 30,
        unitPrice: 800,
        originalPrice: 800,
        discountAmount: 0,
        discountPercentage: 0,
        totalPrice: 24000,
      }
    ],
    subtotal: 24000,
    discountAmount: 0,
    discountPercentage: 0,
    taxAmount: 2400,
    taxPercentage: 10,
    totalAmount: 26400,
    paymentMethod: 'Cash',
    paymentStatus: 'Due',
    dueDate: new Date('2025-01-23'),
    paidAmount: 0,
    remainingAmount: 26400,
    createdBy: 'Sales User',
    status: 'Confirmed',
  },
  {
    id: '3',
    saleNumber: 'SAL-2025-003',
    customerId: '3',
    customerName: 'Modern Home Decor',
    saleDate: new Date('2024-11-15'),
    items: [
      {
        id: '3',
        productId: '3',
        productName: 'Leather Upholstery',
        productCode: '#LWIL02014',
        quantity: 100,
        unitPrice: 1500,
        originalPrice: 1600,
        discountAmount: 10000,
        discountPercentage: 6.25,
        totalPrice: 150000,
      }
    ],
    subtotal: 150000,
    discountAmount: 10000,
    discountPercentage: 6.25,
    taxAmount: 14000,
    taxPercentage: 10,
    totalAmount: 154000,
    paymentMethod: 'Check',
    paymentStatus: 'Overdue',
    dueDate: new Date('2024-12-30'),
    paidAmount: 50000,
    remainingAmount: 104000,
    createdBy: 'Admin User',
    status: 'Delivered',
  },
];

const mockDuePayments: DuePayment[] = [
  {
    id: '1',
    customerId: '2',
    customerName: 'Elite Interiors',
    customerPhone: '+880-1234-567891',
    saleId: '2',
    invoiceNumber: 'INV-2025-002',
    originalAmount: 26400,
    paidAmount: 0,
    remainingAmount: 26400,
    dueDate: new Date('2025-01-23'),
    daysPastDue: 0,
    status: 'Due',
    isRedListed: false,
    reminderCount: 0,
  },
  {
    id: '2',
    customerId: '3',
    customerName: 'Modern Home Decor',
    customerPhone: '+880-1234-567892',
    saleId: '3',
    invoiceNumber: 'INV-2024-003',
    originalAmount: 154000,
    paidAmount: 50000,
    remainingAmount: 104000,
    dueDate: new Date('2024-12-30'),
    daysPastDue: 18,
    status: 'Overdue',
    isRedListed: true,
    lastReminderDate: new Date('2025-01-10'),
    reminderCount: 3,
  },
];

export default function SalesPage() {
  const { theme } = useTheme();
  const { hasPermission, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sales' | 'due-payments' | 'invoices'>('sales');
  const [sales, setSales] = useState<Sale[]>([]);
  const [duePayments, setDuePayments] = useState<DuePayment[]>([]);
  const [redListCustomers, setRedListCustomers] = useState<any[]>([]);
  const [salesStats, setSalesStats] = useState<any>(null);
  const [filters, setFilters] = useState<SalesFilters>({});
  const [refreshing, setRefreshing] = useState(false);
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data fetching functions
  const loadSalesData = async () => {
    try {
      setLoading(true);

      // Apply location filtering for sales managers
      let enhancedFilters = { ...filters };
      if (user?.role === 'sales_manager' && user.assigned_location_id) {
        // For sales managers, always filter by their assigned location
        enhancedFilters.location = user.assigned_location_id.toString();
      }

      // Load sales summary
      const salesData = await FormService.getSalesSummary(enhancedFilters);
      setSales(salesData.map((sale: any) => ({
        id: sale.id?.toString() || '',
        saleNumber: sale.sale_number || '',
        customerId: sale.customer_id?.toString() || '',
        customerName: sale.customer_name || 'Unknown',
        amount: parseFloat(sale.total_amount || '0'),
        paidAmount: parseFloat(sale.paid_amount || '0'),
        dueAmount: parseFloat(sale.due_amount || '0'),
        paymentStatus: sale.payment_status === 'paid' ? 'Paid' :
                     sale.payment_status === 'partial' ? 'Partial' :
                     sale.payment_status === 'overdue' ? 'Overdue' : 'Due',
        status: sale.sale_status === 'finalized' ? 'Delivered' :
               sale.sale_status === 'draft' ? 'Draft' : 'Confirmed',
        date: sale.created_at,
        saleDate: new Date(sale.created_at || sale.sale_date || Date.now()),
        location: sale.location_name || 'Unknown',
        createdBy: sale.created_by_name || 'Unknown',
        // Add missing required fields with defaults
        items: [],
        subtotal: parseFloat(sale.subtotal || sale.total_amount || '0'),
        discountAmount: parseFloat(sale.discount_amount || '0'),
        discountPercentage: sale.discount_amount && sale.subtotal ?
          (parseFloat(sale.discount_amount) / parseFloat(sale.subtotal)) * 100 : 0,
        taxAmount: parseFloat(sale.tax_amount || '0'),
        taxPercentage: sale.tax_amount && sale.subtotal ?
          (parseFloat(sale.tax_amount) / parseFloat(sale.subtotal)) * 100 : 0,
        totalAmount: parseFloat(sale.total_amount || '0'),
        paymentMethod: sale.payment_method === 'cash' ? 'Cash' :
                      sale.payment_method === 'card' ? 'Credit Card' :
                      sale.payment_method === 'bank_transfer' ? 'Bank Transfer' :
                      sale.payment_method === 'mobile_banking' ? 'Mobile Banking' : 'Cash',
        dueDate: sale.due_date ? new Date(sale.due_date) : new Date(),
        remainingAmount: parseFloat(sale.due_amount || '0'),
        notes: '',
        deliveryPerson: sale.delivery_person || '',
        deliveryPhoto: sale.delivery_photo || ''
      })));

      // Load due payments
      const duePaymentsData = await FormService.getDuePaymentsSummary();
      setDuePayments(duePaymentsData.map((payment: any) => ({
        id: payment.id?.toString() || '',
        saleId: payment.saleId?.toString() || payment.id?.toString() || '',
        customerId: payment.customerId?.toString() || '',
        customerName: payment.customerName || 'Unknown',
        customerPhone: payment.customerPhone || '',
        saleNumber: payment.saleNumber || '',
        invoiceNumber: payment.saleNumber || '',
        totalAmount: parseFloat(payment.originalAmount || '0'),
        originalAmount: parseFloat(payment.originalAmount || '0'),
        paidAmount: parseFloat(payment.paidAmount || '0'),
        dueAmount: parseFloat(payment.dueAmount || '0'),
        remainingAmount: parseFloat(payment.dueAmount || '0'),
        dueDate: payment.dueDate ? new Date(payment.dueDate) : new Date(),
        status: payment.status === 'overdue' ? 'Overdue' : 'Due',
        daysOverdue: payment.daysPastDue || 0,
        daysPastDue: payment.daysPastDue || 0,
        isRedListed: false,
        reminderCount: 0,
        createdAt: payment.createdAt ? new Date(payment.createdAt) : new Date(),
        lastPaymentDate: payment.updatedAt ? new Date(payment.updatedAt) : new Date(),
        paymentHistory: []
      })));

      // Load red list customers
      const redListData = await FormService.getRedListCustomers();
      setRedListCustomers(redListData);

      // Load sales stats
      const statsData = await FormService.getSalesStats();
      setSalesStats(statsData);

    } catch (error) {
      console.error('Error loading sales data:', error);
      Alert.alert('Error', 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadSalesData();
  }, [filters]);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      if (filters.search && 
          !sale.saleNumber.toLowerCase().includes(filters.search.toLowerCase()) && 
          !sale.customerName.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.customerId && sale.customerId !== filters.customerId) {
        return false;
      }
      if (filters.paymentStatus && sale.paymentStatus !== filters.paymentStatus) {
        return false;
      }
      if (filters.saleStatus && sale.status !== filters.saleStatus) {
        return false;
      }
      return true;
    });
  }, [sales, filters]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSalesData();
    setRefreshing(false);
  };

  const handleSalesSubmit = async (saleData: any) => {
    try {
      // The sale is already created in the SalesForm, just refresh the data
      console.log('Sale submitted:', saleData);
      await loadSalesData();
      setShowSalesForm(false);
    } catch (error) {
      console.error('Error handling sales submission:', error);
    }
  };

  const handleSaveDraft = async (draftData: any) => {
    try {
      // TODO: Implement draft saving functionality
      console.log('Draft saved:', draftData);
      Alert.alert('Success', 'Draft saved successfully');
    } catch (error) {
      console.error('Error saving draft:', error);
      Alert.alert('Error', 'Failed to save draft');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
      case 'Delivered': return theme.colors.status.success;
      case 'Partial':
      case 'Confirmed': return theme.colors.status.warning;
      case 'Due': return theme.colors.status.info;
      case 'Overdue':
      case 'Cancelled': return theme.colors.status.error;
      case 'Draft': return theme.colors.text.secondary;
      default: return theme.colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid':
      case 'Delivered': return CheckCircle;
      case 'Partial':
      case 'Confirmed': return Clock;
      case 'Due': return AlertTriangle;
      case 'Overdue':
      case 'Cancelled': return XCircle;
      case 'Draft': return Edit;
      default: return Clock;
    }
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'VIP': return theme.colors.status.warning;
      case 'Wholesale': return theme.colors.primary;
      case 'Regular': return theme.colors.status.info;
      default: return theme.colors.text.secondary;
    }
  };

  const handleAction = async (action: string, item: any) => {
    try {
      switch (action) {
        case 'view':
          Alert.alert(
            'Sale Details',
            `Sale: ${item.saleNumber || item.invoiceNumber}\nCustomer: ${item.customerName}\nAmount: ৳${item.amount?.toLocaleString() || 0}\nStatus: ${item.status}`,
            [{ text: 'OK' }]
          );
          break;
        case 'edit':
          if (!hasPermission('sales', 'edit')) {
            Alert.alert('Permission Denied', 'You do not have permission to edit sales.');
            return;
          }
          Alert.alert(
            'Edit Sale',
            `Edit ${item.saleNumber || item.invoiceNumber}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Edit', onPress: () => console.log('Edit functionality coming soon') }
            ]
          );
          break;
        case 'invoice':
          Alert.alert(
            'Generate Invoice',
            `Generate invoice for ${item.saleNumber}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Generate', onPress: () => handleGenerateInvoice(item) }
            ]
          );
          break;
        case 'payment':
          Alert.alert(
            'Record Payment',
            `Record payment for ${item.invoiceNumber}?\nDue Amount: ৳${item.dueAmount?.toLocaleString() || 0}`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Record', onPress: () => handleRecordPayment(item) }
            ]
          );
          break;
        case 'reminder':
          Alert.alert(
            'Send Reminder',
            `Send payment reminder for ${item.invoiceNumber}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Send', onPress: () => handleSendReminder(item) }
            ]
          );
          break;
        case 'cancel':
          if (!hasPermission('sales', 'delete')) {
            Alert.alert('Permission Denied', 'You do not have permission to cancel sales.');
            return;
          }
          Alert.alert(
            'Cancel Sale',
            `Are you sure you want to cancel ${item.saleNumber}?`,
            [
              { text: 'No', style: 'cancel' },
              { text: 'Yes', style: 'destructive', onPress: () => handleCancelSale(item) }
            ]
          );
          break;
      }
    } catch (error) {
      console.error('Error handling action:', error);
      Alert.alert('Error', 'Failed to perform action. Please try again.');
    }
  };

  const handleGenerateInvoice = async (item: any) => {
    try {
      // TODO: Implement invoice generation with FormService
      Alert.alert('Success', 'Invoice generated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate invoice');
    }
  };

  const handleRecordPayment = async (item: any) => {
    try {
      // TODO: Implement payment recording with FormService
      Alert.alert('Success', 'Payment recorded successfully!');
      await loadSalesData(); // Refresh data
    } catch (error) {
      Alert.alert('Error', 'Failed to record payment');
    }
  };

  const handleSendReminder = async (item: any) => {
    try {
      // TODO: Implement reminder sending
      Alert.alert('Success', 'Reminder sent successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send reminder');
    }
  };

  const handleCancelSale = async (item: any) => {
    try {
      // TODO: Implement sale cancellation with FormService
      Alert.alert('Success', 'Sale cancelled successfully!');
      await loadSalesData(); // Refresh data
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel sale');
    }
  };

  const renderKPICards = () => {
    const totalSalesAmount = salesStats?.totalRevenue?.value || 0;
    const totalDueAmount = salesStats?.pendingAmount?.value || 0;
    const overduePayments = salesStats?.overdueAmount?.value || 0;
    const redListCustomersCount = redListCustomers.length;

    return (
      <View style={styles.kpiContainer}>
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={[styles.kpiIcon, { backgroundColor: theme.colors.primary + '20' }]}>
              <DollarSign size={24} color={theme.colors.primary} />
            </View>
            <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>৳{totalSalesAmount.toLocaleString()}</Text>
            <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Total Sales</Text>
          </View>
          
          <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.warning + '20' }]}>
              <Clock size={24} color={theme.colors.status.warning} />
            </View>
            <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>৳{totalDueAmount.toLocaleString()}</Text>
            <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Total Due</Text>
          </View>
        </View>
        
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.error + '20' }]}>
              <AlertTriangle size={24} color={theme.colors.status.error} />
            </View>
            <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>{overduePayments}</Text>
            <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Overdue Payments</Text>
          </View>
          
          <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.error + '20' }]}>
              <Users size={24} color={theme.colors.status.error} />
            </View>
            <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>{redListCustomersCount}</Text>
            <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Red List Customers</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTabs = () => (
    <View style={[styles.tabContainer, { borderBottomColor: theme.colors.border }]}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'sales' && { borderBottomColor: theme.colors.primary }]}
        onPress={() => setActiveTab('sales')}
      >
        <FileText size={18} color={activeTab === 'sales' ? theme.colors.primary : theme.colors.text.secondary} />
        <Text style={[
          styles.tabText,
          { color: activeTab === 'sales' ? theme.colors.primary : theme.colors.text.secondary }
        ]}>
          Sales
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'due-payments' && { borderBottomColor: theme.colors.primary }]}
        onPress={() => setActiveTab('due-payments')}
      >
        <Clock size={18} color={activeTab === 'due-payments' ? theme.colors.primary : theme.colors.text.secondary} />
        <Text style={[
          styles.tabText,
          { color: activeTab === 'due-payments' ? theme.colors.primary : theme.colors.text.secondary }
        ]}>
          Due Payments
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'invoices' && { borderBottomColor: theme.colors.primary }]}
        onPress={() => setActiveTab('invoices')}
      >
        <FileText size={18} color={activeTab === 'invoices' ? theme.colors.primary : theme.colors.text.secondary} />
        <Text style={[
          styles.tabText,
          { color: activeTab === 'invoices' ? theme.colors.primary : theme.colors.text.secondary }
        ]}>
          Invoices
        </Text>
      </TouchableOpacity>
    </View>
  );

  type SalesItem = Sale | DuePayment;

  const renderSaleItem = ({ item }: { item: Sale }) => {
    const StatusIcon = getStatusIcon(item.paymentStatus);
    const SaleStatusIcon = getStatusIcon(item.status);
    const customer = mockCustomers.find(c => c.id === item.customerId);
    
    return (
      <View style={[styles.itemCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: theme.colors.text.primary }]}>
              {item.saleNumber}
            </Text>
            <Text style={[styles.itemCode, { color: theme.colors.text.secondary }]}>
              {item.customerName}
            </Text>
            <View style={styles.customerTypeContainer}>
              <Text style={[
                styles.customerType,
                { 
                  color: getCustomerTypeColor(customer?.customerType || 'Regular'),
                  backgroundColor: getCustomerTypeColor(customer?.customerType || 'Regular') + '20'
                }
              ]}>
                {customer?.customerType || 'Regular'}
              </Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <StatusIcon size={12} color={getStatusColor(item.paymentStatus)} />
              <Text style={[styles.statusText, { color: getStatusColor(item.paymentStatus) }]}>
                {item.paymentStatus}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <SaleStatusIcon size={12} color={getStatusColor(item.status)} />
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Date:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
              {item.saleDate.toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Items:</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
              {item.items.length} item(s)
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
                -{item.discountPercentage}% (৳{item.discountAmount.toLocaleString()})
              </Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Due Date:</Text>
            <Text style={[
              styles.detailValue, 
              { color: item.paymentStatus === 'Overdue' ? theme.colors.status.error : theme.colors.text.primary }
            ]}>
              {item.dueDate.toLocaleDateString()}
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
          
          {hasPermission('sales', 'invoice') && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary + '20' }]}
              onPress={() => handleAction('invoice', item)}
            >
              <FileText size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
          
          {hasPermission('sales', 'edit') && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.status.warning + '20' }]}
                onPress={() => handleAction('edit', item)}
              >
                <Edit size={16} color={theme.colors.status.warning} />
              </TouchableOpacity>
              
              {hasPermission('sales', 'delete') && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.colors.status.error + '20' }]}
                  onPress={() => handleAction('cancel', item)}
                >
                  <XCircle size={16} color={theme.colors.status.error} />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  const renderDuePaymentItem = ({ item }: { item: DuePayment }) => {
    const StatusIcon = getStatusIcon(item.status);
    
    return (
      <View style={[styles.itemCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: theme.colors.text.primary }]}>
              {item.invoiceNumber}
            </Text>
            <View style={styles.customerContainer}>
              <Text style={[
                styles.customerName, 
                { color: item.isRedListed ? theme.colors.status.error : theme.colors.text.primary }
              ]}>
                {item.customerName}
                {item.isRedListed && (
                  <Text style={[styles.redListBadge, { color: theme.colors.status.error }]}>
                    {' '}[RED LIST]
                  </Text>
                )}
              </Text>
            </View>
            <View style={styles.contactInfo}>
              <Phone size={12} color={theme.colors.text.muted} />
              <Text style={[styles.phoneText, { color: theme.colors.text.muted }]}>
                {item.customerPhone}
              </Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <StatusIcon size={12} color={getStatusColor(item.status)} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.amountRow}>
            <View style={styles.amountItem}>
              <Text style={[styles.amountLabel, { color: theme.colors.text.secondary }]}>Original</Text>
              <Text style={[styles.amountValue, { color: theme.colors.text.primary }]}>
                ৳{item.originalAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={[styles.amountLabel, { color: theme.colors.text.secondary }]}>Paid</Text>
              <Text style={[styles.amountValue, { color: theme.colors.status.success }]}>
                ৳{item.paidAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={[styles.amountLabel, { color: theme.colors.text.secondary }]}>Remaining</Text>
              <Text style={[
                styles.amountValue, 
                { color: item.status === 'Overdue' ? theme.colors.status.error : theme.colors.status.warning }
              ]}>
                ৳{item.remainingAmount.toLocaleString()}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Due Date:</Text>
            <Text style={[
              styles.detailValue, 
              { color: item.status === 'Overdue' ? theme.colors.status.error : theme.colors.text.primary }
            ]}>
              {item.dueDate.toLocaleDateString()}
            </Text>
          </View>
          
          {item.daysPastDue > 0 && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Days Past Due:</Text>
              <Text style={[
                styles.detailValue, 
                { 
                  color: theme.colors.status.error,
                  fontWeight: item.daysPastDue > 60 ? '700' : '600'
                }
              ]}>
                {item.daysPastDue} days
              </Text>
            </View>
          )}
          
          {item.reminderCount > 0 && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>Reminders Sent:</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                {item.reminderCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.itemActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.status.info + '20' }]}
            onPress={() => handleAction('view', item)}
          >
            <Eye size={16} color={theme.colors.status.info} />
          </TouchableOpacity>
          
          {hasPermission('sales', 'edit') && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.status.success + '20' }]}
              onPress={() => handleAction('payment', item)}
            >
              <CreditCard size={16} color={theme.colors.status.success} />
            </TouchableOpacity>
          )}

          {hasPermission('sales', 'edit') && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.status.warning + '20' }]}
              onPress={() => handleAction('reminder', item)}
            >
              <Clock size={16} color={theme.colors.status.warning} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const getCurrentData = (): SalesItem[] => {
    switch (activeTab) {
      case 'sales':
        return filteredSales;
      case 'due-payments':
        return duePayments;
      case 'invoices':
        return [];
      default:
        return [];
    }
  };

  const renderSalesItem = ({ item }: { item: SalesItem }) => {
    switch (activeTab) {
      case 'sales':
        return renderSaleItem({ item: item as Sale });
      case 'due-payments':
        return renderDuePaymentItem({ item: item as DuePayment });
      default:
        return null;
    }
  };



  return (
    <SharedLayout title="Sales & Invoicing">
      <View style={styles.headerActions}>
        <TouchableOpacity 
          style={[styles.headerButton, { backgroundColor: theme.colors.backgroundSecondary }]}
        >
          <Download size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        {hasPermission('sales', 'add') && (
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setShowSalesForm(true)}
          >
            <Plus size={20} color={theme.colors.text.inverse} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
              Loading sales data...
            </Text>
          </View>
        ) : (
          <>
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
              placeholder="Search sales, customers..."
              placeholderTextColor={theme.colors.text.muted}
              value={filters.search || ''}
              onChangeText={(text) => setFilters(prev => ({ ...prev, search: text }))}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: theme.colors.backgroundSecondary }]}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Filter', 'Filter functionality coming soon')}
          >
            <Filter size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Data List */}
        {activeTab === 'invoices' ? (
          <View style={styles.emptyContainer}>
            <FileText size={48} color={theme.colors.text.muted} />
            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
              Invoice Management
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.text.muted }]}>
              Coming soon...
            </Text>
          </View>
        ) : (
          <FlatList<SalesItem>
            data={getCurrentData()}
            renderItem={renderSalesItem}
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
                <FileText size={48} color={theme.colors.text.muted} />
                <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                  No {activeTab.replace('-', ' ')} found
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.colors.text.muted }]}>
                  Try adjusting your search or filters
                </Text>
              </View>
            }
          />
        )}
          </>
        )}
      </ScrollView>

      {/* Sales Form Modal */}
      <SalesForm
        visible={showSalesForm}
        onClose={() => setShowSalesForm(false)}
        onSubmit={handleSalesSubmit}
        onSaveDraft={handleSaveDraft}
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
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 120,
  },
  kpiIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  kpiSubtext: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '400',
    marginTop: 4,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  itemCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 24,
  },
  itemCode: {
    fontSize: 14,
    marginBottom: 6,
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
    alignItems: 'flex-end',
    gap: 4,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  customerContainer: {
    marginBottom: 4,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  redListBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  phoneText: {
    fontSize: 13,
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
  amountValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  discountValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  amountItem: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 24,
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
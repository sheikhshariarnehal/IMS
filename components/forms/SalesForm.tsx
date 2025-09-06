import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Animated,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  Package,
  User,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Search,
  ChevronDown,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
  Save,
  CheckCircle,
  Loader,
  TrendingUp,
  Receipt,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useLocations } from '@/contexts/LocationContext';
import { FormService, type SaleFormData as FormServiceSaleData, type SaleItemFormData } from '@/lib/services/formService';
import { supabase } from '@/lib/supabase';
import type { Product, Customer, ProductLot } from '@/lib/supabase';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Types for the sales form (using imported types from supabase.ts)

interface SalesFormData {
  productId: string;
  customerId: string;
  lotId: string;
  quantity: string;
  unitPrice: string;
  discountType: 'amount' | 'percentage';
  discountValue: string;
  taxPercentage: string;
  otherCharges: string;
  otherChargesNote: string;
  paymentType: 'full' | 'partial' | 'due';
  paidAmount: string;
  paymentMethod: 'cash' | 'card' | 'check' | 'bank_transfer';
  dueDate: string;
  notes: string;
}

interface SalesFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  onSaveDraft?: (data: any) => void;
  onSuccess?: () => void;
}

export default function SalesForm({ visible, onClose, onSubmit, onSaveDraft, onSuccess }: SalesFormProps) {
  const { theme } = useTheme();
  const { hasPermission, user, getAccessibleLocations } = useAuth();
  const { showToast } = useToast();
  const { showrooms } = useLocations();

  // Check if user can create sales at specific location
  const canCreateSaleAtLocation = useCallback((locationId: string) => {
    return hasPermission('sales', 'add', locationId);
  }, [hasPermission]);
  const slideAnim = useRef(new Animated.Value(-screenHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  // Form data state
  const [formData, setFormData] = useState<SalesFormData>({
    productId: '',
    customerId: '',
    lotId: '',
    quantity: '',
    unitPrice: '',
    discountType: 'amount',
    discountValue: '',
    taxPercentage: '0',
    otherCharges: '',
    otherChargesNote: '',
    paymentType: 'full',
    paidAmount: '',
    paymentMethod: 'cash',
    dueDate: '',
    notes: '',
  });

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [lots, setLots] = useState<ProductLot[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedLot, setSelectedLot] = useState<ProductLot | null>(null);

  // UI states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDropdowns, setShowDropdowns] = useState({
    product: false,
    customer: false,
    lot: false,
    discountType: false,
    paymentType: false,
    paymentMethod: false,
  });
  const [searchTexts, setSearchTexts] = useState({
    product: '',
    customer: '',
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  // Form steps for better UX
  const steps = [
    { title: 'Product & Customer', icon: Package },
    { title: 'Lot & Quantity', icon: ShoppingCart },
    { title: 'Pricing', icon: DollarSign },
    { title: 'Payment', icon: CreditCard },
  ];

  const canSellProduct = hasPermission('sales', 'add');

  // Mock data - will be replaced with actual API calls
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Premium Sofa Fabric',
      product_code: 'PSF001',
      category: 'Sofa Fabrics',
      current_stock: 150,
      selling_price: 850,
      unit_of_measure: 'meter',
      lots: [
        { id: '1', lot_number: 'LOT001', quantity: 75, purchase_price: 600, selling_price: 850, purchase_date: '2024-01-15' },
        { id: '2', lot_number: 'LOT002', quantity: 75, purchase_price: 650, selling_price: 900, purchase_date: '2024-02-01' },
      ]
    },
    {
      id: '2',
      name: 'Luxury Curtain Fabric',
      product_code: 'LCF002',
      category: 'Curtain Fabrics',
      current_stock: 0,
      selling_price: 1200,
      unit_of_measure: 'meter',
      lots: []
    },
  ];

  const mockCustomers: Customer[] = [
    {
      id: '1',
      name: 'Ahmed Hassan',
      phone: '+880 1712-345678',
      email: 'ahmed@example.com',
      address: 'Dhanmondi, Dhaka',
      customer_type: 'VIP',
      is_red_listed: false,
      outstanding_amount: 0,
    },
    {
      id: '2',
      name: 'Fatima Rahman',
      phone: '+880 1812-987654',
      email: 'fatima@example.com',
      address: 'Gulshan, Dhaka',
      customer_type: 'Regular',
      is_red_listed: true,
      outstanding_amount: 15000,
    },
  ];

  // Load data when modal opens
  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    try {
      // Apply location filtering for non-super admin users
      let productFilters = {};

      // Get accessible locations for current user
      const accessibleLocations = getAccessibleLocations();
      console.log('📍 SalesForm - Accessible locations for user:', accessibleLocations);

      if (user?.role !== 'super_admin' && accessibleLocations.length > 0) {
        if (user?.role === 'sales_manager') {
          // Sales managers can only see products from their assigned location
          productFilters = { location: accessibleLocations[0] }; // Sales manager has only one location
        } else if (user?.role === 'admin') {
          // Admins can see products from their accessible locations
          productFilters = { location: accessibleLocations };
        }
      }

      console.log('🔍 SalesForm - Product filters:', productFilters);

      // Load real data from database
      const [productsData, customersData] = await Promise.all([
        FormService.getProducts(productFilters, user?.id),
        FormService.getCustomers()
      ]);

      setProducts(productsData);
      setCustomers(customersData);

      console.log('Loaded sales data:', {
        products: productsData.length,
        customers: customersData.length
      });
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    }
  };

  // Reset form when opening
  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setFormData({
      productId: '',
      customerId: '',
      lotId: '',
      quantity: '',
      unitPrice: '',
      discountType: 'amount',
      discountValue: '',
      taxPercentage: '0',
      otherCharges: '',
      otherChargesNote: '',
      paymentType: 'full',
      paidAmount: '',
      paymentMethod: 'cash',
      dueDate: '',
      notes: '',
    });
    setSelectedProduct(null);
    setSelectedCustomer(null);
    setSelectedLot(null);
    setErrors({});
    setShowDropdowns({
      product: false,
      customer: false,
      lot: false,
      discountType: false,
      paymentType: false,
      paymentMethod: false,
    });
    setSearchTexts({ product: '', customer: '' });
    setIsDraft(false);
  };

  // Enhanced animations
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, overlayOpacity, slideAnim, scaleAnim]);

  // Calculate totals
  const calculateTotals = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const unitPrice = parseFloat(formData.unitPrice) || 0;
    const subtotal = quantity * unitPrice;

    let discountAmount = 0;
    if (formData.discountValue) {
      if (formData.discountType === 'percentage') {
        discountAmount = (subtotal * parseFloat(formData.discountValue)) / 100;
      } else {
        discountAmount = parseFloat(formData.discountValue);
      }
    }

    const taxAmount = ((subtotal - discountAmount) * parseFloat(formData.taxPercentage || '0')) / 100;
    const otherCharges = parseFloat(formData.otherCharges) || 0;
    const total = subtotal - discountAmount + taxAmount + otherCharges;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      otherCharges,
      total,
    };
  };

  const totals = useMemo(() => calculateTotals(), [
    formData.quantity,
    formData.unitPrice,
    formData.discountValue,
    formData.discountType,
    formData.taxPercentage,
    formData.otherCharges,
  ]);

  // Validation functions
  const validateField = (field: keyof SalesFormData, value: string): string => {
    switch (field) {
      case 'quantity':
        if (value && selectedLot) {
          const numValue = parseFloat(value);
          if (isNaN(numValue) || numValue <= 0) {
            return 'Please enter a valid positive quantity';
          }
          if (numValue > selectedLot.quantity) {
            return `Quantity cannot exceed available stock (${selectedLot.quantity} units)`;
          }
        }
        break;

      case 'unitPrice':
        if (value) {
          const numValue = parseFloat(value);
          if (isNaN(numValue) || numValue <= 0) {
            return 'Please enter a valid positive price';
          }
        }
        break;

      case 'discountValue':
        if (value) {
          const numValue = parseFloat(value);
          if (isNaN(numValue) || numValue < 0) {
            return 'Please enter a valid discount amount';
          }
          if (formData.discountType === 'percentage' && numValue > 100) {
            return 'Percentage discount cannot exceed 100%';
          }
        }
        break;

      case 'taxPercentage':
        if (value) {
          const numValue = parseFloat(value);
          if (isNaN(numValue) || numValue < 0 || numValue > 100) {
            return 'Please enter a valid tax percentage (0-100)';
          }
        }
        break;

      case 'paidAmount':
        if (value && formData.paymentType !== 'due') {
          const numValue = parseFloat(value);
          if (isNaN(numValue) || numValue < 0) {
            return 'Please enter a valid paid amount';
          }
          if (formData.paymentType === 'full' && numValue !== totals.total) {
            return 'Paid amount must equal total for full payment';
          }
        }
        break;
    }
    return '';
  };

  const handleFieldChange = (field: keyof SalesFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Real-time validation
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  // Handle product selection
  const handleProductSelect = useCallback(async (product: Product) => {
    setSelectedProduct(product);
    setFormData(prev => ({
      ...prev,
      productId: product.id.toString(),
      unitPrice: '', // Don't set unit price until lot is selected
    }));
    setSelectedLot(null);
    setFormData(prev => ({ ...prev, lotId: '' }));
    setShowDropdowns(prev => ({ ...prev, product: false }));
    setSearchTexts(prev => ({ ...prev, product: '' }));

    // Load lots for the selected product
    try {
      console.log('🔍 SalesForm: Loading lots for product:', product.name, 'ID:', product.id);
      const response = await FormService.getProductLots(product.id);
      console.log('🔍 SalesForm: Received response:', response);

      // Handle the response structure { success, data, error }
      if (response && typeof response === 'object' && 'success' in response) {
        if (response.success && response.data) {
          setLots(response.data);
          console.log(`✅ SalesForm: Loaded ${response.data.length} lots for product ${product.name}`);
        } else {
          console.error('❌ SalesForm: Failed to load lots:', response.error);
          setLots([]);
        }
      } else {
        // Handle direct array response (fallback for older method)
        const productLots = Array.isArray(response) ? response : [];
        setLots(productLots);
        console.log(`✅ SalesForm: Loaded ${productLots.length} lots for product ${product.name}`);
      }
    } catch (error) {
      console.error('❌ SalesForm: Error loading product lots:', error);
      setLots([]);
    }
  }, []);

  // Handle customer selection
  const handleCustomerSelect = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({ ...prev, customerId: customer.id.toString() }));
    setShowDropdowns(prev => ({ ...prev, customer: false }));
    setSearchTexts(prev => ({ ...prev, customer: '' }));
  }, []);

  // Handle lot selection
  const handleLotSelect = useCallback((lot: ProductLot) => {
    setSelectedLot(lot);
    setFormData(prev => ({
      ...prev,
      lotId: lot.id.toString(),
      unitPrice: lot.per_unit_price?.toString() || '0', // Use per_unit_price instead of selling_price
    }));
    setShowDropdowns(prev => ({ ...prev, lot: false }));
  }, []);

  const handlePressOutside = () => {
    setShowDropdowns({
      product: false,
      customer: false,
      lot: false,
      discountType: false,
      paymentType: false,
      paymentMethod: false,
    });
  };

  // Validate payment step
  const validatePaymentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.paymentType) {
      newErrors.paymentType = 'Please select a payment type';
    }

    if (formData.paymentType === 'partial') {
      if (!formData.paidAmount || parseFloat(formData.paidAmount) <= 0) {
        newErrors.paidAmount = 'Please enter a valid paid amount';
      } else if (parseFloat(formData.paidAmount) > totals.total) {
        newErrors.paidAmount = 'Paid amount cannot exceed total amount';
      }
    }

    if ((formData.paymentType === 'partial' || formData.paymentType === 'due') && !formData.dueDate) {
      newErrors.dueDate = 'Please select a due date';
    }

    if ((formData.paymentType === 'full' || (formData.paymentType === 'partial' && formData.paidAmount)) && !formData.paymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle final submission
  const handleFinalSubmission = async () => {
    console.log('🚀 Starting sale completion process...');
    console.log('📋 Form data:', formData);
    console.log('👤 User:', user);
    console.log('🏪 Selected product:', selectedProduct);

    if (!validatePaymentStep()) {
      Alert.alert('Incomplete Payment Details', 'Please complete all required payment information.');
      return;
    }

    setIsLoading(true);
    try {
      // Get current user from auth context
      if (!user?.id) {
        showToast('User not authenticated', 'error');
        return;
      }

      // Check location-specific permissions for admin and sales manager users
      let saleLocationId = selectedProduct?.location_id;

      if (user.role === 'admin' && selectedProduct?.location_id) {
        // For admins: if product is in warehouse, check if they have any showroom access
        // and use the first accessible showroom as the sale location
        if (!canCreateSaleAtLocation(selectedProduct.location_id)) {
          // Check if admin has access to any showroom for warehouse products
          const adminLocations = user.permissions?.locations || [];

          // Get showroom IDs from LocationContext
          const showroomIds = showrooms.map(showroom => showroom.id);
          const accessibleShowrooms = adminLocations.filter(locationId =>
            showroomIds.includes(locationId)
          );

          if (accessibleShowrooms.length === 0) {
            showToast('You do not have permission to create sales. Admins need access to at least one showroom to create sales.', 'error');
            return;
          }

          // Use the first accessible showroom as the sale location
          saleLocationId = accessibleShowrooms[0].toString();
          console.log(`📍 Admin selling warehouse product: using showroom ${saleLocationId} for sale location instead of warehouse ${selectedProduct.location_id}`);
        }
      } else if (user.role === 'sales_manager' && selectedProduct?.location_id) {
        // Sales managers can only create sales at their assigned location
        const productLocationId = typeof selectedProduct.location_id === 'string'
          ? parseInt(selectedProduct.location_id)
          : selectedProduct.location_id;

        console.log('🔍 Sales Manager Location Check:', {
          userAssignedLocation: user.assigned_location_id,
          productLocationId,
          selectedProductLocationId: selectedProduct.location_id,
          match: productLocationId === user.assigned_location_id
        });

        if (user.assigned_location_id && productLocationId !== user.assigned_location_id) {
          console.log('❌ Location mismatch - blocking sale');
          showToast('You can only create sales for products in your assigned location.', 'error');
          return;
        }
        console.log('✅ Location check passed');
      }

      // Generate sale number
      const saleNumber = `SALE-${Date.now()}`;

      // Prepare sale data for Supabase (matching actual database schema)
      const saleData = {
        sale_number: saleNumber,
        customer_id: parseInt(selectedCustomer!.id),
        subtotal: totals.subtotal,
        discount_amount: totals.discountAmount,
        tax_amount: totals.taxAmount,
        total_amount: totals.total,
        paid_amount: formData.paymentType === 'full' ? totals.total :
                    formData.paymentType === 'partial' ? parseFloat(formData.paidAmount || '0') : 0,
        due_amount: formData.paymentType === 'full' ? 0 :
                   formData.paymentType === 'partial' ? totals.total - parseFloat(formData.paidAmount || '0') :
                   totals.total,
        payment_method: formData.paymentMethod,
        payment_status: formData.paymentType === 'full' ? 'paid' : (formData.paymentType === 'partial' ? 'partial' : 'pending'),
        sale_status: 'finalized',
        delivery_person: formData.notes || undefined,
        location_id: saleLocationId ? parseInt(saleLocationId) : undefined,
      };

      console.log('💾 Sale data to be created:', saleData);

      console.log('🚀 Calling FormService.createSale...');
      const result = await FormService.createSale(saleData, user.id);
      console.log('📊 Sale creation result:', result);

      if (result.success && result.data) {
        // Create sale item after successful sale creation
        const saleItemData = {
          sale_id: result.data.id,
          product_id: parseInt(selectedProduct!.id),
          lot_id: selectedLot?.id ? parseInt(selectedLot.id) : null,
          quantity: parseFloat(formData.quantity),
          unit_price: parseFloat(formData.unitPrice),
          total_price: totals.subtotal
        };

        console.log('📦 Creating sale item:', saleItemData);

        // Insert sale item
        const { error: itemError } = await supabase
          .from('sale_items')
          .insert([saleItemData]);

        if (itemError) {
          console.error('Error creating sale item:', itemError);
          showToast('Sale created but failed to add item details', 'warning');
        }
        // Show success animation
        setShowSuccess(true);
        Animated.spring(successScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();

        // Show success toast
        showToast(
          `Sale completed successfully! Sale #${result.data.sale_number} - Total: ৳${totals.total.toLocaleString()}`,
          'success',
          5000
        );

        // Call the appropriate callback
        if (onSubmit) {
          await onSubmit({
            ...saleData,
            id: result.data.id,
            sale_number: result.data.sale_number
          });
        }

        if (onSuccess) {
          onSuccess();
        }

        // Close form after showing success animation
        setTimeout(() => {
          handleClose();
        }, 2500);
      } else {
        showToast(result.error || 'Failed to create sale', 'error');
      }
    } catch (error) {
      console.error('Error completing sale:', error);
      showToast('Failed to complete the sale. Please try again.', 'error');
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowSuccess(false);
    setCurrentStep(0);
    resetForm();
    onClose();
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <View style={[styles.stepIndicator, { backgroundColor: theme.colors.backgroundSecondary }]}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepItem}>
          <View style={[
            styles.stepCircle,
            { backgroundColor: index <= currentStep ? theme.colors.primary : theme.colors.border }
          ]}>
            <step.icon
              size={16}
              color={index <= currentStep ? '#FFFFFF' : theme.colors.text.muted}
            />
          </View>
          <Text style={[
            styles.stepText,
            {
              color: index <= currentStep ? theme.colors.primary : theme.colors.text.muted,
              fontWeight: index <= currentStep ? '600' : '500'
            }
          ]}>
            {step.title}
          </Text>
          {index < steps.length - 1 && (
            <View style={[
              styles.stepLine,
              { backgroundColor: index < currentStep ? theme.colors.primary : theme.colors.border }
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  // Render current step content
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderProductCustomerStep();
      case 1:
        return renderLotQuantityStep();
      case 2:
        return renderPricingStep();
      case 3:
        return renderPaymentStep();
      default:
        return renderProductCustomerStep();
    }
  };

  // Render product search dropdown
  const renderProductDropdown = () => {
    const filteredProducts = products.filter(product =>
      product.name.toLowerCase().includes(searchTexts.product.toLowerCase()) ||
      product.product_code.toLowerCase().includes(searchTexts.product.toLowerCase())
    );

    return (
      <View style={styles.dropdownContainer}>
        <Text style={[styles.dropdownLabel, { color: theme.colors.text.primary }]}>
          Product <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <View style={[
          styles.modernSearchContainer,
          {
            borderColor: errors.productId ? theme.colors.status.error :
                        showDropdowns.product ? theme.colors.primary :
                        theme.colors.border,
            backgroundColor: theme.colors.background,
            shadowColor: showDropdowns.product ? theme.colors.primary : 'transparent',
          },
          showDropdowns.product && styles.modernSearchContainerActive,
          errors.productId && styles.modernSearchContainerError,
        ]}>
          <View style={styles.searchInputWrapper}>
            <Package
              size={20}
              color={showDropdowns.product ? theme.colors.primary : theme.colors.text.muted}
              style={styles.modernInputIcon}
            />
            <TextInput
              style={[styles.modernSearchInput, { color: theme.colors.text.primary }]}
              value={showDropdowns.product ? searchTexts.product : (selectedProduct?.name || '')}
              onChangeText={(text) => {
                setSearchTexts(prev => ({ ...prev, product: text }));
                if (!showDropdowns.product) {
                  setShowDropdowns(prev => ({ ...prev, product: true }));
                }
              }}
              onFocus={() => setShowDropdowns(prev => ({ ...prev, product: true }))}
              placeholder={selectedProduct ? selectedProduct.name : "Search products..."}
              placeholderTextColor={theme.colors.text.muted}
            />
            <TouchableOpacity
              style={styles.modernDropdownButton}
              onPress={() => setShowDropdowns(prev => ({ ...prev, product: !prev.product }))}
              activeOpacity={0.7}
            >
              <ChevronDown
                size={20}
                color={theme.colors.text.muted}
                style={[
                  styles.modernDropdownIcon,
                  showDropdowns.product && { transform: [{ rotate: '180deg' }] }
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>
        {errors.productId && (
          <Text style={[styles.errorText, { color: theme.colors.status.error }]}>
            {errors.productId}
          </Text>
        )}

        {showDropdowns.product && (
          <View style={[
            styles.modernDropdownList,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.text.primary,
            }
          ]}>
            {filteredProducts.length > 0 && (
              <View style={[styles.dropdownHeader, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.dropdownHeaderText, { color: theme.colors.text.muted }]}>
                  {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                </Text>
              </View>
            )}
            <ScrollView
              nestedScrollEnabled={true}
              style={{ maxHeight: 280 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              removeClippedSubviews={true}
              scrollEventThrottle={16}
              decelerationRate="fast"
              bounces={false}
              overScrollMode="never"
              contentContainerStyle={{ paddingVertical: 4 }}
            >
              {filteredProducts.length > 0 ? filteredProducts.map((product, index) => (
                <TouchableOpacity
                  key={product.id}
                  style={[
                    styles.modernDropdownItem,
                    {
                      backgroundColor: theme.colors.background,
                      borderBottomColor: theme.colors.border,
                      borderBottomWidth: index < filteredProducts.length - 1 ? 0.5 : 0,
                    }
                  ]}
                  onPress={() => handleProductSelect(product)}
                  activeOpacity={0.7}
                  delayPressIn={0}
                >
                  <View style={styles.modernProductContent}>
                    <View style={styles.modernProductHeader}>
                      <View style={styles.modernProductTitleRow}>
                        <Text style={[styles.modernProductName, { color: theme.colors.text.primary }]} numberOfLines={1}>
                          {product.name}
                        </Text>
                        <View style={[
                          styles.modernStockBadge,
                          {
                            backgroundColor: product.current_stock > 0 ?
                              theme.colors.status.success + '15' :
                              theme.colors.status.error + '15'
                          }
                        ]}>
                          <Text style={[
                            styles.modernStockText,
                            { color: product.current_stock > 0 ? theme.colors.status.success : theme.colors.status.error }
                          ]}>
                            {product.current_stock} {product.unit_of_measure}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.modernProductSubRow}>
                        <Text style={[styles.modernProductCode, { color: theme.colors.text.muted }]}>
                          {product.product_code}
                        </Text>
                        <Text style={[styles.modernProductCategory, { color: theme.colors.text.secondary }]}>
                          {product.category}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.modernProductFooter}>
                      <Text style={[styles.modernProductPrice, { color: theme.colors.primary }]}>
                        {product.selling_price ? `৳${product.selling_price.toLocaleString()}` : 'Price varies by lot'}
                      </Text>
                      {product.current_stock === 0 && (
                        <View style={styles.modernOutOfStockBadge}>
                          <AlertTriangle size={12} color={theme.colors.status.error} />
                          <Text style={[styles.modernOutOfStockText, { color: theme.colors.status.error }]}>
                            Out of Stock
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )) : (
                <View style={[styles.modernNoResultsContainer, { backgroundColor: theme.colors.background }]}>
                  <View style={[styles.modernNoResultsIcon, { backgroundColor: theme.colors.text.muted + '10' }]}>
                    <Package size={32} color={theme.colors.text.muted} />
                  </View>
                  <Text style={[styles.modernNoResultsTitle, { color: theme.colors.text.primary }]}>
                    No products found
                  </Text>
                  <Text style={[styles.modernNoResultsSubtext, { color: theme.colors.text.muted }]}>
                    Try searching with different keywords or check your spelling
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  // Render lot selection dropdown
  const renderLotDropdown = () => {
    // Ensure lots is an array and has items
    const lotsArray = Array.isArray(lots) ? lots : [];

    if (!selectedProduct || lotsArray.length === 0) {
      return (
        <View style={styles.noLotsContainer}>
          <Text style={styles.noLotsText}>No lots available for this product</Text>
        </View>
      );
    }

    // Sort lots by lot number (FIFO - First In, First Out)
    const sortedLots = [...lotsArray].sort((a, b) => a.lot_number - b.lot_number);

    return (
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          style={[
            styles.dropdownButton,
            { borderColor: errors.lotId ? theme.colors.status.error : theme.colors.primary + '30' },
            showDropdowns.lot && styles.dropdownButtonActive,
          ]}
          onPress={() => setShowDropdowns(prev => ({ ...prev, lot: !prev.lot }))}
        >
          <Text style={[
            styles.dropdownButtonText,
            { color: selectedLot ? theme.colors.text.primary : theme.colors.text.muted }
          ]}>
            {selectedLot ? `Lot ${selectedLot.lot_number} (${selectedLot.quantity} units)` : 'Select lot (FIFO order)'}
          </Text>
          <ChevronDown
            size={20}
            color={theme.colors.text.muted}
            style={[
              styles.dropdownIcon,
              showDropdowns.lot && { transform: [{ rotate: '180deg' }] }
            ]}
          />
        </TouchableOpacity>

        {showDropdowns.lot && (
          <View style={[styles.dropdownList, { backgroundColor: theme.colors.background }]}>
            <ScrollView
              nestedScrollEnabled={true}
              style={{ maxHeight: 200 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              removeClippedSubviews={true}
              scrollEventThrottle={16}
              decelerationRate="fast"
              bounces={false}
              overScrollMode="never"
            >
              {sortedLots.map((lot, index) => (
                <TouchableOpacity
                  key={lot.id}
                  style={[
                    styles.dropdownItem,
                    index === 0 && styles.fifoRecommended, // Highlight first item (FIFO)
                  ]}
                  onPress={() => handleLotSelect(lot)}
                >
                  <View style={styles.lotItemContent}>
                    <View style={styles.lotItemHeader}>
                      <Text style={styles.lotItemNumber}>
                        {lot.lot_number}
                        {index === 0 && <Text style={styles.fifoLabel}> 🔥 FIFO</Text>}
                      </Text>
                      <Text style={styles.lotItemQuantity}>
                        {lot.quantity} units
                      </Text>
                    </View>
                    <View style={styles.lotItemDetails}>
                      <Text style={styles.lotItemDate}>
                        Received: {lot.received_date ? new Date(lot.received_date).toLocaleDateString() : 'N/A'}
                      </Text>
                      <Text style={styles.lotItemPrice}>
                        Per Unit: ৳{lot.per_unit_price || 0}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  // Render discount type dropdown
  const renderDiscountTypeDropdown = () => {
    const discountTypes = [
      { id: 'amount', name: '৳ Amount', icon: '💰' },
      { id: 'percentage', name: '% Percent', icon: '📊' },
    ];

    return (
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          style={[
            styles.dropdownButton,
            showDropdowns.discountType && styles.dropdownButtonActive,
          ]}
          onPress={() => setShowDropdowns(prev => ({ ...prev, discountType: !prev.discountType }))}
        >
          <Text style={[styles.dropdownButtonText, { color: theme.colors.text.primary }]}>
            {discountTypes.find(type => type.id === formData.discountType)?.name || 'Amount'}
          </Text>
          <ChevronDown
            size={20}
            color={theme.colors.text.muted}
            style={[
              styles.dropdownIcon,
              showDropdowns.discountType && { transform: [{ rotate: '180deg' }] }
            ]}
          />
        </TouchableOpacity>

        {showDropdowns.discountType && (
          <View style={[styles.dropdownList, { backgroundColor: theme.colors.background }]}>
            {discountTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={styles.dropdownItem}
                onPress={() => {
                  setFormData(prev => ({ ...prev, discountType: type.id as 'amount' | 'percentage' }));
                  setShowDropdowns(prev => ({ ...prev, discountType: false }));
                }}
              >
                <Text style={styles.discountTypeIcon}>{type.icon}</Text>
                <Text style={styles.dropdownItemText}>{type.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Render customer search dropdown
  const renderCustomerDropdown = () => {
    const filteredCustomers = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTexts.customer.toLowerCase()) ||
      customer.phone?.includes(searchTexts.customer) ||
      customer.email?.toLowerCase().includes(searchTexts.customer.toLowerCase())
    );

    return (
      <View style={styles.dropdownContainer}>
        <Text style={[styles.dropdownLabel, { color: theme.colors.text.primary }]}>
          Customer <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <View style={[
          styles.modernSearchContainer,
          {
            borderColor: errors.customerId ? theme.colors.status.error :
                        showDropdowns.customer ? theme.colors.primary :
                        theme.colors.border,
            backgroundColor: theme.colors.background,
            shadowColor: showDropdowns.customer ? theme.colors.primary : 'transparent',
          },
          showDropdowns.customer && styles.modernSearchContainerActive,
          errors.customerId && styles.modernSearchContainerError,
        ]}>
          <View style={styles.searchInputWrapper}>
            <User
              size={20}
              color={showDropdowns.customer ? theme.colors.primary : theme.colors.text.muted}
              style={styles.modernInputIcon}
            />
            <TextInput
              style={[styles.modernSearchInput, { color: theme.colors.text.primary }]}
              value={showDropdowns.customer ? searchTexts.customer : (selectedCustomer?.name || '')}
              onChangeText={(text) => {
                setSearchTexts(prev => ({ ...prev, customer: text }));
                if (!showDropdowns.customer) {
                  setShowDropdowns(prev => ({ ...prev, customer: true }));
                }
              }}
              onFocus={() => setShowDropdowns(prev => ({ ...prev, customer: true }))}
              placeholder={selectedCustomer ? selectedCustomer.name : "Search customers..."}
              placeholderTextColor={theme.colors.text.muted}
            />
            <TouchableOpacity
              style={styles.modernDropdownButton}
              onPress={() => setShowDropdowns(prev => ({ ...prev, customer: !prev.customer }))}
              activeOpacity={0.7}
            >
              <ChevronDown
                size={20}
                color={theme.colors.text.muted}
                style={[
                  styles.modernDropdownIcon,
                  showDropdowns.customer && { transform: [{ rotate: '180deg' }] }
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>
        {errors.customerId && (
          <Text style={[styles.errorText, { color: theme.colors.status.error }]}>
            {errors.customerId}
          </Text>
        )}

        {showDropdowns.customer && (
          <View style={[
            styles.modernDropdownList,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.text.primary,
            }
          ]}>
            {filteredCustomers.length > 0 && (
              <View style={[styles.dropdownHeader, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.dropdownHeaderText, { color: theme.colors.text.muted }]}>
                  {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} found
                </Text>
              </View>
            )}
            <ScrollView
              nestedScrollEnabled={true}
              style={{ maxHeight: 280 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingVertical: 4 }}
            >
              {filteredCustomers.length > 0 ? filteredCustomers.map((customer, index) => (
                <TouchableOpacity
                  key={customer.id}
                  style={[
                    styles.modernDropdownItem,
                    {
                      backgroundColor: theme.colors.background,
                      borderBottomColor: theme.colors.border,
                      borderBottomWidth: index < filteredCustomers.length - 1 ? 0.5 : 0,
                    }
                  ]}
                  onPress={() => handleCustomerSelect(customer)}
                  activeOpacity={0.7}
                >
                  <View style={styles.modernCustomerContent}>
                    <View style={styles.modernCustomerHeader}>
                      <View style={styles.modernCustomerTitleRow}>
                        <Text style={[styles.modernCustomerName, { color: theme.colors.text.primary }]} numberOfLines={1}>
                          {customer.name}
                        </Text>
                        <View style={styles.modernCustomerBadges}>
                          {customer.customer_type === 'VIP' && (
                            <View style={[styles.modernVipBadge, { backgroundColor: '#FFD700' + '20' }]}>
                              <Text style={[styles.modernVipText, { color: '#B8860B' }]}>
                                👑 VIP
                              </Text>
                            </View>
                          )}
                          {customer.is_red_listed && (
                            <View style={[styles.modernRedListBadge, { backgroundColor: theme.colors.status.error + '15' }]}>
                              <AlertTriangle size={10} color={theme.colors.status.error} />
                              <Text style={[styles.modernRedListText, { color: theme.colors.status.error }]}>
                                Red Listed
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.modernCustomerSubRow}>
                        {customer.phone && (
                          <Text style={[styles.modernCustomerPhone, { color: theme.colors.text.muted }]}>
                            📞 {customer.phone}
                          </Text>
                        )}
                        {customer.email && (
                          <Text style={[styles.modernCustomerEmail, { color: theme.colors.text.secondary }]} numberOfLines={1}>
                            ✉️ {customer.email}
                          </Text>
                        )}
                      </View>
                      {customer.outstanding_amount > 0 && (
                        <View style={styles.modernCustomerFooter}>
                          <Text style={[styles.modernCustomerDue, { color: theme.colors.status.error }]}>
                            Outstanding: ৳{customer.outstanding_amount.toLocaleString()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )) : (
                <View style={[styles.modernNoResultsContainer, { backgroundColor: theme.colors.background }]}>
                  <View style={[styles.modernNoResultsIcon, { backgroundColor: theme.colors.text.muted + '10' }]}>
                    <User size={32} color={theme.colors.text.muted} />
                  </View>
                  <Text style={[styles.modernNoResultsTitle, { color: theme.colors.text.primary }]}>
                    No customers found
                  </Text>
                  <Text style={[styles.modernNoResultsSubtext, { color: theme.colors.text.muted }]}>
                    Try searching with name, phone, or email
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  // Step 1: Product & Customer Selection
  const renderProductCustomerStep = () => (
    <View style={styles.stepContent}>
      {/* Product Selection */}
      <View style={styles.section}>
        <View style={styles.sectionTitleContainer}>
          <Package size={18} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Select Product</Text>
        </View>

        <View style={styles.inputGroup}>
          {renderProductDropdown()}
        </View>

        {/* Show selected product stock info */}
        {selectedProduct && (
          <View style={styles.productInfoCard}>
            <Text style={styles.productInfoTitle}>Selected Product Info</Text>
            <View style={styles.productInfoRow}>
              <Text style={styles.productInfoLabel}>Current Stock:</Text>
              <Text style={[
                styles.productInfoValue,
                { color: selectedProduct.current_stock > 0 ? theme.colors.status.success : theme.colors.status.error }
              ]}>
                {selectedProduct.current_stock} {selectedProduct.unit_of_measure}
              </Text>
            </View>
            <View style={styles.productInfoRow}>
              <Text style={styles.productInfoLabel}>Category:</Text>
              <Text style={styles.productInfoValue}>{selectedProduct.category}</Text>
            </View>
            <View style={styles.productInfoRow}>
              <Text style={styles.productInfoLabel}>Base Price:</Text>
              <Text style={styles.productInfoValue}>
                {selectedProduct.selling_price ? `৳${selectedProduct.selling_price}` : 'Varies by lot'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Customer Selection */}
      <View style={styles.section}>
        <View style={styles.sectionTitleContainer}>
          <User size={18} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Select Customer</Text>
        </View>

        <View style={styles.inputGroup}>
          {renderCustomerDropdown()}
        </View>

        {/* Show customer warning if red listed */}
        {selectedCustomer?.is_red_listed && (
          <View style={styles.warningCard}>
            <AlertTriangle size={20} color={theme.colors.status.error} />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>⚠️ Red Listed Customer</Text>
              <Text style={styles.warningText}>
                This customer is red listed. Outstanding amount: ৳{selectedCustomer.outstanding_amount.toLocaleString()}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  // Step 2: Lot & Quantity Selection
  const renderLotQuantityStep = () => (
    <View style={styles.stepContent}>
      {/* Lot Selection */}
      <View style={styles.section}>
        <View style={styles.sectionTitleContainer}>
          <Package size={18} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Select Lot (FIFO)</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, styles.requiredLabel]}>Lot Number *</Text>
          {renderLotDropdown()}
          {errors.lotId && <Text style={styles.errorText}>{errors.lotId}</Text>}
        </View>

        {/* Show selected lot info */}
        {selectedLot && (
          <View style={styles.lotInfoCard}>
            <Text style={styles.lotInfoTitle}>Selected Lot Details</Text>
            <View style={styles.lotInfoRow}>
              <Text style={styles.lotInfoLabel}>Available Quantity:</Text>
              <Text style={[styles.lotInfoValue, { color: theme.colors.status.success }]}>
                {selectedLot.quantity} units
              </Text>
            </View>
            <View style={styles.lotInfoRow}>
              <Text style={styles.lotInfoLabel}>Received Date:</Text>
              <Text style={styles.lotInfoValue}>{selectedLot.received_date ? new Date(selectedLot.received_date).toLocaleDateString() : 'N/A'}</Text>
            </View>
            <View style={styles.lotInfoRow}>
              <Text style={styles.lotInfoLabel}>Total Lot Value:</Text>
              <Text style={styles.lotInfoValue}>৳{selectedLot.selling_price || 0}</Text>
            </View>
            <View style={styles.lotInfoRow}>
              <Text style={styles.lotInfoLabel}>Per Unit Price:</Text>
              <Text style={[styles.lotInfoValue, { color: theme.colors.primary, fontWeight: '700' }]}>
                ৳{selectedLot.per_unit_price || 0}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Quantity Selection */}
      {selectedLot && (
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <ShoppingCart size={18} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Quantity</Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={[styles.label, styles.requiredLabel]}>Quantity *</Text>
              <TextInput
                style={[styles.input, errors.quantity && styles.inputError]}
                value={formData.quantity}
                onChangeText={(text) => {
                  const numericText = text.replace(/[^0-9.]/g, '');
                  setFormData(prev => ({ ...prev, quantity: numericText }));
                }}
                placeholder="0"
                placeholderTextColor={theme.colors.text.muted}
                keyboardType="numeric"
              />
              {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
            </View>

            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Unit Price</Text>
              <TextInput
                style={styles.input}
                value={formData.unitPrice}
                onChangeText={(text) => {
                  const numericText = text.replace(/[^0-9.]/g, '');
                  setFormData(prev => ({ ...prev, unitPrice: numericText }));
                }}
                placeholder="0.00"
                placeholderTextColor={theme.colors.text.muted}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Remaining Stock Calculation */}
          {formData.quantity && (
            <View style={styles.stockCalculationCard}>
              <View style={styles.stockCalculationRow}>
                <Text style={styles.stockCalculationLabel}>Available in Lot:</Text>
                <Text style={styles.stockCalculationValue}>{selectedLot.quantity} units</Text>
              </View>
              <View style={styles.stockCalculationRow}>
                <Text style={styles.stockCalculationLabel}>Selling Quantity:</Text>
                <Text style={styles.stockCalculationValue}>{formData.quantity || 0} units</Text>
              </View>
              <View style={[styles.stockCalculationRow, styles.stockCalculationTotal]}>
                <Text style={styles.stockCalculationLabel}>Remaining in Lot:</Text>
                <Text style={[
                  styles.stockCalculationValue,
                  {
                    color: (selectedLot.quantity - parseFloat(formData.quantity || '0')) >= 0
                      ? theme.colors.status.success
                      : theme.colors.status.error,
                    fontWeight: '700'
                  }
                ]}>
                  {(selectedLot.quantity - parseFloat(formData.quantity || '0')).toFixed(2)} units
                </Text>
              </View>

              {/* Warning if quantity exceeds available */}
              {parseFloat(formData.quantity || '0') > selectedLot.quantity && (
                <View style={styles.quantityWarning}>
                  <AlertTriangle size={16} color={theme.colors.status.error} />
                  <Text style={styles.quantityWarningText}>
                    Quantity exceeds available stock in this lot!
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );

  // Step 3: Pricing
  const renderPricingStep = () => (
    <View style={styles.stepContent}>
      {/* Discount Section */}
      <View style={styles.section}>
        <View style={styles.sectionTitleContainer}>
          <DollarSign size={18} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Discount (Optional)</Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.flex2]}>
            <Text style={styles.label}>Discount Value</Text>
            <TextInput
              style={styles.input}
              value={formData.discountValue}
              onChangeText={(text) => {
                const numericText = text.replace(/[^0-9.]/g, '');
                setFormData(prev => ({ ...prev, discountValue: numericText }));
              }}
              placeholder="0"
              placeholderTextColor={theme.colors.text.muted}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.inputGroup, styles.flex1]}>
            <Text style={styles.label}>Type</Text>
            {renderDiscountTypeDropdown()}
          </View>
        </View>
      </View>

      {/* Tax and Other Charges */}
      <View style={styles.section}>
        <View style={styles.sectionTitleContainer}>
          <FileText size={18} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Tax & Other Charges</Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.flex1]}>
            <Text style={styles.label}>Tax %</Text>
            <TextInput
              style={styles.input}
              value={formData.taxPercentage}
              onChangeText={(text) => {
                const numericText = text.replace(/[^0-9.]/g, '');
                setFormData(prev => ({ ...prev, taxPercentage: numericText }));
              }}
              placeholder="0"
              placeholderTextColor={theme.colors.text.muted}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.inputGroup, styles.flex1]}>
            <Text style={styles.label}>Other Charges</Text>
            <TextInput
              style={styles.input}
              value={formData.otherCharges}
              onChangeText={(text) => {
                const numericText = text.replace(/[^0-9.]/g, '');
                setFormData(prev => ({ ...prev, otherCharges: numericText }));
              }}
              placeholder="0"
              placeholderTextColor={theme.colors.text.muted}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Other Charges Note */}
        {formData.otherCharges && parseFloat(formData.otherCharges) > 0 && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Other Charges Note</Text>
            <TextInput
              style={styles.input}
              value={formData.otherChargesNote}
              onChangeText={(text) => setFormData(prev => ({ ...prev, otherChargesNote: text }))}
              placeholder="Describe other charges..."
              placeholderTextColor={theme.colors.text.muted}
            />
          </View>
        )}
      </View>

      {/* Price Calculation Summary */}
      {formData.quantity && formData.unitPrice && (
        <View style={styles.calculationSummary}>
          <Text style={styles.calculationTitle}>💰 Price Breakdown</Text>

          <View style={styles.calculationRow}>
            <Text style={styles.calculationLabel}>Subtotal:</Text>
            <Text style={styles.calculationValue}>৳{totals.subtotal.toLocaleString()}</Text>
          </View>

          {totals.discountAmount > 0 && (
            <View style={styles.calculationRow}>
              <Text style={[styles.calculationLabel, { color: theme.colors.status.success }]}>
                Discount ({formData.discountType === 'percentage' ? `${formData.discountValue}%` : '৳' + formData.discountValue}):
              </Text>
              <Text style={[styles.calculationValue, { color: theme.colors.status.success }]}>
                -৳{totals.discountAmount.toLocaleString()}
              </Text>
            </View>
          )}

          {totals.taxAmount > 0 && (
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>Tax ({formData.taxPercentage}%):</Text>
              <Text style={styles.calculationValue}>৳{totals.taxAmount.toLocaleString()}</Text>
            </View>
          )}

          {totals.otherCharges > 0 && (
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>Other Charges:</Text>
              <Text style={styles.calculationValue}>৳{totals.otherCharges.toLocaleString()}</Text>
            </View>
          )}

          <View style={[styles.calculationRow, styles.calculationTotal]}>
            <Text style={styles.calculationTotalLabel}>Total Amount:</Text>
            <Text style={styles.calculationTotalValue}>৳{totals.total.toLocaleString()}</Text>
          </View>
        </View>
      )}
    </View>
  );

  // Step 4: Payment
  const renderPaymentStep = () => (
    <View style={styles.stepContent}>
      {/* Payment Type Selection */}
      <View style={styles.section}>
        <View style={styles.sectionTitleContainer}>
          <CreditCard size={18} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Payment Type</Text>
        </View>

        <View style={styles.paymentTypeContainer}>
          {[
            { key: 'full', label: 'Full Payment', icon: '💰', color: '#10B981', description: 'Customer pays the full amount now' },
            { key: 'partial', label: 'Partial Payment', icon: '⏳', color: '#F59E0B', description: 'Customer pays part now, rest later' },
            { key: 'due', label: 'Full on Due', icon: '📅', color: '#EF4444', description: 'Customer will pay later on due date' }
          ].map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.paymentTypeButton,
                formData.paymentType === type.key && {
                  backgroundColor: type.color + '20',
                  borderColor: type.color,
                  borderWidth: 2,
                },
              ]}
              onPress={() => {
                setFormData(prev => ({
                  ...prev,
                  paymentType: type.key as 'full' | 'partial' | 'due',
                  // Reset paid amount when changing payment type
                  paidAmount: type.key === 'full' ? totals.total.toString() : ''
                }));
              }}
            >
              <View style={styles.paymentTypeHeader}>
                <Text style={styles.paymentTypeIcon}>{type.icon}</Text>
                <Text style={[
                  styles.paymentTypeLabel,
                  formData.paymentType === type.key && { color: type.color, fontWeight: '700' }
                ]}>
                  {type.label}
                </Text>
              </View>
              <Text style={[
                styles.paymentTypeDescription,
                formData.paymentType === type.key && { color: type.color }
              ]}>
                {type.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Payment Amount Details */}
      {formData.paymentType && (
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <DollarSign size={18} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Payment Details</Text>
          </View>

          <View style={styles.paymentSummaryCard}>
            <View style={styles.paymentSummaryRow}>
              <Text style={styles.paymentSummaryLabel}>Total Amount:</Text>
              <Text style={styles.paymentSummaryValue}>৳{totals.total.toLocaleString()}</Text>
            </View>

            {formData.paymentType === 'full' && (
              <>
                <View style={styles.paymentSummaryRow}>
                  <Text style={[styles.paymentSummaryLabel, { color: theme.colors.status.success }]}>Paying Now:</Text>
                  <Text style={[styles.paymentSummaryValue, { color: theme.colors.status.success }]}>৳{totals.total.toLocaleString()}</Text>
                </View>
                <View style={styles.paymentSummaryRow}>
                  <Text style={styles.paymentSummaryLabel}>Remaining:</Text>
                  <Text style={styles.paymentSummaryValue}>৳0</Text>
                </View>
              </>
            )}

            {formData.paymentType === 'partial' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, styles.requiredLabel]}>Amount Paying Now *</Text>
                  <TextInput
                    style={[styles.input, errors.paidAmount && styles.inputError]}
                    value={formData.paidAmount}
                    onChangeText={(text) => {
                      const numericText = text.replace(/[^0-9.]/g, '');
                      setFormData(prev => ({ ...prev, paidAmount: numericText }));
                    }}
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.text.muted}
                    keyboardType="numeric"
                  />
                  {errors.paidAmount && <Text style={styles.errorText}>{errors.paidAmount}</Text>}
                </View>

                {formData.paidAmount && (
                  <>
                    <View style={styles.paymentSummaryRow}>
                      <Text style={[styles.paymentSummaryLabel, { color: theme.colors.status.success }]}>Paying Now:</Text>
                      <Text style={[styles.paymentSummaryValue, { color: theme.colors.status.success }]}>
                        ৳{parseFloat(formData.paidAmount || '0').toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.paymentSummaryRow}>
                      <Text style={[styles.paymentSummaryLabel, { color: theme.colors.status.warning }]}>Remaining:</Text>
                      <Text style={[styles.paymentSummaryValue, { color: theme.colors.status.warning }]}>
                        ৳{(totals.total - parseFloat(formData.paidAmount || '0')).toLocaleString()}
                      </Text>
                    </View>
                  </>
                )}
              </>
            )}

            {formData.paymentType === 'due' && (
              <>
                <View style={styles.paymentSummaryRow}>
                  <Text style={styles.paymentSummaryLabel}>Paying Now:</Text>
                  <Text style={styles.paymentSummaryValue}>৳0</Text>
                </View>
                <View style={styles.paymentSummaryRow}>
                  <Text style={[styles.paymentSummaryLabel, { color: theme.colors.status.error }]}>Due Amount:</Text>
                  <Text style={[styles.paymentSummaryValue, { color: theme.colors.status.error }]}>৳{totals.total.toLocaleString()}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* Due Date Selection - Show for partial and due payments */}
      {(formData.paymentType === 'partial' || formData.paymentType === 'due') && (
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Calendar size={18} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Due Date</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, styles.requiredLabel]}>Payment Due Date *</Text>
            <TouchableOpacity
              style={[styles.dateInput, errors.dueDate && styles.inputError]}
              onPress={() => {
                // For now, just set a default date (7 days from now)
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 7);
                setFormData(prev => ({ ...prev, dueDate: dueDate.toISOString().split('T')[0] }));
              }}
            >
              <Calendar size={20} color={theme.colors.primary} />
              <Text style={[
                styles.dateInputText,
                { color: formData.dueDate ? theme.colors.text.primary : theme.colors.text.muted }
              ]}>
                {formData.dueDate ? new Date(formData.dueDate).toLocaleDateString() : 'Select due date'}
              </Text>
            </TouchableOpacity>
            {errors.dueDate && <Text style={styles.errorText}>{errors.dueDate}</Text>}
          </View>
        </View>
      )}

      {/* Payment Method Selection - Show for full and partial payments */}
      {(formData.paymentType === 'full' || (formData.paymentType === 'partial' && formData.paidAmount)) && (
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <CreditCard size={18} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>

          <View style={styles.paymentMethodContainer}>
            {[
              { key: 'cash', label: 'Cash', icon: Banknote, color: '#10B981' },
              { key: 'card', label: 'Card', icon: CreditCard, color: '#3B82F6' },
              { key: 'check', label: 'Check', icon: FileText, color: '#8B5CF6' },
              { key: 'bank_transfer', label: 'Bank Transfer', icon: Smartphone, color: '#F59E0B' }
            ].map((method) => {
              const IconComponent = method.icon;
              return (
                <TouchableOpacity
                  key={method.key}
                  style={[
                    styles.paymentMethodButton,
                    formData.paymentMethod === method.key && {
                      backgroundColor: method.color + '20',
                      borderColor: method.color,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, paymentMethod: method.key as any }))}
                >
                  <IconComponent
                    size={24}
                    color={formData.paymentMethod === method.key ? method.color : theme.colors.text.muted}
                  />
                  <Text style={[
                    styles.paymentMethodText,
                    formData.paymentMethod === method.key && { color: method.color, fontWeight: '700' }
                  ]}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Notes Section */}
      <View style={styles.section}>
        <View style={styles.sectionTitleContainer}>
          <FileText size={18} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
            placeholder="Any additional notes for this sale..."
            placeholderTextColor={theme.colors.text.muted}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      {/* Final Summary */}
      {formData.paymentType && (
        <View style={styles.finalSummaryCard}>
          <Text style={styles.finalSummaryTitle}>🎯 Sale Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Product:</Text>
            <Text style={styles.summaryValue}>{selectedProduct?.name}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Customer:</Text>
            <Text style={styles.summaryValue}>{selectedCustomer?.name}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Quantity:</Text>
            <Text style={styles.summaryValue}>{formData.quantity} {selectedProduct?.unit_of_measure}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount:</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.primary, fontWeight: '700' }]}>
              ৳{totals.total.toLocaleString()}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment Type:</Text>
            <Text style={styles.summaryValue}>
              {formData.paymentType === 'full' ? 'Full Payment' :
                formData.paymentType === 'partial' ? 'Partial Payment' : 'Full on Due'}
            </Text>
          </View>

          {(formData.paymentType === 'full' || (formData.paymentType === 'partial' && formData.paidAmount)) && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment Method:</Text>
              <Text style={styles.summaryValue}>
                {formData.paymentMethod === 'cash' ? 'Cash' :
                  formData.paymentMethod === 'card' ? 'Card' :
                    formData.paymentMethod === 'check' ? 'Check' : 'Bank Transfer'}
              </Text>
            </View>
          )}

          {formData.dueDate && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Due Date:</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.status.warning }]}>
                {new Date(formData.dueDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  if (!canSellProduct) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handlePressOutside}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableWithoutFeedback onPress={() => { }}>
            <Animated.View
              style={[
                styles.container,
                {
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim }
                  ],
                },
              ]}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
              >
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>🛒 New Sale</Text>
                  <View style={styles.headerActions}>
                    <TouchableOpacity
                      style={styles.draftButton}
                      onPress={() => {
                        setIsDraft(true);
                        // Handle save draft
                      }}
                    >
                      <Save size={20} color={theme.colors.primary} />
                      <Text style={styles.draftButtonText}>Draft</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                      <X size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Step Indicator */}
                {renderStepIndicator()}

                {/* Content */}
                <ScrollView
                  style={styles.content}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  keyboardShouldPersistTaps="handled"
                  removeClippedSubviews={false}
                  scrollEventThrottle={1}
                  decelerationRate="normal"
                  bounces={true}
                  overScrollMode="auto"
                  nestedScrollEnabled={false}
                >
                  {renderCurrentStep()}
                </ScrollView>

                {/* Footer */}
                <View style={[styles.footer, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.backgroundSecondary }]}>
                  {currentStep > 0 ? (
                    <TouchableOpacity
                      style={[styles.button, styles.backButton, { backgroundColor: theme.colors.backgroundTertiary, borderColor: theme.colors.border }]}
                      onPress={() => setCurrentStep(prev => prev - 1)}
                    >
                      <Text style={[styles.backButtonText, { color: theme.colors.text.primary }]}>← Back</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.button, styles.backButton, { backgroundColor: theme.colors.backgroundTertiary, borderColor: theme.colors.border }]}
                      onPress={onClose}
                    >
                      <Text style={[styles.backButtonText, { color: theme.colors.text.primary }]}>Cancel</Text>
                    </TouchableOpacity>
                  )}

                  {currentStep < steps.length - 1 ? (
                    <TouchableOpacity
                      style={[styles.button, styles.nextButton, { backgroundColor: theme.colors.primary }]}
                      onPress={() => {
                        // Validate current step before proceeding
                        if (currentStep === 0 && (!selectedProduct || !selectedCustomer)) {
                          showToast('Please select both product and customer', 'warning');
                          return;
                        }
                        if (currentStep === 1 && (!selectedLot || !formData.quantity)) {
                          showToast('Please select lot and enter quantity', 'warning');
                          return;
                        }
                        if (currentStep === 1 && parseFloat(formData.quantity) > selectedLot!.quantity) {
                          showToast(`Quantity cannot exceed available stock. Available: ${selectedLot!.quantity} units`, 'error');
                          return;
                        }
                        setCurrentStep(prev => prev + 1);
                      }}
                    >
                      <Text style={styles.nextButtonText}>Next →</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.submitButton,
                        { backgroundColor: '#10B981' },
                        isSubmitting && styles.submitButtonDisabled
                      ]}
                      onPress={() => {
                        setIsSubmitting(true);
                        handleFinalSubmission();
                      }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color="#FFFFFF" />
                          <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>
                            Processing Sale...
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.submitButtonContent}>
                          <Receipt size={18} color="#FFFFFF" />
                          <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>
                            Complete Sale
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </KeyboardAvoidingView>

              {/* Success Overlay */}
              {showSuccess && (
                <View style={styles.successOverlay}>
                  <Animated.View
                    style={[
                      styles.successContainer,
                      { transform: [{ scale: successScale }] }
                    ]}
                  >
                    <View style={styles.successIcon}>
                      <CheckCircle size={64} color="#10B981" />
                    </View>
                    <Text style={styles.successTitle}>
                      Sale Completed!
                    </Text>
                    <Text style={styles.successMessage}>
                      Your sale has been processed successfully and is ready for delivery
                    </Text>
                  </Animated.View>
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 4,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginHorizontal: 4,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    maxHeight: '95%',
    minHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: Platform.OS === 'ios' ? 24 : 20,
    backgroundColor: '#2563eb',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  draftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  draftButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    marginTop: 20,
    position: 'relative',
    zIndex: 1,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: 0.3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  requiredLabel: {
    color: '#ef4444',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 9999,
  },
  searchInputContainer: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
  },
  searchInputContainerActive: {
    borderColor: '#2563eb',
    borderWidth: 2,
    backgroundColor: '#2563eb10',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  inputIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  dropdownIconContainer: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#2563eb30',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 99999,
    elevation: 99999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f050',
    backgroundColor: 'transparent',
  },
  productItemContent: {
    gap: 8,
  },
  productItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  productItemCode: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  productItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productItemCategory: {
    fontSize: 14,
    color: '#64748b',
  },
  productItemStock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productItemStockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  productItemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
  },
  customerItemContent: {
    gap: 6,
  },
  customerItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  customerBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  customerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  customerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000',
  },
  customerItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  customerItemPhone: {
    fontSize: 14,
    color: '#64748b',
  },
  customerItemEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  customerItemAddress: {
    fontSize: 12,
    color: '#94a3b8',
  },
  customerItemDue: {
    fontSize: 12,
    fontWeight: '600',
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  productInfoCard: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  productInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  productInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productInfoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  productInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  warningCard: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#991b1b',
    lineHeight: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 6,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    padding: 20,
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f1f5f9',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cancelButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  continueButton: {
    backgroundColor: '#2563eb',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  // Lot selection styles
  noLotsContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  noLotsText: {
    fontSize: 14,
    color: '#dc2626',
    fontStyle: 'italic',
  },
  dropdownButton: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb10',
  },
  dropdownButtonText: {
    fontSize: 16,
    flex: 1,
    fontWeight: '500',
  },
  fifoRecommended: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  lotItemContent: {
    gap: 6,
  },
  lotItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lotItemNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  fifoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f59e0b',
  },
  lotItemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  lotItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lotItemDate: {
    fontSize: 12,
    color: '#64748b',
  },
  lotItemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  // Lot info card styles
  lotInfoCard: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  lotInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  lotInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  lotInfoLabel: {
    fontSize: 14,
    color: '#0369a1',
  },
  lotInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  // Input styles
  input: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    fontWeight: '500',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  // Stock calculation styles
  stockCalculationCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stockCalculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stockCalculationTotal: {
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    paddingTop: 8,
    marginTop: 8,
  },
  stockCalculationLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  stockCalculationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  quantityWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
  },
  quantityWarningText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  // Discount section styles
  discountSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fefce8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde047',
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a16207',
    marginBottom: 12,
  },
  discountTypeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  // Calculation summary styles
  calculationSummary: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  calculationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 12,
    textAlign: 'center',
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calculationLabel: {
    fontSize: 14,
    color: '#166534',
  },
  calculationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  calculationTotal: {
    borderTopWidth: 2,
    borderTopColor: '#22c55e',
    paddingTop: 8,
    marginTop: 8,
  },
  calculationTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
  },
  calculationTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563eb',
  },
  // Footer styles
  footerTotal: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369a1',
  },
  footerTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563eb',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  disabledButton: {
    backgroundColor: '#e2e8f0',
  },
  disabledButtonText: {
    color: '#94a3b8',
  },
  // Step indicator styles (matching ProductAddForm)
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  stepLine: {
    position: 'absolute',
    top: 20,
    right: -50,
    width: 100,
    height: 2,
    zIndex: -1,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  // Navigation button styles
  backButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  nextButton: {
    backgroundColor: '#2563eb',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  submitButton: {
    backgroundColor: '#10b981',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  // Coming soon placeholder
  comingSoonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  // Payment step styles
  paymentTypeContainer: {
    gap: 12,
  },
  paymentTypeButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  paymentTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  paymentTypeIcon: {
    fontSize: 20,
  },
  paymentTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  paymentTypeDescription: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 28,
  },
  paymentSummaryCard: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  paymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentSummaryLabel: {
    fontSize: 14,
    color: '#0369a1',
    fontWeight: '500',
  },
  paymentSummaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  dateInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateInputText: {
    fontSize: 16,
    fontWeight: '500',
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  paymentMethodButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    gap: 8,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  finalSummaryCard: {
    backgroundColor: '#f0fdf4',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#bbf7d0',
    marginTop: 16,
  },
  finalSummaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 2,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    textAlign: 'right',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  successContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 300,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Modern dropdown styles
  dropdownLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  requiredAsterisk: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
  modernSearchContainer: {
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  modernSearchContainerActive: {
    borderWidth: 2,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  modernSearchContainerError: {
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 56,
  },
  modernInputIcon: {
    marginRight: 12,
  },
  modernSearchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  modernDropdownButton: {
    padding: 8,
    marginLeft: 8,
  },
  modernDropdownIcon: {
    transition: 'transform 0.2s ease',
  },
  modernDropdownList: {
    marginTop: 4,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: 320,
  },
  dropdownHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernDropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modernProductContent: {
    flex: 1,
  },
  modernProductHeader: {
    marginBottom: 8,
  },
  modernProductTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  modernProductName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  modernStockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  modernStockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modernProductSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modernProductCode: {
    fontSize: 13,
    fontWeight: '500',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modernProductCategory: {
    fontSize: 13,
    fontWeight: '500',
  },
  modernProductFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  modernProductPrice: {
    fontSize: 15,
    fontWeight: '700',
  },
  modernOutOfStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modernOutOfStockText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  modernCustomerContent: {
    flex: 1,
  },
  modernCustomerHeader: {
    flex: 1,
  },
  modernCustomerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  modernCustomerName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  modernCustomerBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  modernVipBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  modernVipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modernRedListBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modernRedListText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  modernCustomerSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modernCustomerPhone: {
    fontSize: 13,
    fontWeight: '500',
  },
  modernCustomerEmail: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  modernCustomerFooter: {
    marginTop: 6,
  },
  modernCustomerDue: {
    fontSize: 13,
    fontWeight: '600',
  },
  modernNoResultsContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernNoResultsIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modernNoResultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modernNoResultsSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
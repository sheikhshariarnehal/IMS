import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableWithoutFeedback,
  StatusBar,
  TextInput,
} from 'react-native';
import {
  X,
  Package,
  DollarSign,
  Image as ImageIcon,
  Warehouse,
  Camera,
  Upload,
  Sparkles,
  ChevronDown,
  Info,
  Calculator,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { FormService, type ProductFormData as FormServiceProductData } from '@/lib/services/formService';
import type { Category, Supplier, Location, Product } from '@/lib/supabase';

const { height: screenHeight } = Dimensions.get('window');

// Types

interface ProductStatus {
  id: string;
  name: string;
  description: string;
}

interface FormStep {
  title: string;
  icon: any;
  fields: string[];
}

interface FieldConfig {
  label: string;
  required?: boolean;
  placeholder: string;
  keyboardType?: string;
  multiline?: boolean;
  type?: string;
  options?: any[];
  disabled?: boolean;
  info?: string;
  defaultValue?: any;
  rules?: any;
}

interface ProductFormData {
  name: string;
  product_code: string;
  category_id: string;
  description: string;
  purchase_price: string;
  selling_price: string;
  current_stock: string;
  unit_of_measurement: string;
  per_unit_price: string;
  supplier_id: string;
  location_id: string;
  minimum_threshold: string;
  lot_number: string;
  product_status: string;
  wastage_status: boolean;
}

// Using Product interface from supabase.ts

interface ProductAddFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  existingProduct?: any;
}

// Form configuration
const formSteps: FormStep[] = [
  {
    title: 'Product Type',
    icon: Package,
    fields: ['product_type_selection']
  },
  {
    title: 'Basic Info',
    icon: Package,
    fields: ['name', 'product_code', 'category_id', 'description']
  },
  {
    title: 'Stock and Pricing',
    icon: DollarSign,
    fields: ['current_stock', 'purchase_price', 'selling_price', 'unit_of_measurement', 'per_unit_price']
  },
  {
    title: 'Stock & Location',
    icon: Warehouse,
    fields: ['supplier_id', 'location_id', 'lot_number', 'minimum_threshold']
  },
  {
    title: 'Images & Status',
    icon: ImageIcon,
    fields: ['images', 'product_status', 'wastage_status']
  }
];

// Data will be loaded from database

// Existing products will be loaded from database

const productStatuses: ProductStatus[] = [
  { id: 'active', name: 'Active', description: 'Available for sale' },
  { id: 'slow', name: 'Slow Moving', description: 'Low demand product' },
  { id: 'inactive', name: 'Inactive', description: 'Not available for sale' },
];

// Measurement units
interface MeasurementUnit {
  id: string;
  name: string;
  symbol: string;
  description: string;
}

const measurementUnits: MeasurementUnit[] = [
  { id: 'meter', name: 'Meter', symbol: 'm', description: 'Length measurement for fabrics' },
  { id: 'yard', name: 'Yard', symbol: 'yd', description: 'Imperial length measurement' },
  { id: 'kilogram', name: 'Kilogram', symbol: 'kg', description: 'Weight measurement' },
  { id: 'gram', name: 'Gram', symbol: 'g', description: 'Small weight measurement' },
  { id: 'piece', name: 'Piece', symbol: 'pcs', description: 'Individual items' },
  { id: 'pair', name: 'Pair', symbol: 'pair', description: 'Items sold in pairs' },
  { id: 'dozen', name: 'Dozen', symbol: 'dz', description: '12 pieces' },
  { id: 'roll', name: 'Roll', symbol: 'roll', description: 'Fabric rolls' },
  { id: 'bundle', name: 'Bundle', symbol: 'bundle', description: 'Bundled items' },
];

// Field configurations will be created inside component with real data

// Reusable Components
interface FormInputProps {
  field: string;
  fieldConfig: Record<string, FieldConfig>;
  value: string | boolean;
  onChangeText: (text: string | boolean) => void;
  onBlur: () => void;
  errors: Record<string, string>;
  theme: any;
}

const FormInput: React.FC<FormInputProps> = ({ field, fieldConfig, value, onChangeText, onBlur, errors, theme }) => {
  const config = fieldConfig[field];

  if (config?.type === 'dropdown') {
    return (
      <DropdownField
        value={value as string}
        onChange={onChangeText}
        options={config.options || []}
        placeholder={config.placeholder}
        theme={theme}
        error={errors[field]}
        displayKey="name"
      />
    );
  }

  if (config?.type === 'boolean') {
    return (
      <View style={styles.booleanContainer}>
        <TouchableOpacity
          style={[
            styles.booleanButton,
            value && styles.booleanButtonActive,
            { borderColor: theme.colors.primary }
          ]}
          onPress={() => onChangeText(!value)}
        >
          <View style={[
            styles.booleanIndicator,
            value && styles.booleanIndicatorActive,
            { backgroundColor: value ? theme.colors.primary : theme.colors.border }
          ]} />
          <Text style={[
            styles.booleanText,
            { color: value ? theme.colors.primary : theme.colors.text.muted }
          ]}>
            {value ? 'Yes' : 'No'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TextInput
      style={[
        styles.input,
        config?.multiline && styles.textArea,
        config?.disabled && styles.inputDisabled,
        errors[field] && styles.inputError,
        {
          borderColor: errors[field] ? theme.colors.status.error : theme.colors.border,
          backgroundColor: config?.disabled ? theme.colors.backgroundSecondary : theme.colors.backgroundTertiary,
          color: config?.disabled ? theme.colors.text.muted : theme.colors.text.primary
        }
      ]}
      value={value?.toString() || ''}
      onChangeText={onChangeText}
      onBlur={onBlur}
      placeholder={config?.placeholder}
      placeholderTextColor={theme.colors.text.muted}
      keyboardType={config?.keyboardType as any}
      multiline={config?.multiline}
      numberOfLines={config?.multiline ? 3 : 1}
      editable={!config?.disabled}
      autoCapitalize="sentences"
    />
  );
};

interface DropdownFieldProps {
  value: string;
  onChange: (value: string | boolean) => void;
  options: any[];
  placeholder: string;
  theme: any;
  error?: string;
  displayKey?: string;
  searchable?: boolean;
}

const DropdownField: React.FC<DropdownFieldProps> = ({ value, onChange, options, placeholder, theme, error, displayKey = 'name', searchable = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<View>(null);

  const selectedOption = options.find((option: any) => option.id === value || option.id.toString() === value);

  // Filter options based on search query
  const filteredOptions = searchable && searchQuery
    ? options.filter((option: any) => 
        option[displayKey].toLowerCase().includes(searchQuery.toLowerCase()) ||
        (option.product_code && option.product_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (option.description && option.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  const handleDropdownToggle = () => {
    if (!isOpen && dropdownRef.current) {
      // Measure the dropdown position to determine if it should open upward or downward
      dropdownRef.current.measure((_x, _y, _width, height, _pageX, pageY) => {
        const screenHeight = Dimensions.get('window').height;
        const dropdownHeight = Math.min(filteredOptions.length * 60, 200); // Estimate dropdown height
        const spaceBelow = screenHeight - pageY - height - 100; // 100px buffer for footer
        const spaceAbove = pageY - 100; // 100px buffer for header

        if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
          setDropdownPosition('top');
        } else {
          setDropdownPosition('bottom');
        }
      });
    }
    setIsOpen(!isOpen);
    if (!isOpen && searchable) {
      setSearchQuery('');
    }
  };

  return (
    <View style={[styles.dropdownContainer, isOpen && styles.dropdownContainerOpen]} ref={dropdownRef}>
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          {
            borderColor: error ? theme.colors.status.error : theme.colors.border,
            backgroundColor: theme.colors.backgroundTertiary
          }
        ]}
        onPress={handleDropdownToggle}
      >
        <View style={styles.dropdownContent}>
          <Text style={[
            styles.dropdownButtonText,
            { color: selectedOption ? theme.colors.text.primary : theme.colors.text.muted }
          ]}>
            {selectedOption ? selectedOption[displayKey] : placeholder}
          </Text>
          {selectedOption?.description && (
            <Text style={[styles.dropdownSubtext, { color: theme.colors.text.muted }]}>
              {selectedOption.description}
            </Text>
          )}
        </View>
        <ChevronDown
          size={20}
          color={theme.colors.text.muted}
          style={[styles.dropdownIcon, isOpen && { transform: [{ rotate: '180deg' }] }]}
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={[
          styles.dropdownList,
          dropdownPosition === 'top' ? styles.dropdownListTop : styles.dropdownListBottom,
          { backgroundColor: theme.colors.background }
        ]}>
          {searchable && (
            <View style={[styles.searchContainer, { borderBottomColor: theme.colors.border }]}>
              <TextInput
                style={[styles.searchInput, { 
                  backgroundColor: theme.colors.backgroundTertiary,
                  color: theme.colors.text.primary,
                  borderColor: theme.colors.border
                }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search products..."
                placeholderTextColor={theme.colors.text.muted}
                autoFocus
              />
            </View>
          )}
          <ScrollView
            style={{ maxHeight: searchable ? 160 : 200 }}
            nestedScrollEnabled
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {filteredOptions.length === 0 ? (
              <View style={styles.noResultsContainer}>
                <Text style={[styles.noResultsText, { color: theme.colors.text.muted }]}>
                  No products found
                </Text>
              </View>
            ) : (
              filteredOptions.map((item: any) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.dropdownItem,
                    { borderBottomColor: theme.colors.border }
                  ]}
                  onPress={() => {
                    onChange(item.id.toString());
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <View>
                    <Text style={[styles.dropdownItemText, { color: theme.colors.text.primary }]}>
                      {item[displayKey]}
                    </Text>
                    {item.product_code && (
                      <Text style={[styles.dropdownItemCode, { color: theme.colors.primary }]}>
                        Code: {item.product_code}
                      </Text>
                    )}
                    {item.description && (
                      <Text style={[styles.dropdownItemDescription, { color: theme.colors.text.muted }]}>
                        {item.description}
                      </Text>
                    )}
                    {item.contact && (
                      <Text style={[styles.dropdownItemDescription, { color: theme.colors.text.muted }]}>
                        {item.contact}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

interface StepIndicatorProps {
  currentStep: number;
  steps: FormStep[];
  theme: any;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, steps, theme }) => (
  <View style={[styles.stepIndicator, { backgroundColor: theme.colors.backgroundSecondary }]}>
    {steps.map((step: FormStep, index: number) => (
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
          { color: index <= currentStep ? theme.colors.primary : theme.colors.text.muted }
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

interface PriceCalculatorProps {
  formData: ProductFormData;
  theme: any;
}

const PriceCalculator: React.FC<PriceCalculatorProps> = ({ formData, theme }) => {
  const purchasePrice = parseFloat(formData.purchase_price) || 0;
  const sellingPrice = parseFloat(formData.selling_price) || 0;
  const perUnitPrice = parseFloat(formData.per_unit_price) || 0;

  const profitMargin = purchasePrice && sellingPrice
    ? (((sellingPrice - purchasePrice) / purchasePrice) * 100).toFixed(1)
    : '0';

  // Get the selected unit details
  const selectedUnit = measurementUnits.find(unit => unit.id === formData.unit_of_measurement);
  const unitSymbol = selectedUnit?.symbol || 'unit';
  const unitName = selectedUnit?.name || 'Unit';

  return (
    <View style={[styles.calculatorCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <View style={styles.calculatorHeader}>
        <Calculator size={18} color={theme.colors.primary} />
        <Text style={[styles.calculatorTitle, { color: theme.colors.text.primary }]}>
          Price Analysis
        </Text>
      </View>
      <View style={styles.calculatorContent}>
        <View style={styles.calculatorRow}>
          <Text style={[styles.calculatorLabel, { color: theme.colors.text.muted }]}>
            Profit Margin:
          </Text>
          <Text style={[
            styles.calculatorValue,
            { color: parseFloat(profitMargin) > 0 ? theme.colors.status.success : theme.colors.text.primary }
          ]}>
            {profitMargin}%
          </Text>
        </View>
        <View style={styles.calculatorRow}>
          <Text style={[styles.calculatorLabel, { color: theme.colors.text.muted }]}>
            Profit Amount:
          </Text>
          <Text style={[styles.calculatorValue, { color: theme.colors.text.primary }]}>
            ৳{purchasePrice && sellingPrice ? (sellingPrice - purchasePrice).toFixed(2) : '0.00'}
          </Text>
        </View>
        <View style={styles.calculatorRow}>
          <Text style={[styles.calculatorLabel, { color: theme.colors.text.muted }]}>
            Per {unitName} Price:
          </Text>
          <Text style={[styles.calculatorValue, { color: theme.colors.primary }]}>
            ৳{perUnitPrice.toFixed(2)}/{unitSymbol}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default function ProductAddForm({ visible, onClose, onSubmit, existingProduct }: ProductAddFormProps) {
  const { theme } = useTheme();
  const { hasPermission, user } = useAuth();
  const { showToast } = useToast();
  const slideAnim = useRef(new Animated.Value(-screenHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [productType, setProductType] = useState<'new' | 'existing'>('new');
  const [selectedExistingProduct, setSelectedExistingProduct] = useState<Product | null>(null);

  // Real data from database
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [existingProducts, setExistingProducts] = useState<Product[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Field configurations with real data
  const fieldConfig: Record<string, FieldConfig> = {
    name: {
      label: 'Product Name',
      required: true,
      placeholder: 'Enter product name'
    },
    product_code: {
      label: 'Product Code',
      placeholder: 'Auto-generated',
      disabled: true
    },
    category_id: {
      label: 'Category',
      required: true,
      type: 'dropdown',
      options: categories,
      placeholder: 'Select category'
    },
    description: {
      label: 'Description',
      placeholder: 'Enter product description',
      multiline: true
    },
    purchase_price: {
      label: 'Purchase Price',
      required: true,
      placeholder: '0.00',
      keyboardType: 'numeric'
    },
    selling_price: {
      label: 'Selling Price',
      required: true,
      placeholder: '0.00',
      keyboardType: 'numeric'
    },
    current_stock: {
      label: 'Stock',
      required: true,
      placeholder: '0',
      keyboardType: 'numeric',
      info: 'Total stock quantity for this lot'
    },
    unit_of_measurement: {
      label: 'Unit of Measurement',
      required: true,
      type: 'dropdown',
      options: measurementUnits,
      placeholder: 'Select measurement unit'
    },
    per_unit_price: {
      label: 'Per Unit Price',
      placeholder: 'Auto-calculated',
      keyboardType: 'numeric',
      info: 'Will be calculated as Selling Price ÷ Quantity'
    },
    supplier_id: {
      label: 'Supplier',
      required: true,
      type: 'dropdown',
      options: suppliers,
      placeholder: 'Select supplier'
    },
    location_id: {
      label: 'Location',
      required: true,
      type: 'dropdown',
      options: locations,
      placeholder: 'Select location'
    },
    minimum_threshold: {
      label: 'Minimum Threshold',
      placeholder: '100',
      keyboardType: 'numeric',
      info: 'Alert when stock goes below this amount'
    },
    lot_number: {
      label: 'Lot Number',
      placeholder: 'Auto-generated',
      disabled: true,
      info: 'Automatically assigned based on previous lots'
    },
    product_status: {
      label: 'Product Status',
      type: 'dropdown',
      options: productStatuses,
      defaultValue: 'active',
      placeholder: 'Select status'
    },
    wastage_status: {
      label: 'Wastage Status',
      type: 'boolean',
      info: 'Mark if product is in wastage',
      placeholder: 'No'
    },
  };
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    product_code: '',
    category_id: '',
    description: '',
    purchase_price: '',
    selling_price: '',
    current_stock: '0',
    unit_of_measurement: 'meter',
    per_unit_price: '',
    supplier_id: '',
    location_id: '',
    minimum_threshold: '100',
    lot_number: '1',
    product_status: 'active',
    wastage_status: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const canAddProduct = hasPermission('products', 'add');

  const generateProductCode = (name: string): string => {
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `PRD-${cleanName.slice(0, 3)}${timestamp}`;
  };

  // Auto-generate product code
  React.useEffect(() => {
    if (formData.name && !existingProduct) {
      const code = generateProductCode(formData.name);
      setFormData(prev => ({ ...prev, product_code: code }));
    }
  }, [formData.name, existingProduct]);

  // Auto-calculate per unit price based on selling price and stock
  React.useEffect(() => {
    if (formData.selling_price && formData.current_stock) {
      const sellingPrice = parseFloat(formData.selling_price);
      const stock = parseFloat(formData.current_stock);

      if (sellingPrice > 0 && stock > 0) {
        const perUnitPrice = (sellingPrice / stock).toFixed(2);
        setFormData(prev => ({ ...prev, per_unit_price: perUnitPrice }));
      }
    }
  }, [formData.selling_price, formData.current_stock]);

  // Handle existing product selection
  const handleExistingProductSelect = (product: Product) => {
    setSelectedExistingProduct(product);
    const nextLotNumber = ((product.last_lot_no || product.current_lot_number || 0) + 1).toString();

    setFormData(prev => ({
      ...prev,
      name: product.name,
      product_code: product.product_code,
      category_id: product.category_id?.toString() || '',
      description: product.description || '',
      supplier_id: product.supplier_id?.toString() || '',
      location_id: product.location_id?.toString() || '',
      lot_number: nextLotNumber,
      // Reset pricing fields for new stock entry
      purchase_price: '',
      selling_price: '',
      quantity: '0',
      unit_of_measurement: product.unit_of_measurement || 'meter',
      per_unit_price: '',
      // Reset stock to 0 for new lot entry
      current_stock: '0',
    }));
  };

  // Reset lot number when product type changes
  React.useEffect(() => {
    if (productType === 'new') {
      setFormData(prev => ({ ...prev, lot_number: '0' }));
      setSelectedExistingProduct(null);
    }
  }, [productType]);

  // Animations
  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -screenHeight, duration: 250, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.9, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, slideAnim, overlayOpacity, scaleAnim]);

  // Load data from Supabase for dropdowns
  React.useEffect(() => {
    const loadFormData = async () => {
      try {
        setIsLoadingData(true);
        const [categoriesData, suppliersData, locationsData, existingProductsData] = await Promise.all([
          FormService.getCategories(),
          FormService.getSuppliers(),
          FormService.getLocations(),
          FormService.getExistingProducts()
        ]);

        setCategories(categoriesData);
        setSuppliers(suppliersData);
        setLocations(locationsData);
        setExistingProducts(existingProductsData);

        console.log('Loaded form data:', {
          categories: categoriesData.length,
          suppliers: suppliersData.length,
          locations: locationsData.length,
          existingProducts: existingProductsData.length
        });
      } catch (error) {
        console.error('Failed to load form data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (visible) {
      loadFormData();
    }
  }, [visible]);

  // Reset form when opening
  React.useEffect(() => {
    if (visible) {
      if (existingProduct) {
        setFormData({
          ...existingProduct,
          category_id: existingProduct.category_id?.toString() || '',
          supplier_id: existingProduct.supplier_id?.toString() || '',
          location_id: existingProduct.location_id?.toString() || '',
          lot_number: existingProduct.lot_number || '0',
        });
      } else {
        setFormData({
          name: '',
          product_code: '',
          category_id: '',
          description: '',
          purchase_price: '',
          selling_price: '',
          current_stock: '0',
          unit_of_measurement: 'meter',
          per_unit_price: '',
          supplier_id: '',
          location_id: '',
          minimum_threshold: '100',
          lot_number: '1',
          product_status: 'active',
          wastage_status: false,
        });
      }
      setCurrentStep(0);
      setProductType('new');
      setSelectedExistingProduct(null);
      setProductImages([]);
      setErrors({});
    }
  }, [visible, existingProduct]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate required fields
    Object.entries(fieldConfig).forEach(([field, config]) => {
      if (config.required && !formData[field as keyof ProductFormData]?.toString().trim()) {
        newErrors[field] = `${config.label} is required`;
      }
    });

    // Validate numeric fields
    if (formData.purchase_price && isNaN(parseFloat(formData.purchase_price))) {
      newErrors.purchase_price = 'Please enter a valid price';
    }
    if (formData.selling_price && isNaN(parseFloat(formData.selling_price))) {
      newErrors.selling_price = 'Please enter a valid price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmitForm = async () => {
    if (!canAddProduct) {
      showToast('You do not have permission to add products.', 'error');
      return;
    }

    if (!validateForm()) {
      showToast('Please fill in all required fields correctly.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare product data for Supabase
      const productData: FormServiceProductData = {
        name: formData.name.trim(),
        product_code: formData.product_code,
        category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
        description: formData.description?.trim() || undefined,
        purchase_price: parseFloat(formData.purchase_price),
        selling_price: parseFloat(formData.selling_price),
        per_meter_price: formData.per_unit_price ? parseFloat(formData.per_unit_price) : undefined,
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : undefined,
        location_id: formData.location_id ? parseInt(formData.location_id) : undefined,
        minimum_threshold: parseInt(formData.minimum_threshold) || 100,
        current_stock: parseFloat(formData.current_stock) || 0,
        unit_of_measurement: formData.unit_of_measurement || 'meter',
        images: productImages || undefined,
      };

      // Get current user from auth context
      if (!user?.id) {
        showToast('User not authenticated', 'error');
        return;
      }

      let result;

      if (productType === 'existing' && selectedExistingProduct) {
        // Add stock to existing product (create new lot)
        result = await FormService.addStockToExistingProduct(selectedExistingProduct.id, productData, user.id);
      } else {
        // Create new product
        result = await FormService.createProduct(productData, user.id);
      }

      if (result.success && result.data) {
        const actionText = productType === 'existing' ? 'restocked' : 'created';
        const productName = productType === 'existing' ? selectedExistingProduct?.name : result.data.name;

        // Show success toast
        showToast(`Product "${productName}" has been ${actionText} successfully!`, 'success');

        // Call the onSubmit callback and close the form
        onSubmit(result.data);
        onClose();
      } else {
        showToast(result.error || 'Failed to save product', 'error');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save product';
      showToast(errorMessage, 'error');
      console.error('Product creation error:', errorMessage, error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof ProductFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImagePicker = () => {
    console.log('Image picker functionality not implemented yet');
    // TODO: Implement image picker for web and mobile
  };

  const renderStepContent = () => {
    const currentStepConfig = formSteps[currentStep];
    const currentStepFields = currentStepConfig.fields;

    return (
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        {/* Product Type Selection - Step 0 */}
        {currentStep === 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              <Package size={18} color={theme.colors.primary} /> Choose Product Type
            </Text>
            
            <View style={styles.productTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.productTypeOption,
                  {
                    backgroundColor: productType === 'new' ? theme.colors.primary + '20' : theme.colors.backgroundSecondary,
                    borderColor: productType === 'new' ? theme.colors.primary : theme.colors.border,
                  }
                ]}
                onPress={() => setProductType('new')}
              >
                <View style={[styles.productTypeIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Package size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.productTypeContent}>
                  <Text style={[styles.productTypeTitle, { color: theme.colors.text.primary }]}>
                    Add New Product
                  </Text>
                  <Text style={[styles.productTypeDescription, { color: theme.colors.text.secondary }]}>
                    Create a completely new product with all details
                  </Text>
                </View>
                <View style={[
                  styles.radioButton,
                  {
                    borderColor: theme.colors.primary,
                    backgroundColor: productType === 'new' ? theme.colors.primary : 'transparent'
                  }
                ]}>
                  {productType === 'new' && <Text style={styles.radioButtonCheck}>✓</Text>}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.productTypeOption,
                  {
                    backgroundColor: productType === 'existing' ? theme.colors.primary + '20' : theme.colors.backgroundSecondary,
                    borderColor: productType === 'existing' ? theme.colors.primary : theme.colors.border,
                  }
                ]}
                onPress={() => setProductType('existing')}
              >
                <View style={[styles.productTypeIcon, { backgroundColor: theme.colors.status.success + '20' }]}>
                  <Package size={24} color={theme.colors.status.success} />
                </View>
                <View style={styles.productTypeContent}>
                  <Text style={[styles.productTypeTitle, { color: theme.colors.text.primary }]}>
                    Add Existing Product
                  </Text>
                  <Text style={[styles.productTypeDescription, { color: theme.colors.text.secondary }]}>
                    Restock an existing product with new lot
                  </Text>
                </View>
                <View style={[
                  styles.radioButton,
                  {
                    borderColor: theme.colors.primary,
                    backgroundColor: productType === 'existing' ? theme.colors.primary : 'transparent'
                  }
                ]}>
                  {productType === 'existing' && <Text style={styles.radioButtonCheck}>✓</Text>}
                </View>
              </TouchableOpacity>
            </View>

            {/* Existing Product Selection */}
            {productType === 'existing' && (
              <View style={styles.existingProductSection}>
                <Text style={[styles.label, styles.requiredLabel, { color: theme.colors.status.error }]}>
                  Select Existing Product *
                </Text>
                <DropdownField
                  value={selectedExistingProduct?.id?.toString() || ''}
                  onChange={(value) => {
                    const product = existingProducts.find(p => p.id.toString() === value);
                    if (product) handleExistingProductSelect(product);
                  }}
                  options={existingProducts.map(p => ({ ...p, id: p.id.toString() }))}
                  placeholder={isLoadingData ? "Loading products..." : "Search and select a product to restock..."}
                  theme={theme}
                  displayKey="name"
                  searchable={true}
                />
                {selectedExistingProduct && (
                  <View style={[styles.selectedProductInfo, { backgroundColor: theme.colors.backgroundSecondary }]}>
                    <Text style={[styles.selectedProductTitle, { color: theme.colors.text.primary }]}>
                      Selected: {selectedExistingProduct.name}
                    </Text>
                    <Text style={[styles.selectedProductDetails, { color: theme.colors.text.secondary }]}>
                      Code: {selectedExistingProduct.product_code} • Current Stock: {selectedExistingProduct.current_stock || 0}
                    </Text>
                    <Text style={[styles.selectedProductDetails, { color: theme.colors.text.secondary }]}>
                      Category ID: {selectedExistingProduct.category_id || 'N/A'} • Supplier ID: {selectedExistingProduct.supplier_id || 'N/A'}
                    </Text>
                    <Text style={[styles.selectedProductDetails, { color: theme.colors.text.secondary }]}>
                      Next Lot: {(selectedExistingProduct.current_lot_number || 0) + 1}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Special handling for pricing step */}
        {currentStep === 2 && (
          <PriceCalculator formData={formData} theme={theme} />
        )}

        {/* Images section for step 4 */}
        {currentStep === 4 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              <Sparkles size={18} color={theme.colors.primary} /> Product Images
            </Text>
            <TouchableOpacity
              style={[styles.imageUploadContainer, { borderColor: theme.colors.primary + '40' }]}
              onPress={handleImagePicker}
            >
              <View style={styles.imageUploadContent}>
                <View style={[styles.imageUploadIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Camera size={32} color={theme.colors.primary} />
                </View>
                <Text style={[styles.imageUploadText, { color: theme.colors.text.primary }]}>
                  Add product images
                </Text>
                <Text style={[styles.imageUploadSubtext, { color: theme.colors.text.muted }]}>
                  PNG, JPG up to 10MB each
                </Text>
                <View style={[styles.uploadButton, { backgroundColor: theme.colors.primary }]}>
                  <Upload size={16} color="#FFFFFF" />
                  <Text style={styles.uploadButtonText}>Choose Files</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Skip product type selection step for form fields */}
        {currentStep > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              {React.createElement(currentStepConfig.icon, { size: 18, color: theme.colors.primary })}
              {' '}{currentStepConfig.title}
            </Text>

            {currentStepFields.map((field) => {
              if (field === 'images' || field === 'product_type_selection') return null; // Already handled above

              const config = fieldConfig[field];
              const isRowField = (field === 'purchase_price' || field === 'lot_number' || field === 'unit_of_measurement');

              // For existing products, make certain fields read-only
              const isReadOnlyForExisting = productType === 'existing' &&
                ['name', 'product_code', 'category_id', 'description', 'unit_of_measurement'].includes(field);

              if (isRowField && field === 'purchase_price') {
                return (
                  <View key={field} style={styles.addressRow}>
                    <View style={[styles.addressInput, { zIndex: 1002 }]}>
                      <Text style={[
                        styles.label,
                        config?.required && styles.requiredLabel,
                        { color: config?.required ? theme.colors.status.error : theme.colors.text.primary }
                      ]}>
                        {config?.label} {config?.required && '*'}
                      </Text>
                      <FormInput
                        field={field}
                        fieldConfig={fieldConfig}
                        value={formData[field as keyof ProductFormData]}
                        onChangeText={(value) => updateFormData(field as keyof ProductFormData, value)}
                        onBlur={() => { }}
                        errors={errors}
                        theme={theme}
                      />
                      {errors[field] && (
                        <Text style={[styles.errorText, { color: theme.colors.status.error }]}>
                          {errors[field]}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.addressInput, { zIndex: 1001 }]}>
                      <Text style={[
                        styles.label,
                        fieldConfig.selling_price?.required && styles.requiredLabel,
                        { color: fieldConfig.selling_price?.required ? theme.colors.status.error : theme.colors.text.primary }
                      ]}>
                        {fieldConfig.selling_price?.label} {fieldConfig.selling_price?.required && '*'}
                      </Text>
                      <FormInput
                        field="selling_price"
                        fieldConfig={fieldConfig}
                        value={formData.selling_price}
                        onChangeText={(value) => updateFormData('selling_price', value)}
                        onBlur={() => { }}
                        errors={errors}
                        theme={theme}
                      />
                      {errors.selling_price && (
                        <Text style={[styles.errorText, { color: theme.colors.status.error }]}>
                          {errors.selling_price}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              }

              if (isRowField && field === 'unit_of_measurement') {
                return (
                  <View key={field} style={styles.addressRow}>
                    <View style={[styles.addressInput, { zIndex: 1001 }]}>
                      <Text style={[
                        styles.label,
                        config?.required && styles.requiredLabel,
                        { color: config?.required ? theme.colors.status.error : theme.colors.text.primary }
                      ]}>
                        {config?.label} {config?.required && '*'}
                      </Text>
                      <FormInput
                        field={field}
                        fieldConfig={fieldConfig}
                        value={formData[field as keyof ProductFormData]}
                        onChangeText={(value) => updateFormData(field as keyof ProductFormData, value)}
                        onBlur={() => { }}
                        errors={errors}
                        theme={theme}
                      />
                      {errors[field] && (
                        <Text style={[styles.errorText, { color: theme.colors.status.error }]}>
                          {errors[field]}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.addressInput, { zIndex: 1000 }]}>
                      <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                        Per {measurementUnits.find(unit => unit.id === formData.unit_of_measurement)?.name || 'Unit'} Price
                        {fieldConfig.per_unit_price?.info && (
                          <Info size={12} color={theme.colors.text.muted} style={{ marginLeft: 4 }} />
                        )}
                      </Text>
                      <FormInput
                        field="per_unit_price"
                        fieldConfig={fieldConfig}
                        value={formData.per_unit_price}
                        onChangeText={(value) => updateFormData('per_unit_price', value)}
                        onBlur={() => { }}
                        errors={errors}
                        theme={theme}
                      />
                      {fieldConfig.per_unit_price?.info && (
                        <Text style={[styles.infoText, { color: theme.colors.text.muted }]}>
                          {fieldConfig.per_unit_price.info}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              }

              if (isRowField && field === 'lot_number') {
                return (
                  <View key={field} style={styles.inputGroup}>
                    <Text style={[
                      styles.label,
                      config?.required && styles.requiredLabel,
                      { color: config?.required ? theme.colors.status.error : theme.colors.text.primary }
                    ]}>
                      {config?.label} {config?.required && '*'}
                      {config?.info && (
                        <Info size={12} color={theme.colors.text.muted} style={{ marginLeft: 4 }} />
                      )}
                    </Text>
                    <FormInput
                      field={field}
                      fieldConfig={fieldConfig}
                      value={formData[field as keyof ProductFormData]}
                      onChangeText={(value) => updateFormData(field as keyof ProductFormData, value)}
                      onBlur={() => { }}
                      errors={errors}
                      theme={theme}
                    />
                    {config?.info && (
                      <Text style={[styles.infoText, { color: theme.colors.text.muted }]}>
                        {config.info}
                      </Text>
                    )}
                    {errors[field] && (
                      <Text style={[styles.errorText, { color: theme.colors.status.error }]}>
                        {errors[field]}
                      </Text>
                    )}
                  </View>
                );
              }

              if (field === 'selling_price' || field === 'per_unit_price') return null; // Already rendered in row

              // Special rendering for current_stock field
              if (field === 'current_stock') {
                return (
                  <View key={field} style={styles.inputGroup}>
                    <Text style={[
                      styles.label,
                      config?.required && styles.requiredLabel,
                      { color: config?.required ? theme.colors.status.error : theme.colors.text.primary }
                    ]}>
                      {productType === 'existing' ? 'Add Stock Quantity' : config?.label} {config?.required && '*'}
                      {config?.info && (
                        <Info size={12} color={theme.colors.text.muted} style={{ marginLeft: 4 }} />
                      )}
                    </Text>
                    <FormInput
                      field="current_stock"
                      fieldConfig={fieldConfig}
                      value={formData.current_stock}
                      onChangeText={(value) => updateFormData('current_stock', value)}
                      onBlur={() => { }}
                      errors={errors}
                      theme={theme}
                    />
                    {productType === 'existing' && selectedExistingProduct && (
                      <View style={[
                        styles.stockSummary,
                        {
                          backgroundColor: theme.colors.backgroundSecondary,
                          borderLeftColor: theme.colors.status.success
                        }
                      ]}>
                        <Text style={[styles.stockSummaryText, { color: theme.colors.text.secondary }]}>
                          Previous total stock: {selectedExistingProduct.total_stock || selectedExistingProduct.current_stock || 0}
                        </Text>
                        <Text style={[styles.stockSummaryText, { color: theme.colors.text.primary, fontWeight: '600' }]}>
                          Total stock: {selectedExistingProduct.total_stock || selectedExistingProduct.current_stock || 0} + {formData.current_stock || '0'} = {(parseFloat((selectedExistingProduct.total_stock || selectedExistingProduct.current_stock)?.toString() || '0') + parseFloat(formData.current_stock || '0'))}
                        </Text>
                      </View>
                    )}
                    {config?.info && (
                      <Text style={[styles.infoText, { color: theme.colors.text.muted }]}>
                        {config.info}
                      </Text>
                    )}
                    {errors.current_stock && (
                      <Text style={[styles.errorText, { color: theme.colors.status.error }]}>
                        {errors.current_stock}
                      </Text>
                    )}
                  </View>
                );
              }

              // Assign higher z-index to fields that appear earlier in the form
              const fieldIndex = currentStepFields.indexOf(field);
              const zIndexValue = 2000 - fieldIndex * 100; // Higher z-index for earlier fields

              // Dynamic label for per unit price based on selected unit
              let dynamicLabel = config?.label;
              if (field === 'per_unit_price') {
                const selectedUnit = measurementUnits.find(unit => unit.id === formData.unit_of_measurement);
                const unitName = selectedUnit?.name || 'Unit';
                dynamicLabel = `Per ${unitName} Price`;
              }

              return (
                <View key={field} style={[styles.inputGroup, { zIndex: zIndexValue }]}>
                  <Text style={[
                    styles.label,
                    config?.required && styles.requiredLabel,
                    { color: config?.required ? theme.colors.status.error : theme.colors.text.primary }
                  ]}>
                    {dynamicLabel} {config?.required && '*'}
                    {config?.info && (
                      <Info size={12} color={theme.colors.text.muted} style={{ marginLeft: 4 }} />
                    )}
                    {isReadOnlyForExisting && (
                      <Text style={[styles.readOnlyIndicator, { color: theme.colors.text.muted }]}>
                        {' '}(Auto-filled)
                      </Text>
                    )}
                  </Text>
                  <FormInput
                    field={field}
                    fieldConfig={{
                      ...fieldConfig,
                      [field]: {
                        ...config,
                        disabled: isReadOnlyForExisting || config?.disabled
                      }
                    }}
                    value={formData[field as keyof ProductFormData]}
                    onChangeText={(value) => updateFormData(field as keyof ProductFormData, value)}
                    onBlur={() => { }}
                    errors={errors}
                    theme={theme}
                  />
                  {errors[field] && (
                    <Text style={[styles.errorText, { color: theme.colors.status.error }]}>
                      {errors[field]}
                    </Text>
                  )}
                  {config?.info && (
                    <Text style={[styles.infoText, { color: theme.colors.text.muted }]}>
                      {config.info}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    );
  };

  if (!canAddProduct) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar backgroundColor="rgba(0, 0, 0, 0.5)" barStyle="light-content" />
      <TouchableWithoutFeedback onPress={() => { }}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableWithoutFeedback>
            <Animated.View style={[
              styles.container,
              {
                backgroundColor: theme.colors.background,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
              }
            ]}>
              <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              >
                {/* Header */}
                <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.headerTitle}>
                    📦 {existingProduct ? 'Edit Product' : 'New Product'}
                  </Text>
                  <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <X size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {/* Step Indicator */}
                <StepIndicator currentStep={currentStep} steps={formSteps} theme={theme} />

                {/* Content */}
                {renderStepContent()}

                {/* Footer */}
                <View style={[styles.footer, {
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderTopColor: theme.colors.border
                }]}>
                  {currentStep > 0 ? (
                    <TouchableOpacity
                      style={[styles.button, styles.backButton, {
                        backgroundColor: theme.colors.backgroundTertiary,
                        borderColor: theme.colors.border
                      }]}
                      onPress={() => setCurrentStep(prev => prev - 1)}
                    >
                      <Text style={[styles.backButtonText, { color: theme.colors.text.primary }]}>
                        ← Back
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.button, styles.backButton, {
                        backgroundColor: theme.colors.backgroundTertiary,
                        borderColor: theme.colors.border
                      }]}
                      onPress={onClose}
                    >
                      <Text style={[styles.backButtonText, { color: theme.colors.text.primary }]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  )}

                  {currentStep < formSteps.length - 1 ? (
                    <TouchableOpacity
                      style={[styles.button, styles.nextButton, { backgroundColor: theme.colors.primary }]}
                      onPress={() => {
                        // Validate step 0 (product type selection)
                        if (currentStep === 0) {
                          if (productType === 'existing' && !selectedExistingProduct) {
                            showToast('Please select an existing product to continue.', 'warning');
                            return;
                          }
                        }
                        setCurrentStep(prev => prev + 1);
                      }}
                    >
                      <Text style={styles.nextButtonText}>Next →</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.button, styles.submitButton]}
                      onPress={onSubmitForm}
                      disabled={isLoading}
                    >
                      <Text style={styles.submitButtonText}>
                        {isLoading ? '⏳ Saving...' : `📦 ${existingProduct ? 'Update' : 'Add'} Product`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </KeyboardAvoidingView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 50,
  },
  container: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginHorizontal: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
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
    right: -25,
    width: 50,
    height: 2,
    zIndex: -1,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20, // Add padding to prevent content from being hidden behind footer
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    letterSpacing: 0.3,
  },
  calculatorCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  calculatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  calculatorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  calculatorContent: {
    gap: 8,
  },
  calculatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calculatorLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  calculatorValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  imageUploadContainer: {
    height: 140,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3B82F608',
    marginBottom: 16,
  },
  imageUploadContent: {
    alignItems: 'center',
  },
  imageUploadIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  imageUploadText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  imageUploadSubtext: {
    fontSize: 12,
    marginBottom: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  requiredLabel: {
    // Color set dynamically
  },
  input: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputDisabled: {
    opacity: 0.6,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  booleanContainer: {
    marginVertical: 4,
  },
  booleanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderRadius: 12,
  },
  booleanButtonActive: {
    // Styles applied dynamically
  },
  booleanIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  booleanIndicatorActive: {
    // Styles applied dynamically
  },
  booleanText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownContainerOpen: {
    zIndex: 9999,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownContent: {
    flex: 1,
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  dropdownList: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 12,
    elevation: 10000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    zIndex: 10000,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  dropdownListBottom: {
    top: '100%',
    marginTop: 4,
  },
  dropdownListTop: {
    bottom: '100%',
    marginBottom: 4,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownItemDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  dropdownItemCode: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 12,
    borderBottomWidth: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  addressRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addressInput: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    padding: 20,
    borderTopWidth: 2,
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
  backButton: {
    borderWidth: 2,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    // backgroundColor set dynamically
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  submitButton: {
    backgroundColor: '#10B981',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  productTypeContainer: {
    gap: 16,
    marginBottom: 24,
  },
  productTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  productTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productTypeContent: {
    flex: 1,
  },
  productTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productTypeDescription: {
    fontSize: 14,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonCheck: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  existingProductSection: {
    marginTop: 20,
  },
  selectedProductInfo: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  selectedProductTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedProductDetails: {
    fontSize: 12,
    marginBottom: 2,
  },
  readOnlyIndicator: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  stockSummary: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  stockSummaryText: {
    fontSize: 14,
    marginBottom: 2,
  },
});
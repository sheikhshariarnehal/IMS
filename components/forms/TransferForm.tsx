import React, { useState, useRef, useEffect } from 'react';
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
  StatusBar,
} from 'react-native';
import {
  X,
  Package,
  Repeat,
  MapPin,
  ArrowRight,
  Calendar,
  Clock,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  Star,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { FormService, type TransferFormData as FormServiceTransferData } from '@/lib/services/formService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TransferFormData {
  productId: string;
  productName: string;
  quantity: string;
  sourceLocation: string;
  destinationLocation: string;
  transferDate: Date;
  notes: string;
  lotNumber: string;
}

interface TransferFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: TransferFormData) => void;
  product: any;
  locations: string[];
}

// Enhanced location data with icons and types
const enhancedLocations = [
  { id: '1', name: 'Warehouse 1', type: 'warehouse', icon: '🏭' },
  { id: '2', name: 'Warehouse 2', type: 'warehouse', icon: '🏭' },
  { id: '3', name: 'Warehouse 3', type: 'warehouse', icon: '🏭' },
  { id: '4', name: 'Showroom 1', type: 'showroom', icon: '🏪' },
  { id: '5', name: 'Showroom 2', type: 'showroom', icon: '🏪' },
  { id: '6', name: 'Storage A', type: 'storage', icon: '📦' },
  { id: '7', name: 'Storage B', type: 'storage', icon: '📦' },
  { id: '8', name: 'Main Store', type: 'store', icon: '🏬' },
  { id: '9', name: 'Branch Store', type: 'store', icon: '🏬' },
  { id: '10', name: 'Online Warehouse', type: 'warehouse', icon: '💻' },
];

export default function TransferForm({ visible, onClose, onSubmit, product, locations }: TransferFormProps) {
  const { theme } = useTheme();
  const { hasPermission } = useAuth();
  const slideAnim = useRef(new Animated.Value(-screenHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const initialFormState: TransferFormData = {
    productId: product?.id || '',
    productName: product?.name || '',
    quantity: '',
    sourceLocation: product?.location || '',
    destinationLocation: '',
    transferDate: new Date(),
    notes: '',
    lotNumber: product?.lot || '',
  };

  const [formData, setFormData] = useState<TransferFormData>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [searchText, setSearchText] = useState('');

  const canTransferProduct = hasPermission('inventory', 'transfer');

  // Form steps for better UX
  const steps = [
    { title: 'Product Details', icon: Package },
    { title: 'Transfer Details', icon: Repeat },
    { title: 'Confirmation', icon: Check },
  ];

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

  // Reset form when opening
  useEffect(() => {
    if (visible && product) {
      setFormData({
        productId: product.id || '',
        productName: product.name || '',
        quantity: '',
        sourceLocation: product.location || '',
        destinationLocation: '',
        transferDate: new Date(),
        notes: '',
        lotNumber: product.lot || '',
      });
      setErrors({});
      setCurrentStep(0);
      setSearchText('');
    }
  }, [visible, product]);

  const handlePressOutside = () => {
    setShowLocationDropdown(false);
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!formData.quantity.trim()) {
        newErrors.quantity = 'Quantity is required';
      } else if (isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) {
        newErrors.quantity = 'Please enter a valid quantity';
      } else if (product && Number(formData.quantity) > product.stock) {
        newErrors.quantity = 'Quantity exceeds available stock';
      }

      if (!formData.lotNumber.trim()) {
        newErrors.lotNumber = 'Lot number is required';
      }
    } else if (currentStep === 1) {
      if (!formData.sourceLocation.trim()) {
        newErrors.sourceLocation = 'Source location is required';
      }

      if (!formData.destinationLocation.trim()) {
        newErrors.destinationLocation = 'Destination location is required';
      }

      if (formData.sourceLocation === formData.destinationLocation) {
        newErrors.destinationLocation = 'Source and destination cannot be the same';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!canTransferProduct) {
      Alert.alert('Permission Denied', 'You do not have permission to transfer products.');
      return;
    }

    if (!validateStep()) {
      return;
    }

    try {
      // Prepare transfer data for Supabase
      const transferData: FormServiceTransferData = {
        product_id: parseInt(product?.id || '1'),
        from_location_id: parseInt(formData.fromLocation),
        to_location_id: parseInt(formData.toLocation),
        quantity: parseFloat(formData.quantity),
        notes: formData.notes || undefined,
      };

      // Get current user from auth context
      const { user } = useAuth();
      if (!user?.id) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Create transfer using FormService
      const result = await FormService.createTransfer(transferData, user.id);

      if (result.success && result.data) {
        Alert.alert(
          'Success',
          'Transfer request has been created successfully!',
          [{ text: 'OK', onPress: () => { onSubmit(result.data); onClose(); } }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to create transfer request');
      }
    } catch (error) {
      console.error('Transfer creation error:', error);
      Alert.alert('Error', 'Failed to create transfer request');
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepItem}>
          <View 
            style={[
              styles.stepCircle, 
              index <= currentStep && styles.stepCircleActive
            ]}
          >
            <step.icon 
              size={16} 
              color={index <= currentStep ? '#FFFFFF' : theme.colors.text.muted} 
            />
          </View>
          <Text 
            style={[
              styles.stepText, 
              index <= currentStep && styles.stepTextActive
            ]}
          >
            {step.title}
          </Text>
          {index < steps.length - 1 && (
            <View 
              style={[
                styles.stepLine, 
                index < currentStep && styles.stepLineActive
              ]} 
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderEnhancedDropdown = () => {
    const filteredLocations = enhancedLocations.filter(location => 
      location.name.toLowerCase().includes(searchText.toLowerCase()) &&
      location.name !== formData.sourceLocation
    );

    return (
      <View style={styles.dropdownContainer}>
        <View style={[
          styles.searchInputContainer,
          { borderColor: errors.destinationLocation ? theme.colors.status.error : theme.colors.primary + '30' },
          showLocationDropdown && styles.searchInputContainerActive,
        ]}>
          <MapPin size={18} color={theme.colors.text.secondary} style={styles.inputIcon} />
          <TextInput
            style={styles.searchInput}
            value={showLocationDropdown ? searchText : formData.destinationLocation}
            onChangeText={(text) => {
              setSearchText(text);
              if (!showLocationDropdown) {
                setShowLocationDropdown(true);
              }
            }}
            onFocus={() => setShowLocationDropdown(true)}
            placeholder={formData.destinationLocation || 'Search destination location'}
            placeholderTextColor={theme.colors.text.muted}
          />
          <TouchableOpacity
            onPress={() => setShowLocationDropdown(!showLocationDropdown)}
          >
            <ChevronDown 
              size={20} 
              color={theme.colors.text.muted} 
              style={[
                styles.dropdownIcon,
                showLocationDropdown && { transform: [{ rotate: '180deg' }] }
              ]}
            />
          </TouchableOpacity>
        </View>
        
        {showLocationDropdown && (
          <View style={styles.dropdownList}>
            <ScrollView 
              nestedScrollEnabled={true}
              style={{ maxHeight: 200 }}
              showsVerticalScrollIndicator={false}
              bounces={true}
              scrollEventThrottle={16}
              decelerationRate="normal"
            >
              {filteredLocations.length > 0 ? filteredLocations.map((location, index) => (
                <TouchableOpacity
                  key={location.id}
                  style={[
                    styles.dropdownItem,
                    index === filteredLocations.length - 1 && { borderBottomWidth: 0 }
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, destinationLocation: location.name }));
                    setSearchText('');
                    setShowLocationDropdown(false);
                  }}
                >
                  <View style={styles.dropdownItemContent}>
                    <Text style={styles.dropdownItemIcon}>{location.icon}</Text>
                    <View style={styles.dropdownItemTextContainer}>
                      <Text style={styles.dropdownItemText}>{location.name}</Text>
                      <Text style={styles.dropdownItemType}>{location.type}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )) : (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No locations found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const renderProductDetailsStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Package size={18} color={theme.colors.primary} /> Product Information
        </Text>
        
        <View style={styles.productCard}>
          <View style={styles.productIconContainer}>
            <Package size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product?.name}</Text>
            <Text style={styles.productCode}>{product?.productCode}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Sparkles size={18} color={theme.colors.primary} /> Stock Information
        </Text>
        
        <View style={styles.stockCard}>
          <Text style={styles.stockLabel}>Available Stock</Text>
          <View style={styles.stockValueContainer}>
            <Text style={styles.stockValue}>{product?.stock}</Text>
            <Text style={styles.stockUnit}>units</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, styles.requiredLabel]}>Quantity to Transfer *</Text>
          <TextInput
            style={[styles.input, errors.quantity && styles.inputError]}
            placeholder="Enter quantity"
            keyboardType="numeric"
            value={formData.quantity}
            onChangeText={(text) => setFormData({ ...formData, quantity: text })}
            placeholderTextColor={theme.colors.text.muted}
          />
          {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, styles.requiredLabel]}>Lot Number *</Text>
          <TextInput
            style={[styles.input, errors.lotNumber && styles.inputError]}
            placeholder="Enter lot number"
            value={formData.lotNumber}
            onChangeText={(text) => setFormData({ ...formData, lotNumber: text })}
            placeholderTextColor={theme.colors.text.muted}
          />
          {errors.lotNumber && <Text style={styles.errorText}>{errors.lotNumber}</Text>}
        </View>
      </View>
    </View>
  );

  const renderTransferDetailsStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Repeat size={18} color={theme.colors.primary} /> Transfer Locations
        </Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Source Location</Text>
          <View style={styles.locationDisplayContainer}>
            <MapPin size={18} color={theme.colors.text.secondary} style={styles.inputIcon} />
            <Text style={styles.locationDisplayText}>{formData.sourceLocation}</Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, styles.requiredLabel]}>Destination Location *</Text>
          {renderEnhancedDropdown()}
          {errors.destinationLocation && <Text style={styles.errorText}>{errors.destinationLocation}</Text>}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Calendar size={18} color={theme.colors.primary} /> Transfer Details
        </Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Transfer Date</Text>
          <View style={styles.dateContainer}>
            <Calendar size={18} color={theme.colors.text.secondary} style={styles.inputIcon} />
            <Text style={styles.dateText}>
              {formData.transferDate.toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Add any additional notes about this transfer"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            placeholderTextColor={theme.colors.text.muted}
          />
        </View>
      </View>
    </View>
  );

  const renderConfirmationStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Check size={18} color={theme.colors.primary} /> Transfer Summary
        </Text>
        
        <View style={styles.confirmationCard}>
          <View style={styles.confirmationHeader}>
            <Text style={styles.confirmationTitle}>Review Transfer Details</Text>
          </View>

          <View style={styles.confirmationSection}>
            <Text style={styles.confirmationSectionTitle}>Product Details</Text>
            <View style={styles.confirmationItem}>
              <Text style={styles.confirmationLabel}>Product:</Text>
              <Text style={styles.confirmationValue}>{formData.productName}</Text>
            </View>
            <View style={styles.confirmationItem}>
              <Text style={styles.confirmationLabel}>Quantity:</Text>
              <Text style={styles.confirmationValue}>{formData.quantity} units</Text>
            </View>
            <View style={styles.confirmationItem}>
              <Text style={styles.confirmationLabel}>Lot Number:</Text>
              <Text style={styles.confirmationValue}>{formData.lotNumber}</Text>
            </View>
          </View>

          <View style={styles.confirmationDivider} />

          <View style={styles.confirmationSection}>
            <Text style={styles.confirmationSectionTitle}>Transfer Route</Text>
            <View style={styles.transferRoute}>
              <View style={styles.routeItem}>
                <Text style={styles.routeLabel}>From</Text>
                <Text style={styles.routeValue}>{formData.sourceLocation}</Text>
              </View>
              <ArrowRight size={20} color={theme.colors.primary} style={styles.routeArrow} />
              <View style={styles.routeItem}>
                <Text style={styles.routeLabel}>To</Text>
                <Text style={styles.routeValue}>{formData.destinationLocation}</Text>
              </View>
            </View>
            <View style={styles.confirmationItem}>
              <Text style={styles.confirmationLabel}>Date:</Text>
              <Text style={styles.confirmationValue}>{formData.transferDate.toLocaleDateString()}</Text>
            </View>
          </View>

          {formData.notes && (
            <>
              <View style={styles.confirmationDivider} />
              <View style={styles.confirmationSection}>
                <Text style={styles.confirmationSectionTitle}>Additional Notes</Text>
                <Text style={styles.notesText}>{formData.notes}</Text>
              </View>
            </>
          )}

          <View style={styles.confirmationAlert}>
            <AlertCircle size={18} color={theme.colors.status.warning} />
            <Text style={styles.confirmationAlertText}>
              This action will update inventory levels at both locations immediately.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderProductDetailsStep();
      case 1:
        return renderTransferDetailsStep();
      case 2:
        return renderConfirmationStep();
      default:
        return null;
    }
  };

  if (!canTransferProduct) {
    return null;
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
      backgroundColor: theme.colors.background,
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
      backgroundColor: theme.colors.primary,
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
      backgroundColor: theme.colors.backgroundSecondary,
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
      backgroundColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    stepCircleActive: {
      backgroundColor: theme.colors.primary,
    },
    stepText: {
      fontSize: 12,
      color: theme.colors.text.muted,
      textAlign: 'center',
      fontWeight: '500',
    },
    stepTextActive: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    stepLine: {
      position: 'absolute',
      top: 20,
      right: -50,
      width: 100,
      height: 2,
      backgroundColor: theme.colors.border,
      zIndex: -1,
    },
    stepLineActive: {
      backgroundColor: theme.colors.primary,
    },
    content: {
      flex: 1,
    },
    stepContent: {
      flex: 1,
      paddingHorizontal: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text.primary,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      letterSpacing: 0.3,
    },
    productCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    productIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    productInfo: {
      flex: 1,
    },
    productName: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    productCode: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      fontWeight: '500',
    },
    stockCard: {
      padding: 16,
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    stockLabel: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      fontWeight: '600',
      marginBottom: 8,
    },
    stockValueContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    stockValue: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    stockUnit: {
      fontSize: 16,
      color: theme.colors.text.secondary,
      marginLeft: 8,
      fontWeight: '500',
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 8,
      letterSpacing: 0.2,
    },
    requiredLabel: {
      color: theme.colors.status.error,
    },
    input: {
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.backgroundTertiary,
      fontWeight: '500',
    },
    inputError: {
      borderColor: theme.colors.status.error,
    },
    textArea: {
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.backgroundTertiary,
      fontWeight: '500',
      height: 100,
      textAlignVertical: 'top',
    },
    errorText: {
      fontSize: 12,
      color: theme.colors.status.error,
      marginTop: 6,
      fontWeight: '500',
    },
    locationDisplayContainer: {
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: theme.colors.backgroundTertiary,
      flexDirection: 'row',
      alignItems: 'center',
    },
    locationDisplayText: {
      fontSize: 16,
      color: theme.colors.text.primary,
      fontWeight: '500',
    },
    dropdownContainer: {
      position: 'relative',
      zIndex: 99999,
    },
    searchInputContainer: {
      borderWidth: 2,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: theme.colors.backgroundTertiary,
      flexDirection: 'row',
      alignItems: 'center',
    },
    searchInputContainerActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text.primary,
      fontWeight: '500',
    },
    inputIcon: {
      marginRight: 8,
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
      borderColor: theme.colors.primary + '30',
      borderRadius: 12,
      marginTop: 4,
      maxHeight: 200,
      zIndex: 999999,
      elevation: 999999,
      backgroundColor: theme.colors.background,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    dropdownItem: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '50',
    },
    dropdownItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dropdownItemIcon: {
      fontSize: 20,
      marginRight: 12,
    },
    dropdownItemTextContainer: {
      flex: 1,
    },
    dropdownItemText: {
      fontSize: 16,
      color: theme.colors.text.primary,
      fontWeight: '500',
    },
    dropdownItemType: {
      fontSize: 12,
      color: theme.colors.text.muted,
      marginTop: 2,
      textTransform: 'capitalize',
    },
    noResultsContainer: {
      padding: 20,
      alignItems: 'center',
    },
    noResultsText: {
      fontSize: 14,
      color: theme.colors.text.muted,
      fontStyle: 'italic',
    },
    dateContainer: {
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: theme.colors.backgroundTertiary,
      flexDirection: 'row',
      alignItems: 'center',
    },
    dateText: {
      fontSize: 16,
      color: theme.colors.text.primary,
      fontWeight: '500',
    },
    confirmationCard: {
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    confirmationHeader: {
      alignItems: 'center',
      marginBottom: 20,
    },
    confirmationTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    confirmationSection: {
      marginBottom: 16,
    },
    confirmationSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: 12,
    },
    confirmationItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    confirmationLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: theme.colors.text.secondary,
    },
    confirmationValue: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text.primary,
      flexShrink: 1,
      textAlign: 'right',
    },
    transferRoute: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      padding: 16,
      backgroundColor: theme.colors.backgroundTertiary,
      borderRadius: 12,
    },
    routeItem: {
      flex: 1,
      alignItems: 'center',
    },
    routeLabel: {
      fontSize: 12,
      color: theme.colors.text.muted,
      fontWeight: '500',
      marginBottom: 4,
    },
    routeValue: {
      fontSize: 14,
      color: theme.colors.text.primary,
      fontWeight: '600',
      textAlign: 'center',
    },
    routeArrow: {
      marginHorizontal: 16,
    },
    confirmationDivider: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      marginVertical: 16,
    },
    notesText: {
      fontSize: 14,
      color: theme.colors.text.primary,
      fontStyle: 'italic',
      backgroundColor: theme.colors.backgroundTertiary,
      padding: 12,
      borderRadius: 8,
    },
    confirmationAlert: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.status.warning + '20',
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      borderWidth: 1,
      borderColor: theme.colors.status.warning + '40',
    },
    confirmationAlertText: {
      fontSize: 14,
      color: theme.colors.status.warning,
      marginLeft: 12,
      flex: 1,
      fontWeight: '500',
    },
    footer: {
      flexDirection: 'row',
      gap: 16,
      padding: 20,
      borderTopWidth: 2,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.backgroundSecondary,
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
      backgroundColor: theme.colors.backgroundTertiary,
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
    backButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    nextButton: {
      backgroundColor: theme.colors.primary,
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
    disabledButton: {
      backgroundColor: theme.colors.text.muted,
    },
  });

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
          <TouchableWithoutFeedback>
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
              >
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>🔄 Transfer Product</Text>
                  <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <X size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {/* Step Indicator */}
                {renderStepIndicator()}

                {/* Content */}
                <ScrollView 
                  style={styles.content} 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  bounces={true}
                  scrollEventThrottle={16}
                  decelerationRate="normal"
                >
                  {renderStepContent()}
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                  {currentStep > 0 ? (
                    <TouchableOpacity 
                      style={[styles.button, styles.backButton]} 
                      onPress={handlePrevStep}
                    >
                      <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.button, styles.backButton]} 
                      onPress={onClose}
                    >
                      <Text style={styles.backButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                  
                  {currentStep < steps.length - 1 ? (
                    <TouchableOpacity 
                      style={[styles.button, styles.nextButton]} 
                      onPress={handleNextStep}
                    >
                      <Text style={styles.nextButtonText}>Next →</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.button, styles.submitButton, !canTransferProduct && styles.disabledButton]} 
                      onPress={handleSubmit}
                      disabled={!canTransferProduct}
                    >
                      <Text style={styles.submitButtonText}>🚀 Transfer Product</Text>
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
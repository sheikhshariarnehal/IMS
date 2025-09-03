import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  Package,
  Repeat,
  MapPin,
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  AlertCircle,
  Sparkles,
  Hash,
  Search,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { FormService } from '@/lib/services/formService';
import LotSelectionModal from './LotSelectionModal';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 768;

interface TransferFormData {
  productId: string;
  productName: string;
  quantity: string;
  sourceLocationId: string;
  sourceLocationName: string;
  destinationLocationId: string;
  destinationLocationName: string;
  transferDate: Date;
  notes: string;
  selectedLot: any;
}

interface Location {
  id: number;
  name: string;
  type: string;
  address: string;
}

interface TransferFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  product: any;
}

export default function TransferForm({ visible, onClose, onSubmit, product }: TransferFormProps) {
  const { theme } = useTheme();
  const { hasPermission, user } = useAuth();
  const slideAnim = useRef(new Animated.Value(-screenHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const initialFormState: TransferFormData = {
    productId: product?.id || '',
    productName: product?.name || '',
    quantity: '',
    sourceLocationId: product?.location_id?.toString() || '',
    sourceLocationName: product?.location_name || '',
    destinationLocationId: '',
    destinationLocationName: '',
    transferDate: new Date(),
    notes: '',
    selectedLot: null,
  };

  const [formData, setFormData] = useState<TransferFormData>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showLotSelection, setShowLotSelection] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

  const canTransferProduct = hasPermission('inventory', 'transfer');

  // Check if user can transfer from specific location
  const canTransferFromLocation = useCallback((locationId: string) => {
    return hasPermission('inventory', 'transfer', locationId);
  }, [hasPermission]);

  // Form steps for better UX
  const steps = [
    { title: 'Select Lot', icon: Hash },
    { title: 'Transfer Details', icon: Repeat },
    { title: 'Confirmation', icon: Check },
  ];

  // Fetch available locations
  useEffect(() => {
    const fetchLocations = async () => {
      console.log('🔄 Fetching locations for transfer form...');
      try {
        const result = await FormService.getActiveLocations();
        console.log('📍 Locations fetch result:', result);

        if (result.success && result.data) {
          console.log('✅ Setting available locations:', result.data);
          setAvailableLocations(result.data);
        } else {
          console.error('❌ Failed to fetch locations:', result.error);
          // Fallback: try to get locations from LocationContext
          console.log('🔄 Trying fallback location fetch...');
          const fallbackResult = await FormService.getLocations();
          console.log('📍 Fallback locations result:', fallbackResult);
          if (fallbackResult && fallbackResult.length > 0) {
            const activeLocations = fallbackResult.filter(loc => loc.status === 'active');
            console.log('✅ Using fallback locations:', activeLocations);
            setAvailableLocations(activeLocations);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching locations:', error);
        // Final fallback: try direct supabase query
        try {
          console.log('🔄 Trying direct supabase query...');
          const { supabase } = await import('@/lib/supabase');
          const { data: directData, error: directError } = await supabase
            .from('locations')
            .select('id, name, type, address')
            .eq('status', 'active')
            .order('name');

          if (directError) {
            console.error('❌ Direct query failed:', directError);
          } else {
            console.log('✅ Direct query success:', directData);
            setAvailableLocations(directData || []);
          }
        } catch (directQueryError) {
          console.error('❌ Direct query error:', directQueryError);
        }
      }
    };

    if (visible) {
      fetchLocations();
    }
  }, [visible]);

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

  // Reset form when opening or closing
  useEffect(() => {
    if (visible && product) {
      setFormData({
        productId: product.id || '',
        productName: product.name || '',
        quantity: '',
        sourceLocationId: product.location_id?.toString() || '',
        sourceLocationName: product.location_name || '',
        destinationLocationId: '',
        destinationLocationName: '',
        transferDate: new Date(),
        notes: '',
        selectedLot: null,
      });
      setErrors({});
      setCurrentStep(0);
      setSearchText('');
      setShowLocationDropdown(false);
      setShowLotSelection(false);
    } else if (!visible) {
      // Reset everything when modal closes
      resetForm();
    }
  }, [visible, product]);

  const handlePressOutside = () => {
    if (!loading) {
      setShowLocationDropdown(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setCurrentStep(0);
    setErrors({});
    setSearchText('');
    setShowLocationDropdown(false);
    setShowLotSelection(false);
    setLoading(false);
  };

  const handleLotSelection = (lot: any) => {
    setFormData(prev => ({ ...prev, selectedLot: lot }));
    setShowLotSelection(false);
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!formData.selectedLot) {
        newErrors.selectedLot = 'Please select a lot for transfer';
      }

      if (!formData.quantity.trim()) {
        newErrors.quantity = 'Quantity is required';
      } else if (isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) {
        newErrors.quantity = 'Please enter a valid quantity';
      } else if (formData.selectedLot && Number(formData.quantity) > formData.selectedLot.quantity) {
        newErrors.quantity = 'Quantity exceeds available quantity in selected lot';
      } else if (product && Number(formData.quantity) > product.total_stock) {
        newErrors.quantity = 'Quantity exceeds total available stock';
      }
    } else if (currentStep === 1) {
      if (!formData.sourceLocationId.trim()) {
        newErrors.sourceLocation = 'Source location is required';
      }

      if (!formData.destinationLocationId.trim()) {
        newErrors.destinationLocation = 'Destination location is required';
      }

      if (formData.sourceLocationId === formData.destinationLocationId) {
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

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    // Check location-specific permissions for admin users
    if (user.role === 'admin') {
      if (!canTransferFromLocation(formData.sourceLocationId)) {
        Alert.alert('Permission Denied', 'You do not have permission to transfer products from this location. Admins can only transfer from warehouses they have access to.');
        return;
      }
    }

    setLoading(true);
    try {
      // Prepare transfer data for enhanced transfer with lot management
      const transferData = {
        product_id: parseInt(product?.id || '1'),
        from_location_id: parseInt(formData.sourceLocationId),
        to_location_id: parseInt(formData.destinationLocationId),
        quantity: parseFloat(formData.quantity),
        selected_lot_id: formData.selectedLot?.id,
        notes: formData.notes || undefined,
      };

      // Create transfer using enhanced FormService method
      const result = await FormService.createTransferWithLot(transferData, user.id);

      if (result.success && result.data) {
        // Store form data for success message before reset
        const transferDetails = {
          productName: formData.productName,
          quantity: formData.quantity,
          sourceLocationName: formData.sourceLocationName,
          destinationLocationName: formData.destinationLocationName,
        };

        // Call onSubmit to refresh parent data
        onSubmit(result.data);

        // Reset form state immediately
        resetForm();

        // Close modal immediately
        onClose();

        // Show success message after modal is closed
        setTimeout(() => {
          Alert.alert(
            '✅ Transfer Successful!',
            `Transfer completed successfully!\n\n• Product: ${transferDetails.productName}\n• Quantity: ${transferDetails.quantity} units\n• From: ${transferDetails.sourceLocationName}\n• To: ${transferDetails.destinationLocationName}\n\nA new lot has been created at the destination location.`,
            [{ text: 'OK' }]
          );
        }, 300);
      } else {
        Alert.alert(
          '❌ Transfer Failed',
          result.error || 'Failed to create transfer request. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Transfer creation error:', error);
      Alert.alert('Error', 'Failed to create transfer request');
    } finally {
      setLoading(false);
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

  const renderLocationSelector = () => {
    const filteredLocations = availableLocations.filter(location =>
      location.name.toLowerCase().includes(searchText.toLowerCase()) &&
      location.id.toString() !== formData.sourceLocationId
    );

    const getLocationIcon = (type: string) => {
      switch (type) {
        case 'warehouse': return '🏭';
        case 'showroom': return '🏪';
        case 'storage': return '📦';
        case 'store': return '🏬';
        default: return '📍';
      }
    };

    console.log('🎯 Rendering location selector:', {
      availableLocations: availableLocations.length,
      filteredLocations: filteredLocations.length,
      sourceLocationId: formData.sourceLocationId,
      searchText
    });

    return (
      <View style={styles.locationSelectorContainer}>
        <Text style={styles.fieldLabel}>Destination Location *</Text>
        <TouchableOpacity
          style={[
            styles.locationSelectorButton,
            { borderColor: errors.destinationLocation ? theme.colors.status.error : theme.colors.border },
            showLocationDropdown && { borderColor: theme.colors.primary }
          ]}
          onPress={() => setShowLocationDropdown(!showLocationDropdown)}
          activeOpacity={0.7}
        >
          <View style={styles.locationSelectorContent}>
            <MapPin size={20} color={theme.colors.text.secondary} style={styles.inputIcon} />
            <View style={styles.locationSelectorTextContainer}>
              {formData.destinationLocationName ? (
                <View style={styles.selectedLocationInfo}>
                  <Text style={styles.selectedLocationText}>{formData.destinationLocationName}</Text>
                  <Text style={styles.selectedLocationSubtext}>
                    {getLocationIcon(availableLocations.find(l => l.id.toString() === formData.destinationLocationId)?.type || '')} {availableLocations.find(l => l.id.toString() === formData.destinationLocationId)?.type || 'Location'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.locationSelectorPlaceholder}>
                  {availableLocations.length === 0 ? 'Loading locations...' : 'Select destination location'}
                </Text>
              )}
            </View>
            <ChevronDown
              size={20}
              color={theme.colors.text.muted}
              style={[
                styles.dropdownIcon,
                showLocationDropdown && { transform: [{ rotate: '180deg' }] }
              ]}
            />
          </View>
        </TouchableOpacity>

        {errors.destinationLocation && (
          <Text style={styles.errorText}>{errors.destinationLocation}</Text>
        )}

        {availableLocations.length === 0 && (
          <Text style={styles.warningText}>
            No locations available. Please check your permissions or contact administrator.
          </Text>
        )}

        {/* Location Selection Modal */}
        <Modal
          visible={showLocationDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLocationDropdown(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowLocationDropdown(false)}>
            <View style={styles.locationModalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.locationModalContent}>
                  <View style={styles.locationModalHeader}>
                    <Text style={styles.locationModalTitle}>Select Destination Location</Text>
                    <TouchableOpacity
                      onPress={() => setShowLocationDropdown(false)}
                      style={styles.locationModalCloseButton}
                    >
                      <X size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.locationSearchContainer}>
                    <Search size={18} color={theme.colors.text.secondary} />
                    <TextInput
                      style={styles.locationSearchInput}
                      value={searchText}
                      onChangeText={setSearchText}
                      placeholder="Search locations..."
                      placeholderTextColor={theme.colors.text.muted}
                    />
                  </View>

                  {console.log('🎯 FlatList data:', filteredLocations)}

                  {/* Debug: Show locations count */}
                  <Text style={{ padding: 10, color: theme.colors.text.primary }}>
                    Available: {availableLocations.length}, Filtered: {filteredLocations.length}
                  </Text>

                  {/* Debug: Show first location directly */}
                  {filteredLocations.length > 0 && (
                    <Text style={{ padding: 10, color: theme.colors.text.primary }}>
                      First location: {filteredLocations[0].name}
                    </Text>
                  )}

                  <ScrollView style={styles.locationList} showsVerticalScrollIndicator={false}>
                    {filteredLocations.length > 0 ? (
                      filteredLocations.map((item) => (
                        <TouchableOpacity
                          key={item.id.toString()}
                          style={{
                            padding: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: theme.colors.border,
                            backgroundColor: theme.colors.background,
                          }}
                          onPress={() => {
                            console.log('📍 Selected location:', item);
                            setFormData(prev => ({
                              ...prev,
                              destinationLocationId: item.id.toString(),
                              destinationLocationName: item.name
                            }));
                            setSearchText('');
                            setShowLocationDropdown(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: theme.colors.text.primary,
                            marginBottom: 4,
                          }}>
                            {getLocationIcon(item.type)} {item.name}
                          </Text>
                          <Text style={{
                            fontSize: 14,
                            color: theme.colors.text.secondary,
                            textTransform: 'capitalize',
                          }}>
                            {item.type}
                          </Text>
                          {item.address && (
                            <Text style={{
                              fontSize: 12,
                              color: theme.colors.text.muted,
                              marginTop: 2,
                            }}>
                              {item.address}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={{
                        padding: 40,
                        alignItems: 'center',
                      }}>
                        <MapPin size={48} color={theme.colors.text.muted} />
                        <Text style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: theme.colors.text.primary,
                          textAlign: 'center',
                          marginTop: 16,
                        }}>
                          {searchText ? 'No locations found' : 'No locations available'}
                        </Text>
                        <Text style={{
                          fontSize: 14,
                          color: theme.colors.text.secondary,
                          textAlign: 'center',
                          marginTop: 8,
                        }}>
                          {searchText
                            ? 'Try adjusting your search terms'
                            : 'Please contact administrator to add locations'
                          }
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    );
  };

  const renderLotSelectionStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.section}>
        <View style={styles.sectionTitleContainer}>
          <Package size={18} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Product Information</Text>
        </View>

        <View style={styles.productCard}>
          <View style={styles.productIconContainer}>
            <Package size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product?.name}</Text>
            <Text style={styles.productCode}>{product?.product_code}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleContainer}>
          <Sparkles size={18} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Stock Information</Text>
        </View>

        <View style={styles.stockCard}>
          <Text style={styles.stockLabel}>Total Available Stock</Text>
          <View style={styles.stockValueContainer}>
            <Text style={styles.stockValue}>{product?.total_stock || product?.current_stock}</Text>
            <Text style={styles.stockUnit}>units</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, styles.requiredLabel]}>Select Lot *</Text>
          <TouchableOpacity
            style={[
              styles.input,
              styles.lotSelectionButton,
              errors.selectedLot && styles.inputError,
              formData.selectedLot && styles.lotSelectionButtonSelected
            ]}
            onPress={() => setShowLotSelection(true)}
            activeOpacity={0.7}
          >
            <View style={styles.lotSelectionContent}>
              {formData.selectedLot ? (
                <View style={styles.selectedLotInfo}>
                  <View style={styles.lotIconContainer}>
                    <Hash size={16} color={theme.colors.primary} />
                  </View>
                  <View style={styles.selectedLotTextContainer}>
                    <Text style={styles.selectedLotText}>
                      Lot {formData.selectedLot.lot_number}
                    </Text>
                    <Text style={styles.selectedLotSubtext}>
                      {formData.selectedLot.quantity} units available
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.lotSelectionPlaceholderContainer}>
                  <Package size={16} color={theme.colors.text.muted} />
                  <Text style={styles.lotSelectionPlaceholder}>Tap to select a lot</Text>
                </View>
              )}
              <ChevronDown size={20} color={theme.colors.text.muted} />
            </View>
          </TouchableOpacity>
          {errors.selectedLot && <Text style={styles.errorText}>{errors.selectedLot}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, styles.requiredLabel]}>Quantity to Transfer *</Text>
          <TextInput
            style={[styles.input, errors.quantity && styles.inputError]}
            placeholder="Enter quantity"
            keyboardType="numeric"
            value={formData.quantity}
            onChangeText={(text) => setFormData({ ...formData, quantity: text })}
            placeholderTextColor={theme.colors.text.muted}
            editable={!!formData.selectedLot}
          />
          {formData.selectedLot && (
            <Text style={styles.availableQuantityText}>
              Available in selected lot: {formData.selectedLot.quantity} units
            </Text>
          )}
          {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
        </View>
      </View>
    </View>
  );

  const renderTransferDetailsStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.section}>
        <View style={styles.sectionTitleContainer}>
          <Repeat size={18} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Transfer Locations</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Source Location</Text>
          <View style={styles.locationDisplayContainer}>
            <MapPin size={18} color={theme.colors.text.secondary} style={styles.inputIcon} />
            <Text style={styles.locationDisplayText}>{formData.sourceLocationName}</Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, styles.requiredLabel]}>Destination Location *</Text>
          {renderLocationSelector()}
          {errors.destinationLocation && <Text style={styles.errorText}>{errors.destinationLocation}</Text>}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleContainer}>
          <Calendar size={18} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Transfer Details</Text>
        </View>

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
        <View style={styles.sectionTitleContainer}>
          <Check size={18} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Transfer Summary</Text>
        </View>

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
            {formData.selectedLot && (
              <View style={styles.confirmationItem}>
                <Text style={styles.confirmationLabel}>Source Lot:</Text>
                <Text style={styles.confirmationValue}>Lot {formData.selectedLot.lot_number}</Text>
              </View>
            )}
          </View>

          <View style={styles.confirmationDivider} />

          <View style={styles.confirmationSection}>
            <Text style={styles.confirmationSectionTitle}>Transfer Route</Text>
            <View style={styles.transferRoute}>
              <View style={styles.routeItem}>
                <Text style={styles.routeLabel}>From</Text>
                <Text style={styles.routeValue}>{formData.sourceLocationName}</Text>
              </View>
              <ArrowRight size={20} color={theme.colors.primary} style={styles.routeArrow} />
              <View style={styles.routeItem}>
                <Text style={styles.routeLabel}>To</Text>
                <Text style={styles.routeValue}>{formData.destinationLocationName}</Text>
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
              This action will create a new lot at the destination location and update inventory levels.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderLotSelectionStep();
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
      justifyContent: isMobile ? 'flex-end' : 'center',
      alignItems: isMobile ? 'stretch' : 'center',
      padding: isMobile ? 0 : 20,
    },
    container: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: isMobile ? 24 : 16,
      borderTopRightRadius: isMobile ? 24 : 16,
      borderBottomLeftRadius: isMobile ? 0 : 16,
      borderBottomRightRadius: isMobile ? 0 : 16,
      maxHeight: isMobile ? '95%' : '90%',
      minHeight: isMobile ? '80%' : '70%',
      width: isMobile ? '100%' : Math.min(600, screenWidth * 0.9),
      alignSelf: 'center',
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.25,
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
      paddingHorizontal: isMobile ? 16 : 24,
      paddingVertical: isMobile ? 16 : 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text.primary,
      marginLeft: 8,
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
    locationSelectorContainer: {
      width: '100%',
    },
    locationSelectorButton: {
      borderWidth: 2,
      borderRadius: isMobile ? 12 : 8,
      paddingHorizontal: isMobile ? 16 : 20,
      paddingVertical: isMobile ? 14 : 16,
      backgroundColor: theme.colors.backgroundTertiary,
      minHeight: isMobile ? 56 : 60,
    },
    locationSelectorContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    locationSelectorTextContainer: {
      flex: 1,
      marginHorizontal: 12,
    },
    selectedLocationInfo: {
      flex: 1,
    },
    selectedLocationText: {
      fontSize: 16,
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    selectedLocationSubtext: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      marginTop: 2,
      textTransform: 'capitalize',
    },
    locationSelectorPlaceholder: {
      fontSize: 16,
      color: theme.colors.text.muted,
      fontStyle: 'italic',
    },
    inputIcon: {
      marginRight: 8,
    },
    dropdownIcon: {
      marginLeft: 8,
    },
    locationModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    locationModalContent: {
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      width: '100%',
      maxWidth: 400,
      maxHeight: '80%',
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
    },
    locationModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    locationModalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text.primary,
    },
    locationModalCloseButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.backgroundSecondary,
    },
    locationSearchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.backgroundSecondary,
    },
    locationSearchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text.primary,
      marginLeft: 12,
      paddingVertical: 8,
    },
    locationList: {
      flex: 1,
      minHeight: 200,
      maxHeight: 400,
    },
    locationItem: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '30',
    },
    locationItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    locationItemIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    locationItemIcon: {
      fontSize: 18,
    },
    locationItemTextContainer: {
      flex: 1,
    },
    locationItemName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    locationItemType: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      marginTop: 2,
      textTransform: 'capitalize',
    },
    locationItemAddress: {
      fontSize: 11,
      color: theme.colors.text.muted,
      marginTop: 2,
    },
    noLocationsContainer: {
      padding: 40,
      alignItems: 'center',
    },
    noLocationsText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.secondary,
      marginTop: 12,
    },
    noLocationsSubtext: {
      fontSize: 14,
      color: theme.colors.text.muted,
      marginTop: 4,
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
      opacity: 0.6,
    },
    submitButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    lotSelectionButton: {
      justifyContent: 'center',
      minHeight: 56,
    },
    lotSelectionButtonSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    lotSelectionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    selectedLotInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    lotIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    selectedLotTextContainer: {
      flex: 1,
    },
    selectedLotText: {
      fontSize: 16,
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    selectedLotSubtext: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      marginTop: 2,
    },
    lotSelectionPlaceholderContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    lotSelectionPlaceholder: {
      fontSize: 16,
      color: theme.colors.text.muted,
      fontStyle: 'italic',
      marginLeft: 8,
    },
    availableQuantityText: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      marginTop: 4,
      fontStyle: 'italic',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    loadingContainer: {
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      padding: 32,
      alignItems: 'center',
      minWidth: 200,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
    },
    loadingText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginTop: 16,
      textAlign: 'center',
    },
    loadingSubtext: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginTop: 8,
      textAlign: 'center',
    },
    fieldLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 8,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.status.error,
      marginTop: 4,
    },
    warningText: {
      fontSize: 14,
      color: theme.colors.status.warning,
      marginTop: 8,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      marginTop: 12,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
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
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                      resetForm();
                      onClose();
                    }}
                    disabled={loading}
                  >
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
                      disabled={loading}
                      activeOpacity={loading ? 1 : 0.7}
                    >
                      <Text style={[styles.backButtonText, loading && { opacity: 0.5 }]}>← Back</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.button, styles.backButton]}
                      onPress={() => {
                        resetForm();
                        onClose();
                      }}
                      disabled={loading}
                      activeOpacity={loading ? 1 : 0.7}
                    >
                      <Text style={[styles.backButtonText, loading && { opacity: 0.5 }]}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                  
                  {currentStep < steps.length - 1 ? (
                    <TouchableOpacity
                      style={[styles.button, styles.nextButton]}
                      onPress={handleNextStep}
                      disabled={loading}
                      activeOpacity={loading ? 1 : 0.8}
                    >
                      <Text style={[styles.nextButtonText, loading && { opacity: 0.5 }]}>Next →</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.submitButton,
                        (!canTransferProduct || loading) && styles.disabledButton
                      ]}
                      onPress={handleSubmit}
                      disabled={!canTransferProduct || loading}
                      activeOpacity={0.8}
                    >
                      <View style={styles.submitButtonContent}>
                        {loading ? (
                          <>
                            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                            <Text style={styles.submitButtonText}>Creating Transfer...</Text>
                          </>
                        ) : (
                          <Text style={styles.submitButtonText}>🚀 Transfer Product</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </KeyboardAvoidingView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Creating Transfer...</Text>
            <Text style={styles.loadingSubtext}>Please wait while we process your request</Text>
          </View>
        </View>
      )}

      {/* Lot Selection Modal */}
      <LotSelectionModal
        visible={showLotSelection && !loading}
        onClose={() => setShowLotSelection(false)}
        onSelectLot={handleLotSelection}
        productId={parseInt(product?.id || '0')}
        productName={product?.name || ''}
      />
    </Modal>
  );
}
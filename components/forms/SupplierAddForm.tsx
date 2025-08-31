import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableWithoutFeedback,
  StatusBar,
} from 'react-native';
import {
  X,
  Building,
  Phone,
  MapPin,
  CreditCard,
  Camera,
  Upload,
  Sparkles,
  ChevronDown,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { FormService, type SupplierFormData as FormServiceSupplierData } from '@/lib/services/formService';

const { height: screenHeight } = Dimensions.get('window');

// Types
interface Country {
  id: string;
  name: string;
  icon: string;
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
  options?: Country[];
}

interface SupplierFormData {
  supplierName: string;
  contactPerson: string;
  phone: string;
  email: string;
  alternatePhone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  paymentTerms: string;
  creditLimit: string;
  notes: string;
}

interface SupplierAddFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: SupplierFormData) => void;
  existingSupplier?: SupplierFormData;
}

// Form configuration
const formSteps: FormStep[] = [
  {
    title: 'Basic Info',
    icon: Building,
    fields: ['supplierName', 'contactPerson']
  },
  {
    title: 'Contact',
    icon: Phone,
    fields: ['phone', 'email', 'alternatePhone']
  },
  {
    title: 'Address',
    icon: MapPin,
    fields: ['address', 'city', 'state', 'zipCode', 'country']
  },
  {
    title: 'Financial',
    icon: CreditCard,
    fields: ['paymentTerms', 'creditLimit', 'notes']
  }
];

const countries: Country[] = [
  { id: 'bangladesh', name: 'Bangladesh', icon: '🇧🇩' },
  { id: 'china', name: 'China', icon: '🇨🇳' },
];

// Field configurations
const fieldConfig: Record<string, FieldConfig> = {
  supplierName: { label: 'Supplier Name', required: true, placeholder: 'Enter supplier name' },
  contactPerson: { label: 'Contact Person', required: true, placeholder: 'Enter contact person name' },
  phone: { label: 'Phone Number', required: true, placeholder: 'Enter phone number', keyboardType: 'phone-pad' },
  email: { label: 'Email Address', required: true, placeholder: 'Enter email address', keyboardType: 'email-address' },
  alternatePhone: { label: 'Alternate Phone', placeholder: 'Enter alternate phone number', keyboardType: 'phone-pad' },
  address: { label: 'Address', required: true, placeholder: 'Enter full address', multiline: true },
  city: { label: 'City', placeholder: 'Enter city' },
  state: { label: 'State', placeholder: 'Enter state' },
  zipCode: { label: 'ZIP Code', placeholder: 'Enter ZIP code', keyboardType: 'numeric' },
  country: { label: 'Country', type: 'dropdown', options: countries, placeholder: 'Select country' },
  paymentTerms: { label: 'Payment Terms (Days)', placeholder: '30', keyboardType: 'numeric' },
  creditLimit: { label: 'Credit Limit', placeholder: '0', keyboardType: 'numeric' },
  notes: { label: 'Notes', placeholder: 'Enter additional notes (optional)', multiline: true },
};

// Reusable Components
interface FormInputProps {
  field: string;
  fieldConfig: Record<string, FieldConfig>;
  value: string;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  errors: Record<string, any>;
  theme: any;
}

const FormInput: React.FC<FormInputProps> = ({ field, fieldConfig, value, onChangeText, onBlur, errors, theme }) => {
  const config = fieldConfig[field];

  if (config?.type === 'dropdown') {
    return (
      <DropdownField
        value={value}
        onChange={onChangeText}
        options={config.options || []}
        placeholder={`Select ${config.label.toLowerCase()}`}
        theme={theme}
        error={errors[field]}
      />
    );
  }

  return (
    <TextInput
      style={[
        styles.input,
        config?.multiline && styles.textArea,
        errors[field] && styles.inputError,
        { borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundTertiary }
      ]}
      value={value}
      onChangeText={onChangeText}
      onBlur={onBlur}
      placeholder={config?.placeholder}
      placeholderTextColor={theme.colors.text.muted}
      keyboardType={config?.keyboardType as any}
      multiline={config?.multiline}
      numberOfLines={config?.multiline ? 3 : 1}
      autoCapitalize={config?.keyboardType === 'email-address' ? 'none' : 'sentences'}
    />
  );
};

interface DropdownFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: Country[];
  placeholder: string;
  theme: any;
  error?: any;
}

const DropdownField: React.FC<DropdownFieldProps> = ({ value, onChange, options, placeholder, theme, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const dropdownRef = useRef<View>(null);

  const handleDropdownToggle = () => {
    if (!isOpen && dropdownRef.current) {
      dropdownRef.current.measure((x, y, width, height, pageX, pageY) => {
        const screenHeight = Dimensions.get('window').height;
        const dropdownHeight = Math.min(options.length * 60, 200);
        const spaceBelow = screenHeight - pageY - height - 100;
        const spaceAbove = pageY - 100;
        
        if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
          setDropdownPosition('top');
        } else {
          setDropdownPosition('bottom');
        }
      });
    }
    setIsOpen(!isOpen);
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
        <Text style={[
          styles.dropdownButtonText,
          { color: value ? theme.colors.text.primary : theme.colors.text.muted }
        ]}>
          {value || placeholder}
        </Text>
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
          <ScrollView 
            style={{ maxHeight: 200 }} 
            nestedScrollEnabled
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {options.map((item: Country) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.dropdownItem,
                  { borderBottomColor: theme.colors.border }
                ]}
                onPress={() => {
                  onChange(item.name);
                  setIsOpen(false);
                }}
              >
                <Text style={styles.dropdownItemIcon}>{item.icon}</Text>
                <Text style={[styles.dropdownItemText, { color: theme.colors.text.primary }]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
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

export default function SupplierAddForm({ visible, onClose, onSubmit, existingSupplier }: SupplierAddFormProps) {
  const { theme } = useTheme();
  const { hasPermission, user } = useAuth();
  const slideAnim = useRef(new Animated.Value(-screenHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SupplierFormData>({
    supplierName: '',
    contactPerson: '',
    phone: '',
    email: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Bangladesh',
    paymentTerms: '30',
    creditLimit: '0',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const canAddSupplier = hasPermission('suppliers', 'add');

  const generateSupplierCode = (name: string): string => {
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `SUP-${cleanName.slice(0, 3)}${timestamp}`;
  };

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

  // Reset form when opening
  React.useEffect(() => {
    if (visible) {
      if (existingSupplier) {
        setFormData(existingSupplier);
      } else {
        setFormData({
          supplierName: '',
          contactPerson: '',
          phone: '',
          email: '',
          alternatePhone: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'Bangladesh',
          paymentTerms: '30',
          creditLimit: '0',
          notes: '',
        });
      }
      setCurrentStep(0);
      setErrors({});
    }
  }, [visible, existingSupplier]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate required fields
    Object.entries(fieldConfig).forEach(([field, config]) => {
      if (config.required && !formData[field as keyof SupplierFormData]?.trim()) {
        newErrors[field] = `${config.label} is required`;
      }
    });

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmitForm = async () => {
    if (!canAddSupplier) {
      Alert.alert('Permission Denied', 'You do not have permission to add suppliers.');
      return;
    }

    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare supplier data for Supabase
      const supplierData: FormServiceSupplierData = {
        name: formData.contactPerson?.trim() || formData.supplierName.trim(),
        company_name: formData.supplierName.trim(),
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        payment_terms: formData.paymentTerms?.trim() || undefined,
      };

      // Check if user is authenticated
      if (!user?.id) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Create supplier using FormService
      const result = await FormService.createSupplier(supplierData, user.id);

      if (result.success && result.data) {
        Alert.alert(
          'Success',
          `Supplier "${result.data.company_name}" has been created successfully!`,
          [{ text: 'OK', onPress: () => {
            if (result.data) {
              // Convert Supplier back to SupplierFormData for onSubmit
              const supplierFormData: SupplierFormData = {
                supplierName: result.data.company_name,
                contactPerson: result.data.name,
                phone: result.data.phone || '',
                email: result.data.email || '',
                alternatePhone: '', // Not available in Supplier interface
                address: result.data.address || '',
                city: '', // Not available in Supplier interface
                state: '', // Not available in Supplier interface
                zipCode: '', // Not available in Supplier interface
                country: '', // Not available in Supplier interface
                paymentTerms: result.data.payment_terms || '',
                creditLimit: '0', // Not available in Supplier interface
                notes: '' // Not available in Supplier interface
              };
              onSubmit(supplierFormData);
            }
            onClose();
          } }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to create supplier');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create supplier';
      Alert.alert('Error', errorMessage);
      console.error('Supplier creation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof SupplierFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImagePicker = () => {
    Alert.alert('Select Image', 'Choose an option', [
      { text: 'Camera', onPress: () => console.log('Camera selected') },
      { text: 'Gallery', onPress: () => console.log('Gallery selected') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderStepContent = () => {
    const currentStepFields = formSteps[currentStep].fields;
    const isBasicStep = currentStep === 0;

    return (
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        {isBasicStep && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              <Sparkles size={18} color={theme.colors.primary} /> Company Logo
            </Text>
            <TouchableOpacity style={styles.imageUploadContainer} onPress={handleImagePicker}>
              <View style={styles.imageUploadContent}>
                <Camera size={32} color={theme.colors.primary} />
                <Text style={[styles.imageUploadText, { color: theme.colors.text.primary }]}>
                  Add company logo
                </Text>
                <View style={[styles.uploadButton, { backgroundColor: theme.colors.primary }]}>
                  <Upload size={16} color="#FFFFFF" />
                  <Text style={styles.uploadButtonText}>Choose File</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            {React.createElement(formSteps[currentStep].icon, { size: 18, color: theme.colors.primary })}
            {' '}{formSteps[currentStep].title} Information
          </Text>

          {currentStepFields.map((field) => {
            const config = fieldConfig[field];
            const isRowField = (field === 'city' || field === 'state') || (field === 'paymentTerms' || field === 'creditLimit');

            if (isRowField && (field === 'city' || field === 'paymentTerms')) {
              const nextField = field === 'city' ? 'state' : 'creditLimit';
              const nextConfig = fieldConfig[nextField];
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
                      value={formData[field as keyof SupplierFormData]}
                      onChangeText={(value) => updateFormData(field as keyof SupplierFormData, value)}
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
                      nextConfig?.required && styles.requiredLabel,
                      { color: nextConfig?.required ? theme.colors.status.error : theme.colors.text.primary }
                    ]}>
                      {nextConfig?.label} {nextConfig?.required && '*'}
                    </Text>
                    <FormInput
                      field={nextField}
                      fieldConfig={fieldConfig}
                      value={formData[nextField as keyof SupplierFormData]}
                      onChangeText={(value) => updateFormData(nextField as keyof SupplierFormData, value)}
                      onBlur={() => { }}
                      errors={errors}
                      theme={theme}
                    />
                    {errors[nextField] && (
                      <Text style={[styles.errorText, { color: theme.colors.status.error }]}>
                        {errors[nextField]}
                      </Text>
                    )}
                  </View>
                </View>
              );
            }

            if (field === 'state' || field === 'creditLimit') return null; // Already rendered in row

            // Assign higher z-index to fields that appear earlier in the form
            const fieldIndex = currentStepFields.indexOf(field);
            const zIndexValue = 2000 - fieldIndex * 100;
            
            return (
              <View key={field} style={[styles.inputGroup, { zIndex: zIndexValue }]}>
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
                  value={formData[field as keyof SupplierFormData]}
                  onChangeText={(value) => updateFormData(field as keyof SupplierFormData, value)}
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
            );
          })}
        </View>
      </ScrollView>
    );
  };

  if (!canAddSupplier) return null;

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
                  <Text style={styles.headerTitle}>✨ Add New Supplier</Text>
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
                      onPress={() => setCurrentStep(prev => prev + 1)}
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
                        {isLoading ? '⏳ Adding...' : '🚀 Add Supplier'}
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
    paddingBottom: 20,
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
  imageUploadContainer: {
    height: 140,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#3B82F640',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3B82F608',
    marginBottom: 16,
  },
  imageUploadContent: {
    alignItems: 'center',
  },
  imageUploadText: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 8,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
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
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: '500',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
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
});





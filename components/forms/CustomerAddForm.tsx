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
  User,
  Phone,
  MapPin,
  Building,
  Camera,
  Upload,
  Sparkles,
  ChevronDown,
  CreditCard,
  Users,
  Info,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { FormService, type CustomerFormData as FormServiceCustomerData } from '@/lib/services/formService';

const { height: screenHeight } = Dimensions.get('window');

// Types
interface CustomerType {
  id: string;
  name: string;
  description: string;
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
  options?: CustomerType[];
  info?: string;
}

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  company_name: string;
  delivery_address: string;
  customer_type: string;
  total_purchases: string;
  total_due: string;
  red_list_status: boolean;
  fixed_coupon: string;
  profile_picture: string;
}

interface CustomerAddFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => void;
  existingCustomer?: CustomerFormData;
}

// Form configuration
const formSteps: FormStep[] = [
  {
    title: 'Basic Info',
    icon: User,
    fields: ['name', 'email', 'phone']
  },
  {
    title: 'Address',
    icon: MapPin,
    fields: ['address', 'delivery_address', 'company_name']
  },
  {
    title: 'Business',
    icon: Building,
    fields: ['customer_type', 'total_purchases', 'total_due']
  },
  {
    title: 'Profile & Status',
    icon: Users,
    fields: ['profile_picture', 'red_list_status', 'fixed_coupon']
  }
];

const customerTypes: CustomerType[] = [
  { id: 'regular', name: 'Regular', description: 'Standard customer', icon: '👤' },
  { id: 'vip', name: 'VIP', description: 'Premium customer with special benefits', icon: '⭐' },
  { id: 'wholesale', name: 'Wholesale', description: 'Bulk purchase customer', icon: '🏢' },
];

// Field configurations
const fieldConfig: Record<string, FieldConfig> = {
  name: { label: 'Customer Name', required: true, placeholder: 'Enter customer name' },
  email: { label: 'Email Address', placeholder: 'Enter email address', keyboardType: 'email-address' },
  phone: { label: 'Phone Number', placeholder: 'Enter phone number', keyboardType: 'phone-pad' },
  address: { label: 'Billing Address', placeholder: 'Enter billing address', multiline: true },
  company_name: { label: 'Company Name', placeholder: 'Enter company name (optional)' },
  delivery_address: { label: 'Delivery Address', placeholder: 'Enter delivery address', multiline: true },
  customer_type: {
    label: 'Customer Type',
    type: 'dropdown',
    options: customerTypes,
    placeholder: 'Select customer type',
    info: 'Choose customer category for pricing and benefits'
  },
  total_purchases: {
    label: 'Total Purchases',
    placeholder: '0.00',
    keyboardType: 'numeric',
    info: 'Lifetime purchase amount'
  },
  total_due: {
    label: 'Outstanding Amount',
    placeholder: '0.00',
    keyboardType: 'numeric',
    info: 'Total amount due from customer'
  },
  red_list_status: {
    label: 'Red List Status',
    type: 'boolean',
    placeholder: 'No',
    info: 'Mark customer as overdue payment risk'
  },
  fixed_coupon: {
    label: 'Fixed Coupon',
    placeholder: 'Enter coupon code',
    info: 'Assigned discount coupon for customer'
  },
  profile_picture: {
    label: 'Profile Picture',
    type: 'image',
    placeholder: 'Upload profile picture'
  },
};

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

  if (config?.type === 'image') {
    return null; // Handled separately in the form
  }

  return (
    <TextInput
      style={[
        styles.input,
        config?.multiline && styles.textArea,
        errors[field] && styles.inputError,
        { borderColor: errors[field] ? theme.colors.status.error : theme.colors.border, backgroundColor: theme.colors.backgroundTertiary }
      ]}
      value={value?.toString() || ''}
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
  onChange: (value: string | boolean) => void;
  options: CustomerType[];
  placeholder: string;
  theme: any;
  error?: string;
}

const DropdownField: React.FC<DropdownFieldProps> = ({ value, onChange, options, placeholder, theme, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const dropdownRef = useRef<View>(null);

  const selectedOption = options.find((option: CustomerType) => option.id === value);

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
        <View style={styles.dropdownContent}>
          <Text style={[
            styles.dropdownButtonText,
            { color: selectedOption ? theme.colors.text.primary : theme.colors.text.muted }
          ]}>
            {selectedOption ? `${selectedOption.icon} ${selectedOption.name}` : placeholder}
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
          <ScrollView
            style={{ maxHeight: 200 }}
            nestedScrollEnabled
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {options.map((item: CustomerType) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.dropdownItem,
                  { borderBottomColor: theme.colors.border }
                ]}
                onPress={() => {
                  onChange(item.id);
                  setIsOpen(false);
                }}
              >
                <View>
                  <Text style={[styles.dropdownItemText, { color: theme.colors.text.primary }]}>
                    {item.icon} {item.name}
                  </Text>
                  <Text style={[styles.dropdownItemDescription, { color: theme.colors.text.muted }]}>
                    {item.description}
                  </Text>
                </View>
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

export default function CustomerAddForm({ visible, onClose, onSubmit, existingCustomer }: CustomerAddFormProps) {
  const { theme } = useTheme();
  const { hasPermission, user } = useAuth();
  const slideAnim = useRef(new Animated.Value(-screenHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    company_name: '',
    delivery_address: '',
    customer_type: 'regular',
    total_purchases: '0.00',
    total_due: '0.00',
    red_list_status: false,
    fixed_coupon: '',
    profile_picture: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const canAddCustomer = hasPermission('customers', 'add');

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
      if (existingCustomer) {
        setFormData(existingCustomer);
      } else {
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          company_name: '',
          delivery_address: '',
          customer_type: 'regular',
          total_purchases: '0.00',
          total_due: '0.00',
          red_list_status: false,
          fixed_coupon: '',
          profile_picture: '',
        });
      }
      setCurrentStep(0);
      setErrors({});
    }
  }, [visible, existingCustomer]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate required fields
    Object.entries(fieldConfig).forEach(([field, config]) => {
      if (config.required && !formData[field as keyof CustomerFormData]?.toString().trim()) {
        newErrors[field] = `${config.label} is required`;
      }
    });

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (basic)
    if (formData.phone && formData.phone.length < 10) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Numeric field validation
    if (formData.total_purchases && isNaN(parseFloat(formData.total_purchases))) {
      newErrors.total_purchases = 'Please enter a valid amount';
    }
    if (formData.total_due && isNaN(parseFloat(formData.total_due))) {
      newErrors.total_due = 'Please enter a valid amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmitForm = async () => {
    if (!canAddCustomer) {
      Alert.alert('Permission Denied', 'You do not have permission to add customers.');
      return;
    }

    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare customer data for Supabase
      const customerData: FormServiceCustomerData = {
        name: formData.name.trim(),
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        company_name: formData.company_name?.trim() || undefined,
        delivery_address: formData.delivery_address?.trim() || undefined,
        customer_type: formData.customer_type as 'vip' | 'wholesale' | 'regular',
        fixed_coupon: formData.fixed_coupon?.trim() || undefined,
      };

      // Get current user from auth context
      if (!user?.id) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Create customer using FormService
      const result = await FormService.createCustomer(customerData, user.id);

      if (result.success && result.data) {
        Alert.alert(
          'Success',
          `Customer "${result.data.name}" has been ${existingCustomer ? 'updated' : 'created'} successfully!`,
          [{ text: 'OK', onPress: () => {
            // Transform the database result back to form data format
            const transformedData: CustomerFormData = {
              name: result.data!.name,
              email: result.data!.email || '',
              phone: result.data!.phone || '',
              address: result.data!.address || '',
              company_name: result.data!.company_name || '',
              delivery_address: result.data!.delivery_address || '',
              customer_type: result.data!.customer_type,
              total_purchases: result.data!.total_purchases.toString(),
              total_due: result.data!.total_due.toString(),
              red_list_status: result.data!.red_list_status,
              fixed_coupon: result.data!.fixed_coupon || '',
              profile_picture: result.data!.profile_picture || ''
            };
            onSubmit(transformedData);
            onClose();
          } }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to save customer');
      }
    } catch (error: unknown) {
      console.error('Customer creation error:', error);

      // Check if this is a hook call error
      if (error instanceof Error && error.message.includes('Invalid hook call')) {
        console.error('Hook call error detected in CustomerAddForm');
        console.error('Stack trace:', error.stack);
        Alert.alert(
          'Development Error',
          'Invalid hook call detected. This is a development issue that needs to be fixed.'
        );
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save customer';
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof CustomerFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImagePicker = () => {
    Alert.alert('Select Profile Picture', 'Choose an option', [
      { text: 'Camera', onPress: () => console.log('Camera selected') },
      { text: 'Gallery', onPress: () => console.log('Gallery selected') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderStepContent = () => {
    const currentStepFields = formSteps[currentStep].fields;
    const isProfileStep = currentStep === 3;

    return (
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        {/* Profile picture section for step 3 */}
        {isProfileStep && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              <Sparkles size={18} color={theme.colors.primary} /> Profile Picture
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
                  Add customer photo
                </Text>
                <Text style={[styles.imageUploadSubtext, { color: theme.colors.text.muted }]}>
                  PNG, JPG up to 5MB
                </Text>
                <View style={[styles.uploadButton, { backgroundColor: theme.colors.primary }]}>
                  <Upload size={16} color="#FFFFFF" />
                  <Text style={styles.uploadButtonText}>Choose Photo</Text>
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
            if (field === 'profile_picture') return null; // Already handled above

            const config = fieldConfig[field];
            const isRowField = (field === 'total_purchases' || field === 'total_due');

            // Assign higher z-index to fields that appear earlier in the form
            const fieldIndex = currentStepFields.indexOf(field);
            const zIndexValue = 2000 - fieldIndex * 100;

            if (isRowField && field === 'total_purchases') {
              return (
                <View key={field} style={styles.addressRow}>
                  <View style={[styles.addressInput, { zIndex: 1002 }]}>
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
                      value={formData[field as keyof CustomerFormData]}
                      onChangeText={(value) => updateFormData(field as keyof CustomerFormData, value)}
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
                  <View style={[styles.addressInput, { zIndex: 1001 }]}>
                    <Text style={[
                      styles.label,
                      fieldConfig.total_due?.required && styles.requiredLabel,
                      { color: fieldConfig.total_due?.required ? theme.colors.status.error : theme.colors.text.primary }
                    ]}>
                      {fieldConfig.total_due?.label} {fieldConfig.total_due?.required && '*'}
                      {fieldConfig.total_due?.info && (
                        <Info size={12} color={theme.colors.text.muted} style={{ marginLeft: 4 }} />
                      )}
                    </Text>
                    <FormInput
                      field="total_due"
                      fieldConfig={fieldConfig}
                      value={formData.total_due}
                      onChangeText={(value) => updateFormData('total_due', value)}
                      onBlur={() => { }}
                      errors={errors}
                      theme={theme}
                    />
                    {errors.total_due && (
                      <Text style={[styles.errorText, { color: theme.colors.status.error }]}>
                        {errors.total_due}
                      </Text>
                    )}
                    {fieldConfig.total_due?.info && (
                      <Text style={[styles.infoText, { color: theme.colors.text.muted }]}>
                        {fieldConfig.total_due.info}
                      </Text>
                    )}
                  </View>
                </View>
              );
            }

            if (field === 'total_due') return null; // Already rendered in row

            return (
              <View key={field} style={[styles.inputGroup, { zIndex: zIndexValue }]}>
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
                  value={formData[field as keyof CustomerFormData]}
                  onChangeText={(value) => updateFormData(field as keyof CustomerFormData, value)}
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
      </ScrollView>
    );
  };

  if (!canAddCustomer) return null;

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
                    👤 {existingCustomer ? 'Edit Customer' : 'Add New Customer'}
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
                        {isLoading ? '⏳ Saving...' : `👤 ${existingCustomer ? 'Update' : 'Add'} Customer`}
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
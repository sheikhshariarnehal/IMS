import React, { useState, useRef, useEffect } from 'react';
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
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { FormService, type CategoryFormData as FormServiceCategoryData } from '@/lib/services/formService';
// Mock interface for UI demo
interface CreateCategoryData {
  name: string;
  description?: string;
  color?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CategoryFormData {
  categoryName: string;
  categoryCode: string;
  description: string;
  color_code: string;
}

interface CategoryAddFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => void;
  existingCategory?: any;
}



export default function CategoryAddForm({ visible, onClose, onSubmit, existingCategory }: CategoryAddFormProps) {
  const { theme } = useTheme();
  const { user, hasPermission } = useAuth();
  const slideAnim = useRef(new Animated.Value(-screenHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const [formData, setFormData] = useState<CategoryFormData>({
    categoryName: '',
    categoryCode: '',
    description: '',
    color_code: '#3B82F6',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);


  const canAddCategory = hasPermission('products', 'add');

  // Single form without steps

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
    if (visible) {
      if (!existingCategory) {
        setFormData({
          categoryName: '',
          categoryCode: '',
          description: '',
          color_code: '#3B82F6',
        });
      }
      setErrors({});
    }
  }, [visible, existingCategory]);

  // Auto-generate category code
  useEffect(() => {
    if (formData.categoryName && !existingCategory) {
      const code = generateCategoryCode(formData.categoryName);
      setFormData(prev => ({ ...prev, categoryCode: code }));
    }
  }, [formData.categoryName]);

  const generateCategoryCode = (name: string) => {
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const timestamp = Date.now().toString().slice(-3);
    return `${cleanName.slice(0, 3)}${timestamp}`;
  };

  const handlePressOutside = () => {
    // Handle outside press if needed
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.categoryName.trim()) {
      newErrors.categoryName = 'Category name is required';
    } else if (formData.categoryName.length < 3) {
      newErrors.categoryName = 'Category name must be at least 3 characters';
    }

    if (!formData.categoryCode.trim()) {
      newErrors.categoryCode = 'Category code is required';
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!canAddCategory) {
      Alert.alert('Permission Denied', 'You do not have permission to add categories.');
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Prepare category data for Supabase
      const categoryData: FormServiceCategoryData = {
        name: formData.categoryName.trim(),
        description: formData.description.trim() || undefined,
      };

      // Get current user from auth context
      console.log('Current user in CategoryAddForm:', user);
      if (!user?.id) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      console.log('Creating category with user ID:', user.id);
      // Create category using FormService
      const result = await FormService.createCategory(categoryData, user.id);

      if (result.success && result.data) {
        Alert.alert(
          'Success',
          `Category "${result.data.name}" has been created successfully!`,
          [{
            text: 'OK', onPress: () => {
              onSubmit({
                categoryName: result.data.name,
                categoryCode: result.data.id.toString(),
                description: result.data.description || '',
                color_code: formData.color_code,
              });
              handleClose();
            }
          }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to create category');
      }
    } catch (error: any) {
      console.error('Failed to create category:', error);
      Alert.alert('Error', error.message || 'Failed to create category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      categoryName: '',
      categoryCode: '',
      description: '',
      color_code: '#3B82F6',
    });
    setErrors({});
    onClose();
  };





  const renderBasicInfoStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Sparkles size={18} color={theme.colors.primary} /> Basic Information
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, styles.requiredLabel]}>Category Name *</Text>
          <TextInput
            style={[styles.input, errors.categoryName && styles.inputError]}
            value={formData.categoryName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, categoryName: text }))}
            placeholder="Enter category name"
            placeholderTextColor={theme.colors.text.muted}
          />
          {errors.categoryName && <Text style={styles.errorText}>{errors.categoryName}</Text>}
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.flex1]}>
            <Text style={[styles.label, styles.requiredLabel]}>Category Code *</Text>
            <TextInput
              style={[styles.input, errors.categoryCode && styles.inputError]}
              value={formData.categoryCode}
              onChangeText={(text) => setFormData(prev => ({ ...prev, categoryCode: text }))}
              placeholder="Auto-generated"
              placeholderTextColor={theme.colors.text.muted}
            />
            {errors.categoryCode && <Text style={styles.errorText}>{errors.categoryCode}</Text>}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Category description"
            placeholderTextColor={theme.colors.text.muted}
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category Color</Text>
          <View style={styles.colorContainer}>
            {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'].map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  formData.color_code === color && styles.colorOptionSelected
                ]}
                onPress={() => setFormData(prev => ({ ...prev, color_code: color }))}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );



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
      height: 100,
      textAlignVertical: 'top',
    },
    errorText: {
      fontSize: 12,
      color: theme.colors.status.error,
      marginTop: 6,
      fontWeight: '500',
    },
    row: {
      flexDirection: 'row',
      gap: 16,
    },
    flex1: {
      flex: 1,
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
    colorContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 8,
    },
    colorOption: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 3,
      borderColor: 'transparent',
    },
    colorOptionSelected: {
      borderColor: theme.colors.text.primary,
    },
  });

  if (!canAddCategory) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0, 0, 0, 0.6)" barStyle="light-content" />
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
                  ]
                }
              ]}
            >
              <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              >
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>✨ Add New Category</Text>
                  <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                    <X size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {/* Content */}
                <ScrollView
                  style={styles.content}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  bounces={true}
                  scrollEventThrottle={16}
                  decelerationRate="normal"
                >
                  {renderBasicInfoStep()}
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                  <TouchableOpacity
                    style={[styles.button, styles.backButton]}
                    onPress={handleClose}
                  >
                    <Text style={styles.backButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.submitButton]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                  >
                    <Text style={styles.submitButtonText}>
                      {isLoading ? '⏳ Saving...' : '🚀 Save Category'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
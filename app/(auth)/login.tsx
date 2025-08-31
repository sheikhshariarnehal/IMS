import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

// Login credentials interface
interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

// Demo credentials for testing (updated for Supabase)
const demoCredentials = [
  {
    email: 'admin@serranotex.com',
    password: 'admin123',
    role: 'Super Admin',
    description: 'Full system access'
  },
  {
    email: 'sales1@serranotex.com',
    password: 'password',
    role: 'Sales Manager',
    description: 'Sales and customer management'
  },
  {
    email: 'investor@serranotex.com',
    password: 'password',
    role: 'Investor',
    description: 'Read-only dashboard access'
  }
];

export default function LoginPage() {
  const { theme } = useTheme();
  const { login } = useAuth();
  const router = useRouter();

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!credentials.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!credentials.password) {
      errors.password = 'Password is required';
    } else if (credentials.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Use Supabase authentication
      const result = await login({
        email: credentials.email,
        password: credentials.password
      });

      if (!result.success) {
        Alert.alert('Login Failed', result.error || 'Invalid email or password. Please use one of the demo credentials.');
        setIsLoading(false);
        return;
      }

      // Navigate to dashboard
      router.replace('/dashboard');

      Alert.alert(
        'Login Successful',
        `Welcome back!\nConnected to Supabase database.`
      );
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Error', 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginCredentials, value: string | boolean) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const fillDemoCredentials = (email: string, password: string) => {
    setCredentials(prev => ({ ...prev, email, password }));
    setValidationErrors({});
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    logo: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 18,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 24,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    demoCredentials: {
      backgroundColor: theme.colors.backgroundSecondary,
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
    },
    demoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 8,
    },
    demoSubtitle: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      marginBottom: 12,
      fontStyle: 'italic',
    },
    demoItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    demoItemLast: {
      borderBottomWidth: 0,
    },
    demoRole: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text.primary,
    },
    demoEmail: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      marginBottom: 2,
    },
    demoDescription: {
      fontSize: 11,
      color: theme.colors.text.muted,
      fontStyle: 'italic',
    },
    demoButton: {
      backgroundColor: theme.colors.primary + '20',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    demoButtonText: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text.primary,
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.input,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    inputWrapperError: {
      borderColor: theme.colors.status.error,
    },
    inputIcon: {
      marginRight: 12,
    },
    textInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text.primary,
    },
    eyeButton: {
      padding: 4,
      marginLeft: 8,
    },
    errorText: {
      fontSize: 12,
      color: theme.colors.status.error,
      marginTop: 4,
    },
    rememberContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    rememberRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: theme.colors.border,
      marginRight: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    checkboxText: {
      fontSize: 14,
      color: theme.colors.text.primary,
    },
    forgotButton: {
      padding: 4,
    },
    forgotText: {
      fontSize: 14,
      color: theme.colors.primary,
      textDecorationLine: 'underline',
    },
    loginButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    loginButtonDisabled: {
      opacity: 0.6,
    },
    loginButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.inverse,
      marginLeft: 8,
    },
    footer: {
      textAlign: 'center',
      marginTop: 24,
      fontSize: 12,
      color: theme.colors.text.muted,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>Serrano Tex</Text>
            <Text style={styles.subtitle}>Inventory Management System</Text>
          </View>

          <View style={styles.card}>
            {/* Demo Credentials */}
            <View style={styles.demoCredentials}>
              <Text style={styles.demoTitle}>Demo Credentials:</Text>
              <Text style={styles.demoSubtitle}>
                Use these credentials to test different user roles
              </Text>

              {demoCredentials.map((user, index) => (
                <View
                  key={user.email}
                  style={[styles.demoItem, index === demoCredentials.length - 1 && styles.demoItemLast]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.demoRole}>{user.role}</Text>
                    <Text style={styles.demoEmail}>{user.email}</Text>
                    <Text style={styles.demoDescription}>{user.description}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.demoButton}
                    onPress={() => fillDemoCredentials(user.email, user.password)}
                  >
                    <Text style={styles.demoButtonText}>Use</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[
                styles.inputWrapper,
                validationErrors.email && styles.inputWrapperError
              ]}>
                <Mail size={20} color={theme.colors.text.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.colors.text.muted}
                  value={credentials.email}
                  onChangeText={(text) => handleInputChange('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
              {validationErrors.email && (
                <Text style={styles.errorText}>{validationErrors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[
                styles.inputWrapper,
                validationErrors.password && styles.inputWrapperError
              ]}>
                <Lock size={20} color={theme.colors.text.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.colors.text.muted}
                  value={credentials.password}
                  onChangeText={(text) => handleInputChange('password', text)}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={theme.colors.text.muted} />
                  ) : (
                    <Eye size={20} color={theme.colors.text.muted} />
                  )}
                </TouchableOpacity>
              </View>
              {validationErrors.password && (
                <Text style={styles.errorText}>{validationErrors.password}</Text>
              )}
            </View>

            {/* Remember Me & Forgot Password */}
            <View style={styles.rememberContainer}>
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => handleInputChange('rememberMe', !credentials.rememberMe)}
                disabled={isLoading}
              >
                <View style={[
                  styles.checkbox,
                  credentials.rememberMe && styles.checkboxChecked
                ]}>
                  {credentials.rememberMe && (
                    <Text style={{ color: theme.colors.text.inverse, fontSize: 12 }}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkboxText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotButton} disabled={isLoading}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading && <Loader2 size={20} color={theme.colors.text.inverse} />}
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.footer}>
              © 2025 Serrano Tex. All rights reserved.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
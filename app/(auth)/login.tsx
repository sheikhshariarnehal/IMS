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
        Alert.alert('Login Failed', result.error || 'Invalid email or password. Please check your credentials and try again.');
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



  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
      minHeight: '100%',
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 48,
    },
    logo: {
      fontSize: 36,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 12,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      fontWeight: '400',
      opacity: 0.8,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 20,
      padding: 32,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
      borderWidth: 1,
      borderColor: theme.colors.border + '20',
    },
    welcomeContainer: {
      marginBottom: 32,
      alignItems: 'center',
    },
    welcomeTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text.primary,
      marginBottom: 8,
      letterSpacing: -0.3,
    },
    welcomeSubtitle: {
      fontSize: 16,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      fontWeight: '400',
      opacity: 0.8,
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 10,
      letterSpacing: 0.2,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.input,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      paddingHorizontal: 18,
      paddingVertical: 16,
      minHeight: 56,
    },
    inputWrapperError: {
      borderColor: theme.colors.status.error,
      backgroundColor: theme.colors.status.error + '08',
    },
    inputIcon: {
      marginRight: 14,
      opacity: 0.7,
    },
    textInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text.primary,
      fontWeight: '400',
    },
    eyeButton: {
      padding: 8,
      marginLeft: 8,
      borderRadius: 8,
    },
    errorText: {
      fontSize: 13,
      color: theme.colors.status.error,
      marginTop: 6,
      fontWeight: '500',
    },
    rememberContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 32,
      marginTop: 8,
    },
    rememberRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.colors.border,
      marginRight: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    },
    checkboxChecked: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    checkboxText: {
      fontSize: 15,
      color: theme.colors.text.primary,
      fontWeight: '500',
    },
    forgotButton: {
      padding: 8,
    },
    forgotText: {
      fontSize: 15,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    loginButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      minHeight: 56,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    loginButtonDisabled: {
      opacity: 0.6,
      shadowOpacity: 0.1,
    },
    loginButtonText: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.text.inverse,
      marginLeft: 8,
      letterSpacing: 0.3,
    },
    footer: {
      textAlign: 'center',
      marginTop: 32,
      fontSize: 13,
      color: theme.colors.text.muted,
      fontWeight: '400',
      opacity: 0.7,
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
            {/* Welcome Message */}
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>Welcome Back</Text>
              <Text style={styles.welcomeSubtitle}>Sign in to your account to continue</Text>
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
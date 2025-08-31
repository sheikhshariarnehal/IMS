import { useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function Index() {
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  // Optimize navigation with useCallback
  const navigateToDestination = useCallback(() => {
    if (user) {
      // User is authenticated, redirect to dashboard
      router.replace('/dashboard');
    } else {
      // User is not authenticated, redirect to login
      router.replace('/(auth)/login');
    }
  }, [user, router]);

  useEffect(() => {
    if (!isLoading) {
      navigateToDestination();
    }
  }, [isLoading, navigateToDestination]);

  // Pre-compute styles
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    }
  });

  // Show loading screen while checking authentication
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}
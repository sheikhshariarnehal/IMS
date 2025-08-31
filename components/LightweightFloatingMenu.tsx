import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';

const LightweightFloatingMenu = memo(function LightweightFloatingMenu() {
  const { theme } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    router.push('/add');
  };

  return (
    <TouchableOpacity
      style={[styles.centerButton, { backgroundColor: theme.colors.navigation.active }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Plus size={24} color={theme.colors.text.inverse} strokeWidth={2.5} />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default LightweightFloatingMenu;
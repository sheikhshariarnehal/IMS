import React from 'react';
import { View, StyleSheet } from 'react-native';
import LotIncrementTest from '@/components/test/LotIncrementTest';
import { useTheme } from '@/contexts/ThemeContext';

export default function TestLotsPage() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LotIncrementTest />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

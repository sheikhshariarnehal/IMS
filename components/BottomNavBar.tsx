import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Search, Plus, Clock, User, Bell, Repeat } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter, usePathname } from 'expo-router';
// Removed useFastNavigation for direct router usage
import OptimizedFloatingMenu from './OptimizedFloatingMenu';

interface BottomNavBarProps {
  activeTab?: string;
}

const BottomNavBar = React.memo(function BottomNavBar({ activeTab }: BottomNavBarProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  // Direct router usage for maximum performance

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      route: '/dashboard',
    },
    {
      id: 'search',
      label: 'Product',
      icon: Search,
      route: '/products',
    },
    {
      id: 'add',
      label: '',
      icon: Plus,
      route: '/add',
      isCenter: true,
    },
    {
      id: 'sales',
      label: 'Sales',
      icon: Clock,
      route: '/sales',
    },
    {
      id: 'transfer',
      label: 'Transfer',
      icon: Repeat,
      route: '/transfer',
    },
  ];

  const handleTabPress = useCallback((item: typeof navItems[0]) => {
    if (item.route) {
      // Direct router navigation for maximum performance
      router.replace(item.route as any);
    }
  }, [router]);

  const isActive = useCallback((route: string) => {
    return pathname === route || activeTab === route.replace('/', '');
  }, [pathname, activeTab]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: theme.colors.navigation.background,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.navigation.border,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 10,
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
    },
    centerButton: {
      width: theme.spacing.xxl + theme.spacing.md, // 56 = 48 + 8
      height: theme.spacing.xxl + theme.spacing.md, // 56 = 48 + 8
      borderRadius: (theme.spacing.xxl + theme.spacing.md) / 2, // 28 = 56 / 2
      backgroundColor: theme.colors.navigation.active,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -20,
      shadowColor: theme.colors.navigation.active,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    tabLabel: {
      fontSize: 12,
      marginTop: 4,
      fontWeight: '500',
    },
    activeLabel: {
      color: theme.colors.navigation.active,
    },
    inactiveLabel: {
      color: theme.colors.navigation.inactive,
    },
  }), [theme]);

  return (
    <View style={styles.container}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.tabItem}
          onPress={() => handleTabPress(item)}
          activeOpacity={0.3}
        >
          {item.isCenter ? (
            <OptimizedFloatingMenu />
          ) : (
            <>
              <item.icon
                size={24}
                color={isActive(item.route) ? theme.colors.navigation.active : theme.colors.navigation.inactive}
                strokeWidth={isActive(item.route) ? 2.5 : 2}
              />
              {item.label && (
                <Text
                  style={[
                    styles.tabLabel,
                    isActive(item.route) ? styles.activeLabel : styles.inactiveLabel,
                  ]}
                >
                  {item.label}
                </Text>
              )}
            </>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
});

export default BottomNavBar;

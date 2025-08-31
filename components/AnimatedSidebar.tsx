import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Users,
  Truck,
  FileText,
  Bell,
  Activity,
  Settings,
  Circle as HelpCircle,
  LogOut,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter, usePathname } from 'expo-router';

const { width } = Dimensions.get('window');
const isMobile = width < 768;
const SIDEBAR_WIDTH = 260;

// Calculate navbar height including status bar on Android
const getNavbarHeight = () => {
  const baseHeight = 56; // Base navbar height
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  return baseHeight + statusBarHeight;
};

interface AnimatedSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
}

interface MenuItem {
  icon: any;
  label: string;
  route: string;
}

const AnimatedSidebar = React.memo(function AnimatedSidebar({ isOpen, onClose, onLogout }: AnimatedSidebarProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  // Direct router usage for maximum performance

  const navbarHeight = getNavbarHeight();

  const slideAnim = useRef(new Animated.Value(isMobile ? -SIDEBAR_WIDTH : 0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', route: '/dashboard' },
    { icon: Package, label: 'Products', route: '/products' },
    { icon: Warehouse, label: 'Inventory', route: '/inventory' },
    { icon: ShoppingCart, label: 'Sales & Invoicing', route: '/sales' },
    { icon: Users, label: 'Customers', route: '/customers' },
    { icon: Truck, label: 'Suppliers', route: '/suppliers' },
    { icon: Package, label: 'Sample Tracking', route: '/samples' },
    { icon: FileText, label: 'Reports', route: '/reports' },
    { icon: Bell, label: 'Notifications', route: '/notification' },
    { icon: Activity, label: 'Activity Logs', route: '/logs' },
    { icon: Settings, label: 'Settings', route: '/settings' },
    { icon: HelpCircle, label: 'Help & Support', route: '/support' },
  ];

  useEffect(() => {
    if (isMobile) {
      // Instant positioning for super fast navigation
      slideAnim.setValue(isOpen ? 0 : -SIDEBAR_WIDTH);
      overlayOpacity.setValue(isOpen ? 1 : 0);
    } else {
      // For desktop, sidebar is always visible
      slideAnim.setValue(0);
    }
  }, [isOpen, slideAnim, overlayOpacity]);

  const handleMenuItemPress = useCallback((item: MenuItem) => {
    // Close sidebar immediately for instant visual feedback
    if (isMobile) {
      onClose();
    }
    // Direct router navigation for maximum performance
    if (item.route) {
      router.replace(item.route as any);
    }
  }, [router, onClose]);

  const isMenuItemActive = useCallback((route: string) => {
    return pathname === route;
  }, [pathname]);

  const handleLogoutPress = useCallback(() => {
    if (onLogout) {
      onLogout();
    }
    if (isMobile) {
      onClose();
    }
  }, [onLogout, onClose]);

  const styles = useMemo(() => StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: navbarHeight, // Start below the navbar (including status bar)
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.overlay,
      zIndex: 999,
    },
    sidebar: {
      width: SIDEBAR_WIDTH,
      backgroundColor: theme.colors.card,
      borderRightWidth: 1,
      borderRightColor: theme.colors.border,
      paddingVertical: theme.spacing.lg,
      position: 'absolute',
      top: navbarHeight, // Start below the navbar (including status bar)
      bottom: 0,
      left: 0,
      zIndex: 1000,
      elevation: isMobile ? 10 : 0,
      shadowColor: isMobile ? theme.colors.shadow : 'transparent',
      shadowOffset: { width: 2, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    mobileHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    mobileHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    logoIcon: {
      width: 28,
      height: 28,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.sm,
      backgroundColor: theme.colors.primary,
    },
    logoText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.colors.text.inverse,
    },
    logoTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text.primary,
    },
    closeButton: {
      padding: theme.spacing.xs,
      marginLeft: theme.spacing.sm,
    },
    logo: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },
    desktopLogoIcon: {
      width: 32,
      height: 32,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.sm,
      backgroundColor: theme.colors.primary,
    },
    desktopLogoText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text.inverse,
    },
    desktopLogoTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text.primary,
    },
    userProfile: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },

    avatarFallback: {
      width: 40,
      height: 40,
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    avatarText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text.inverse,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    userRole: {
      fontSize: 12,
      color: theme.colors.text.secondary,
    },
    menu: {
      flex: 1,
      paddingHorizontal: theme.spacing.md,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.xs,
    },
    menuItemActive: {
      backgroundColor: theme.colors.primary + '20',
    },
    menuItemText: {
      marginLeft: theme.spacing.md,
      fontSize: 14,
      color: theme.colors.text.secondary,
    },
    menuItemTextActive: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      marginTop: theme.spacing.sm,
      marginHorizontal: theme.spacing.md,
    },
    logoutText: {
      marginLeft: theme.spacing.md,
      fontSize: 13,
      color: theme.colors.status.error,
    },
  }), [theme, navbarHeight]);

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <Animated.View
          style={[styles.overlay, { opacity: overlayOpacity }]}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={onClose}
            activeOpacity={1}
          />
        </Animated.View>
      )}

      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >




        {/* Menu Items */}
        <View style={styles.menu}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = isMenuItemActive(item.route);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  isActive && styles.menuItemActive,
                ]}
                onPress={() => handleMenuItemPress(item)}
                activeOpacity={0.3}
              >
                <Icon
                  size={20}
                  color={isActive ? theme.colors.primary : theme.colors.text.secondary}
                />
                <Text
                  style={[
                    styles.menuItemText,
                    isActive && styles.menuItemTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogoutPress}
          activeOpacity={0.7}
        >
          <LogOut size={18} color={theme.colors.status.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
});

export default AnimatedSidebar;
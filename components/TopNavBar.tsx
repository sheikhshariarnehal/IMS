import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import {
  Menu,
  Calendar,
  Bell,
  Search,
  ArrowLeft,
  X,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'expo-router';
import { useCustomNavigation } from '@/hooks/useCustomNavigation';
import ProfilePopup from './ProfilePopup';

const { width } = Dimensions.get('window');
const isMobile = width < 768;
const isTablet = width >= 768 && width < 1024;

interface TopNavBarProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  showSearch?: boolean;
  showCalendar?: boolean;
  showNotifications?: boolean;
  showProfile?: boolean;
  onMenuPress?: () => void;
  onSearchPress?: () => void;
  onCalendarPress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  rightContent?: React.ReactNode;
  backgroundColor?: string;
  sidebarOpen?: boolean;
  originalTitle?: string; // Store the original title to restore when sidebar closes
}

export default function TopNavBar({
  title = '',
  subtitle = '',
  showBackButton = false,
  showMenuButton = true,
  showSearch = false,
  showCalendar = true,
  showNotifications = true,
  showProfile = true,
  onMenuPress,
  onSearchPress,
  onCalendarPress,
  onNotificationPress,
  onProfilePress,
  rightContent,
  backgroundColor,
  sidebarOpen = false,
  originalTitle,
}: TopNavBarProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const { handleBackPress } = useCustomNavigation();
  // Direct router usage for maximum performance

  // Always show menu button instead of back button for easy sidebar access
  const shouldShowBackButton = false; // Disabled - always show menu button

  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      setShowProfilePopup(true);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Determine what title to show based on sidebar state
  const getDisplayTitle = () => {
    if (sidebarOpen && isMobile) {
      return 'Menu';
    }
    return originalTitle || title;
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: backgroundColor || theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 3,
      zIndex: 1000,
    },
    topNav: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      minHeight: 56,
    },
    topNavLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    menuButton: {
      padding: theme.spacing.xs,
      marginRight: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
    },
    backButton: {
      padding: theme.spacing.xs,
      marginRight: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text.primary,
    },
    subtitle: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      marginTop: 2,
    },
    topNavActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    dateText: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      marginRight: theme.spacing.xs,
    },
    iconButton: {
      padding: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchButton: {
      backgroundColor: theme.colors.backgroundSecondary,
    },
    notificationBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.status.error,
    },
    profileButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
    },
    profileImage: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    profileFallback: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text.inverse,
    },
    profileAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileAvatarText: {
      color: theme.colors.text.inverse,
      fontSize: 12,
      fontWeight: '600',
    },
  });

  return (
    <>
      <View style={styles.container}>
        <View style={styles.topNav}>
          <View style={styles.topNavLeft}>
            {shouldShowBackButton ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackPress}
                activeOpacity={0.3}
              >
                <ArrowLeft size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            ) : showMenuButton ? (
              <TouchableOpacity
                style={styles.menuButton}
                onPress={onMenuPress}
                activeOpacity={0.3}
              >
                {sidebarOpen ? (
                  <X size={24} color={theme.colors.text.primary} />
                ) : (
                  <Menu size={24} color={theme.colors.text.primary} />
                )}
              </TouchableOpacity>
            ) : null}

            <View style={styles.titleContainer}>
              {(title || originalTitle) && <Text style={styles.title}>{getDisplayTitle()}</Text>}
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          </View>

          <View style={styles.topNavActions}>
            {rightContent || (
              <>
                {/* Hide date on mobile, show on tablet and desktop */}
                {!isMobile && <Text style={styles.dateText}>{getCurrentDate()}</Text>}

                {showSearch && (
                  <TouchableOpacity
                    style={[styles.iconButton, styles.searchButton]}
                    onPress={onSearchPress}
                    activeOpacity={0.7}
                  >
                    <Search size={20} color={theme.colors.text.secondary} />
                  </TouchableOpacity>
                )}

                {/* Hide calendar on mobile, show on tablet and desktop */}
                {showCalendar && !isMobile && (
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={onCalendarPress}
                    activeOpacity={0.7}
                  >
                    <Calendar size={20} color={theme.colors.text.secondary} />
                  </TouchableOpacity>
                )}

                {showNotifications && (
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={onNotificationPress || (() => router.replace('/notification'))}
                    activeOpacity={0.7}
                  >
                    <Bell size={20} color={theme.colors.text.secondary} />
                    <View style={styles.notificationBadge} />
                  </TouchableOpacity>
                )}

                {showProfile && user && (
                  <TouchableOpacity
                    style={styles.profileButton}
                    onPress={handleProfilePress}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.profileText}>
                      {getUserInitials(user.name)}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </View>

      {/* Profile Popup */}
      <ProfilePopup
        visible={showProfilePopup}
        onClose={() => setShowProfilePopup(false)}
      />
    </>
  );
}
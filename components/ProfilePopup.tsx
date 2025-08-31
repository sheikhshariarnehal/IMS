import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import {
  User,
  Settings,
  Code,
  LogOut,
  ChevronRight,
  X,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const isMobile = width < 768;

interface ProfilePopupProps {
  visible: boolean;
  onClose: () => void;
  anchorPosition?: { x: number; y: number };
}

export default function ProfilePopup({ visible, onClose, anchorPosition }: ProfilePopupProps) {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      router.replace('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProfileSettings = () => {
    onClose();
    router.push('/settings');
  };

  const handleDeveloperAccess = () => {
    onClose();
    // Navigate to API documentation or developer section
    // For now, we'll just close the popup
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'manager':
        return 'Manager';
      case 'sales_manager':
        return 'Sales Manager';
      case 'user':
        return 'User';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: isMobile ? 'center' : 'flex-start', // Changed from 'flex-end' to 'center'
      alignItems: isMobile ? 'center' : 'flex-end',
      paddingTop: isMobile ? 0 : 60,
      paddingRight: isMobile ? 0 : 20,
    },
    popup: {
      backgroundColor: theme.colors.card,
      borderRadius: isMobile ? 20 : 12,
      width: isMobile ? width - 32 : 320,
      maxHeight: isMobile ? height * 0.8 : 400,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 16,
      marginBottom: isMobile ? 16 : 0,
    },
    header: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    closeButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarText: {
      color: theme.colors.text.inverse,
      fontSize: 18,
      fontWeight: '600',
    },
    userDetails: {
      flex: 1,
    },
    userName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 2,
    },
    userEmail: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginBottom: 4,
    },
    userRole: {
      fontSize: 12,
      color: theme.colors.primary,
      backgroundColor: theme.colors.primaryLight + '20',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },
    menuSection: {
      paddingVertical: 8,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '30',
    },
    menuItemLast: {
      borderBottomWidth: 0,
    },
    menuItemLogout: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      marginTop: 8,
    },
    menuIcon: {
      marginRight: 12,
    },
    menuContent: {
      flex: 1,
    },
    menuTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text.primary,
      marginBottom: 2,
    },
    menuSubtitle: {
      fontSize: 12,
      color: theme.colors.text.secondary,
    },
    menuTitleLogout: {
      color: theme.colors.status.error,
    },
    menuSubtitleLogout: {
      color: theme.colors.status.error + '80',
    },
    chevron: {
      opacity: 0.5,
    },
  });

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={styles.popup}
        >
          {/* Header with User Info */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={16} color={theme.colors.text.secondary} />
            </TouchableOpacity>

            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getUserInitials(user.name)}
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userRole}>
                  {getRoleDisplayName(user.role)}
                </Text>
              </View>
            </View>
          </View>

          {/* Menu Items */}
          <View style={styles.menuSection}>
            {/* Developer Access */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleDeveloperAccess}
              activeOpacity={0.7}
            >
              <Code size={20} color={theme.colors.text.secondary} style={styles.menuIcon} />
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Developer</Text>
                <Text style={styles.menuSubtitle}>API Access & Documentation</Text>
              </View>
              <ChevronRight size={16} color={theme.colors.text.secondary} style={styles.chevron} />
            </TouchableOpacity>

            {/* Profile Settings */}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={handleProfileSettings}
              activeOpacity={0.7}
            >
              <Settings size={20} color={theme.colors.text.secondary} style={styles.menuIcon} />
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Settings</Text>
                <Text style={styles.menuSubtitle}>Preferences & Security</Text>
              </View>
              <ChevronRight size={16} color={theme.colors.text.secondary} style={styles.chevron} />
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLogout]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <LogOut size={20} color={theme.colors.status.error} style={styles.menuIcon} />
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, styles.menuTitleLogout]}>Logout</Text>
                <Text style={[styles.menuSubtitle, styles.menuSubtitleLogout]}>End your session</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
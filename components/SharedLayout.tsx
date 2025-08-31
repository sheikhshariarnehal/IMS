import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useCustomNavigation } from '@/hooks/useCustomNavigation';
import TopNavBar from '@/components/TopNavBar';
import AnimatedSidebar from '@/components/AnimatedSidebar';
import BottomNavBar from '@/components/BottomNavBar';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

interface SharedLayoutProps {
  children: React.ReactNode;
  title: string;
  showCalendar?: boolean;
  showNotifications?: boolean;
  showProfile?: boolean;
  onLogout?: () => void;
}

const SharedLayout = React.memo(function SharedLayout({
  children,
  title,
  showCalendar = true,
  showNotifications = true,
  showProfile = true,
  onLogout,
}: SharedLayoutProps) {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { handleBackPress } = useCustomNavigation();

  const handleCalendarPress = useCallback(() => {
    // Handle calendar press - you can implement calendar modal here
    console.log('Calendar pressed');
  }, []);

  const handleMenuPress = useCallback(() => {
    // Instant sidebar toggle for super fast response
    setSidebarOpen(prev => !prev);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    layout: {
      flex: 1,
      flexDirection: 'row',
      marginLeft: !isMobile ? 260 : 0,
    },
    mainContent: {
      flex: 1,
    },
    content: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
  }), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedSidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        onLogout={onLogout}
      />
      
      <View style={styles.layout}>
        <View style={styles.mainContent}>
          <TopNavBar
            title={title}
            originalTitle={title}
            showMenuButton={true}
            showBackButton={false}
            showCalendar={showCalendar}
            showNotifications={showNotifications}
            showProfile={showProfile}
            onMenuPress={handleMenuPress}
            onCalendarPress={handleCalendarPress}
            sidebarOpen={sidebarOpen}
          />
          
          <View style={styles.content}>
            {children}
          </View>
          
          {isMobile && <BottomNavBar />}
        </View>
      </View>
    </SafeAreaView>
  );
});

export default SharedLayout;
import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet, Dimensions, Text, TouchableWithoutFeedback, Platform } from 'react-native';
import { Plus, Package, Users, Tag, Truck, ShoppingCart, LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import ProductAddForm from './forms/ProductAddForm';
import CustomerAddForm from './forms/CustomerAddForm';
import CategoryAddForm from './forms/CategoryAddForm';
import SupplierAddForm from './forms/SupplierAddForm';
import SalesForm from './forms/SalesForm';

const { width: screenWidth } = Dimensions.get('window');

interface MenuAction {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

interface FloatingActionMenuProps {
  onMenuItemPress?: (action: MenuAction) => void;
}

interface AnimationValues {
  overlayOpacity: Animated.Value;
  menuScale: Animated.Value;
  buttonOpacities: Animated.Value[];
  buttonScales: Animated.Value[];
  centerButtonRotation: Animated.Value;
}

interface MenuState {
  isOpen: boolean;
  isAnimating: boolean;
  activeButton: string | null;
}

export default function FloatingActionMenu({ onMenuItemPress }: FloatingActionMenuProps) {
  const { theme } = useTheme();
  const [menuState, setMenuState] = useState<MenuState>({
    isOpen: false,
    isAnimating: false,
    activeButton: null,
  });

  // Form visibility states
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showSalesForm, setShowSalesForm] = useState(false);

  // Enhanced menu actions configuration with better colors
  const menuActions: MenuAction[] = [
    { id: 'products', label: 'Add Products', icon: Package, color: '#2563eb' },
    { id: 'customer', label: 'Customer', icon: Users, color: '#16a34a' },
    { id: 'category', label: 'Category', icon: Tag, color: '#ea580c' },
    { id: 'suppliers', label: 'Suppliers', icon: Truck, color: '#dc2626' },
    { id: 'sales', label: 'Sales', icon: ShoppingCart, color: '#059669' }
  ];

  // Animation values
  const animationValues = useRef<AnimationValues>({
    overlayOpacity: new Animated.Value(0),
    menuScale: new Animated.Value(0),
    buttonOpacities: Array(5).fill(0).map(() => new Animated.Value(0)),
    buttonScales: Array(5).fill(0).map(() => new Animated.Value(0)),
    centerButtonRotation: new Animated.Value(0),
  }).current;

  const toggleMenu = () => {
    if (menuState.isAnimating) return;

    setMenuState(prev => ({ ...prev, isAnimating: true }));

    if (menuState.isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  const openMenu = () => {
    setMenuState(prev => ({ ...prev, isOpen: true }));

    // Animate overlay fade in
    Animated.timing(animationValues.overlayOpacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    // Animate center button rotation
    Animated.spring(animationValues.centerButtonRotation, {
      toValue: 1,
      tension: 120,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Animate menu scale
    Animated.spring(animationValues.menuScale, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Animate menu buttons with stagger effect
    const buttonAnimations = animationValues.buttonOpacities.map((opacity, index) => {
      return Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          delay: index * 60,
          useNativeDriver: true,
        }),
        Animated.spring(animationValues.buttonScales[index], {
          toValue: 1,
          tension: 120,
          friction: 7,
          delay: index * 60,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(buttonAnimations).start(() => {
      setMenuState(prev => ({ ...prev, isAnimating: false }));
    });
  };

  const closeMenu = () => {
    // Animate overlay fade out
    Animated.timing(animationValues.overlayOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Animate center button rotation back
    Animated.spring(animationValues.centerButtonRotation, {
      toValue: 0,
      tension: 120,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Animate menu scale down
    Animated.timing(animationValues.menuScale, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Animate menu buttons out with reverse stagger
    const buttonAnimations = animationValues.buttonOpacities.map((opacity, index) => {
      return Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          delay: (menuActions.length - 1 - index) * 40,
          useNativeDriver: true,
        }),
        Animated.timing(animationValues.buttonScales[index], {
          toValue: 0,
          duration: 200,
          delay: (menuActions.length - 1 - index) * 40,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(buttonAnimations).start(() => {
      setMenuState(prev => ({ ...prev, isOpen: false, isAnimating: false }));
    });
  };

  // Log when menu state changes
  useEffect(() => {
    console.log('Menu state changed:', menuState.isOpen);
  }, [menuState.isOpen]);

  const handleOverlayPress = () => {
    console.log('Overlay pressed');
    if (menuState.isOpen && !menuState.isAnimating) {
      closeMenu();
    }
  };

  const handleMenuItemPress = (action: MenuAction) => {
    setMenuState(prev => ({ ...prev, activeButton: action.id }));

    // Show the appropriate form based on the action id
    switch(action.id) {
      case 'products':
        setShowProductForm(true);
        break;
      case 'customer':
        setShowCustomerForm(true);
        break;
      case 'category':
        setShowCategoryForm(true);
        break;
      case 'suppliers':
        setShowSupplierForm(true);
        break;
      case 'sales':
        setShowSalesForm(true);
        break;
    }

    // Also call the original onMenuItemPress if provided
    if (onMenuItemPress) {
      onMenuItemPress(action);
    }

    closeMenu();
  };

  // Perfect semicircle calculation - Fixed positioning
  const getPerfectSemicirclePosition = (index: number, totalButtons: number) => {
    // Create perfect semicircle with equal spacing
    const radius = 110; // Optimal radius for visual appeal
    const totalAngle = Math.PI; // 180 degrees for semicircle
    const angleStep = totalAngle / (totalButtons - 1);
    const angle = Math.PI - (index * angleStep); // Start from left (π) to right (0)
    
    const x = Math.cos(angle) * radius;
    const y = -Math.sin(angle) * radius - 15; // Negative for upward positioning
    
    return { x, y };
  };

  const renderMenuButton = (action: MenuAction, index: number) => {
    const position = getPerfectSemicirclePosition(index, menuActions.length);
    const IconComponent = action.icon;

    return (
      <Animated.View
        key={action.id}
        style={[
          styles.menuButton,
          {
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              { scale: animationValues.buttonScales[index] },
            ],
            opacity: animationValues.buttonOpacities[index],
          },
        ]}
        testID={`floating-menu-button-${action.id}`}
      >
        <View style={[styles.menuButtonContainer, { backgroundColor: action.color }]}>
          <TouchableOpacity
            style={styles.menuButtonTouchable}
            onPress={() => handleMenuItemPress(action)}
            activeOpacity={0.8}
            testID={`floating-menu-button-touchable-${action.id}`}
          >
            <IconComponent size={22} color="#FFFFFF" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
        <Text style={styles.menuButtonLabel}>{action.label}</Text>
      </Animated.View>
    );
  };

  // Form submission handlers
  const handleProductSubmit = (data: any) => {
    console.log('Product form submitted:', data);
    setShowProductForm(false);
  };

  const handleCustomerSubmit = (data: any) => {
    console.log('Customer form submitted:', data);
    setShowCustomerForm(false);
  };

  const handleCategorySubmit = (data: any) => {
    console.log('Category form submitted:', data);
    setShowCategoryForm(false);
  };

  const handleSupplierSubmit = (data: any) => {
    console.log('Supplier form submitted:', data);
    setShowSupplierForm(false);
  };

  const handleSalesSubmit = (data: any) => {
    console.log('Sales form submitted:', data);
    setShowSalesForm(false);
  };

  const handleSalesDraft = (data: any) => {
    console.log('Sales draft saved:', data);
    // Keep form open for draft saves
  };

  const styles = StyleSheet.create({
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      zIndex: 990,
      backgroundColor: 'transparent',
    },
    container: {
      position: 'absolute',
      bottom: 85,
      left: 0,
      right: 0,
      height: 180,
      alignItems: 'center',
      justifyContent: 'flex-end',
      zIndex: 1000,
      pointerEvents: 'box-none',
    },
    overlay: {
      position: 'absolute',
      bottom: 0,
      left: '50%',
      width: 320,
      height: 160,
      marginLeft: -160,
      backgroundColor: 'transparent', // Removed dark background
      borderTopLeftRadius: 160,
      borderTopRightRadius: 160,
      zIndex: 999,
    },
    menuContainer: {
      position: 'absolute',
      bottom: 20,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 1001,
    },
    centerButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.navigation.active,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -25,
      // Enhanced shadow and glow effect
      shadowColor: theme.colors.navigation.active,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 12,
      zIndex: 1002,
      // Gradient-like border effect
      borderWidth: 3,
      borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    menuButton: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1003,
    },
    menuButtonContainer: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      // Enhanced shadow for floating effect
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 12,
      // Refined border
      borderWidth: 2.5,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    menuButtonTouchable: {
      width: '100%',
      height: '100%',
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuButtonLabel: {
      marginTop: 8,
      fontSize: 11,
      fontWeight: '700',
      textAlign: 'center',
      color: '#FFFFFF',
      // Enhanced text shadow for better readability
      textShadowColor: 'rgba(0, 0, 0, 0.8)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 6,
      maxWidth: 70,
      letterSpacing: 0.2,
      lineHeight: 13,
    },
    fullScreenOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.01)',
      zIndex: 900,
    },
  });

  return (
    <>
      {menuState.isOpen && (
        <>
          <TouchableWithoutFeedback 
            onPress={handleOverlayPress} 
            testID="floating-menu-backdrop"
          >
            <View style={styles.fullScreenOverlay} />
          </TouchableWithoutFeedback>
          
          <View style={styles.container} pointerEvents="box-none">
            <Animated.View
              style={[
                styles.overlay,
                {
                  opacity: animationValues.overlayOpacity,
                  transform: [{
                    scale: animationValues.menuScale,
                  }],
                },
              ]}
              testID="floating-menu-overlay"
            >
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={handleOverlayPress}
                activeOpacity={1}
                testID="floating-menu-overlay-touchable"
              />
            </Animated.View>

            <Animated.View 
              style={[
                styles.menuContainer,
                {
                  transform: [{
                    scale: animationValues.menuScale,
                  }],
                },
              ]}
              testID="floating-menu-items-container"
            >
              {menuActions.map((action, index) => renderMenuButton(action, index))}
            </Animated.View>
          </View>
        </>
      )}

      <TouchableOpacity
        style={styles.centerButton}
        onPress={toggleMenu}
        activeOpacity={0.8}
        testID="floating-menu-center-button"
      >
        <Animated.View
          style={{
            transform: [{
              rotate: animationValues.centerButtonRotation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '135deg'], // More dramatic rotation
              }),
            }],
          }}
        >
          <Plus
            size={26}
            color="#FFFFFF"
            strokeWidth={2.8}
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Forms */}
      <ProductAddForm 
        visible={showProductForm} 
        onClose={() => setShowProductForm(false)} 
        onSubmit={handleProductSubmit} 
      />
      
      <CustomerAddForm 
        visible={showCustomerForm} 
        onClose={() => setShowCustomerForm(false)} 
        onSubmit={handleCustomerSubmit} 
      />
      
      <CategoryAddForm 
        visible={showCategoryForm} 
        onClose={() => setShowCategoryForm(false)} 
        onSubmit={handleCategorySubmit} 
      />
      
      <SupplierAddForm 
        visible={showSupplierForm} 
        onClose={() => setShowSupplierForm(false)} 
        onSubmit={handleSupplierSubmit} 
      />
      
      <SalesForm
        visible={showSalesForm}
        onClose={() => setShowSalesForm(false)}
        onSubmit={handleSalesSubmit}
        onSaveDraft={handleSalesDraft}
      />
    </>
  );
}

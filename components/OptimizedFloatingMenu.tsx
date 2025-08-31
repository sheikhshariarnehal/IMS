import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet, Dimensions, Text, TouchableWithoutFeedback } from 'react-native';
import { Plus, Package, Users, Tag, Truck, ShoppingCart, LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import ProductAddForm from './forms/ProductAddForm';
import CustomerAddForm from './forms/CustomerAddForm';
import CategoryAddForm from './forms/CategoryAddForm';
import SupplierAddForm from './forms/SupplierAddForm';
import SalesForm from './forms/SalesForm';

// Removed unused screenWidth for better performance

interface MenuAction {
    id: string;
    label: string;
    icon: LucideIcon;
    color: string;
}

interface FloatingActionMenuProps {
    onMenuItemPress?: (action: MenuAction) => void;
}

const OptimizedFloatingMenu = React.memo(function OptimizedFloatingMenu({ onMenuItemPress }: FloatingActionMenuProps) {
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [showProductForm, setShowProductForm] = useState(false);
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [showSupplierForm, setShowSupplierForm] = useState(false);
    const [showSalesForm, setShowSalesForm] = useState(false);

    // Pre-computed menu actions
    const menuActions: MenuAction[] = useMemo(() => [
        { id: 'products', label: 'Add Products', icon: Package, color: '#2563eb' },
        { id: 'customer', label: 'Customer', icon: Users, color: '#16a34a' },
        { id: 'category', label: 'Category', icon: Tag, color: '#ea580c' },
        { id: 'suppliers', label: 'Suppliers', icon: Truck, color: '#dc2626' },
        { id: 'sales', label: 'Sales', icon: ShoppingCart, color: '#059669' }
    ], []);

    // Optimized animation values - simpler approach
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const menuScale = useRef(new Animated.Value(0)).current;
    const rotation = useRef(new Animated.Value(0)).current;

    const toggleMenu = useCallback(() => {
        if (isOpen) {
            // Instant close for faster navigation
            Animated.parallel([
                Animated.timing(overlayOpacity, {
                    toValue: 0,
                    duration: 0, // Instant
                    useNativeDriver: true,
                }),
                Animated.timing(menuScale, {
                    toValue: 0,
                    duration: 0, // Instant
                    useNativeDriver: true,
                }),
                Animated.timing(rotation, {
                    toValue: 0,
                    duration: 0, // Instant
                    useNativeDriver: true,
                }),
            ]).start(() => setIsOpen(false));
        } else {
            setIsOpen(true);
            // Instant open for faster navigation
            Animated.parallel([
                Animated.timing(overlayOpacity, {
                    toValue: 1,
                    duration: 0, // Instant
                    useNativeDriver: true,
                }),
                Animated.timing(menuScale, {
                    toValue: 1,
                    duration: 0, // Instant
                    useNativeDriver: true,
                }),
                Animated.timing(rotation, {
                    toValue: 1,
                    duration: 0, // Instant
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isOpen, overlayOpacity, menuScale, rotation]);

    const handleOverlayPress = useCallback(() => {
        if (isOpen) {
            toggleMenu();
        }
    }, [isOpen, toggleMenu]);

    const handleMenuItemPress = useCallback((action: MenuAction) => {
        // Show the appropriate form
        switch (action.id) {
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

        if (onMenuItemPress) {
            onMenuItemPress(action);
        }

        toggleMenu();
    }, [onMenuItemPress, toggleMenu]);

    // Optimized position calculation
    const getMenuPosition = useCallback((index: number, totalButtons: number) => {
        const radius = 100;
        const totalAngle = Math.PI;
        const angleStep = totalAngle / (totalButtons - 1);
        const angle = Math.PI - (index * angleStep);

        return {
            x: Math.cos(angle) * radius,
            y: -Math.sin(angle) * radius - 10,
        };
    }, []);

    // Form handlers
    const handleProductSubmit = useCallback((data: any) => {
        console.log('Product form submitted:', data);
        setShowProductForm(false);
    }, []);

    const handleCustomerSubmit = useCallback((data: any) => {
        console.log('Customer form submitted:', data);
        setShowCustomerForm(false);
    }, []);

    const handleCategorySubmit = useCallback((data: any) => {
        console.log('Category form submitted:', data);
        setShowCategoryForm(false);
    }, []);

    const handleSupplierSubmit = useCallback((data: any) => {
        console.log('Supplier form submitted:', data);
        setShowSupplierForm(false);
    }, []);

    const handleSalesSubmit = useCallback((data: any) => {
        console.log('Sales form submitted:', data);
        setShowSalesForm(false);
    }, []);

    const handleSalesDraft = useCallback((data: any) => {
        console.log('Sales draft saved:', data);
        // Keep form open for draft saves
    }, []);

    // Memoized styles
    const styles = useMemo(() => StyleSheet.create({
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
            width: 300,
            height: 150,
            marginLeft: -150,
            backgroundColor: 'transparent',
            borderTopLeftRadius: 150,
            borderTopRightRadius: 150,
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
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: theme.colors.navigation.active,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: -20,
            shadowColor: theme.colors.navigation.active,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            borderWidth: 2,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            zIndex: 1002,
        },
        menuButton: {
            position: 'absolute',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1003,
        },
        menuButtonContainer: {
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 8,
            borderWidth: 2,
            borderColor: 'rgba(255, 255, 255, 0.15)',
        },
        menuButtonTouchable: {
            width: '100%',
            height: '100%',
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
        },
        menuButtonLabel: {
            marginTop: 6,
            fontSize: 10,
            fontWeight: '600',
            textAlign: 'center',
            color: '#FFFFFF',
            textShadowColor: 'rgba(0, 0, 0, 0.7)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 4,
            maxWidth: 60,
            letterSpacing: 0.1,
        },
        fullScreenOverlay: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.01)',
            zIndex: 900,
        },
    }), [theme]);

    const renderMenuButton = useCallback((action: MenuAction, index: number) => {
        const position = getMenuPosition(index, menuActions.length);
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
                            { scale: menuScale },
                        ],
                        opacity: overlayOpacity,
                    },
                ]}
            >
                <View style={[styles.menuButtonContainer, { backgroundColor: action.color }]}>
                    <TouchableOpacity
                        style={styles.menuButtonTouchable}
                        onPress={() => handleMenuItemPress(action)}
                        activeOpacity={0.8}
                    >
                        <IconComponent size={20} color="#FFFFFF" strokeWidth={2} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.menuButtonLabel}>{action.label}</Text>
            </Animated.View>
        );
    }, [styles, getMenuPosition, menuActions.length, menuScale, overlayOpacity, handleMenuItemPress]);

    return (
        <>
            {isOpen && (
                <>
                    <TouchableWithoutFeedback onPress={handleOverlayPress}>
                        <View style={styles.fullScreenOverlay} />
                    </TouchableWithoutFeedback>

                    <View style={styles.container} pointerEvents="box-none">
                        <Animated.View
                            style={[
                                styles.overlay,
                                {
                                    opacity: overlayOpacity,
                                    transform: [{ scale: menuScale }],
                                },
                            ]}
                        >
                            <TouchableOpacity
                                style={{ flex: 1 }}
                                onPress={handleOverlayPress}
                                activeOpacity={1}
                            />
                        </Animated.View>

                        <Animated.View
                            style={[
                                styles.menuContainer,
                                {
                                    transform: [{ scale: menuScale }],
                                },
                            ]}
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
            >
                <Animated.View
                    style={{
                        transform: [{
                            rotate: rotation.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0deg', '135deg'],
                            }),
                        }],
                    }}
                >
                    <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
                </Animated.View>
            </TouchableOpacity>

            {/* Optimized Forms */}
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
});

export default OptimizedFloatingMenu;
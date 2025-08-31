import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    FlatList,
    RefreshControl,
    Alert,
    Modal,
    Animated,
    Vibration,
} from 'react-native';
import {
    Bell,
    Search,
    Filter,
    Settings,
    AlertTriangle,
    Clock,
    CheckCircle,
    XCircle,
    Package,
    DollarSign,
    Users,
    TestTube,
    Shield,
    Eye,
    Trash2,
    Check,
    X,
    Mail,
    Smartphone,
    ChevronDown,
    ChevronUp,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import SharedLayout from '@/components/SharedLayout';
import { FormService } from '@/lib/services/formService';

// Types for mobile notifications
interface MobileNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: 'inventory' | 'sales' | 'customers' | 'samples' | 'payments' | 'system' | 'security';
    isRead: boolean;
    isActionable: boolean;
    actionUrl?: string;
    actionLabel?: string;
    createdAt: Date;
    readAt?: Date;
    metadata?: any;
}

interface NotificationFilters {
    search?: string;
    category?: string;
    priority?: string;
    isRead?: boolean;
}

// Mock notification data adapted for mobile
const mockNotifications: MobileNotification[] = [
    {
        id: '1',
        type: 'low_stock_alert',
        title: 'Low Stock Alert',
        message: 'Premium Velvet Sofa Fabric (#LWIL02012) is running low. Current stock: 25 units (Threshold: 100)',
        priority: 'high',
        category: 'inventory',
        isRead: false,
        isActionable: true,
        actionUrl: '/inventory',
        actionLabel: 'Reorder Now',
        createdAt: new Date('2025-01-17T10:30:00'),
        metadata: { currentStock: 25, threshold: 100, productCode: '#LWIL02012' }
    },
    {
        id: '2',
        type: 'payment_overdue',
        title: 'Payment Overdue',
        message: 'Modern Home Decor has an overdue payment of ৳104,000. Payment is 18 days past due.',
        priority: 'critical',
        category: 'payments',
        isRead: false,
        isActionable: true,
        actionUrl: '/sales',
        actionLabel: 'Send Reminder',
        createdAt: new Date('2025-01-17T09:15:00'),
        metadata: { amount: 104000, daysPastDue: 18, customerName: 'Modern Home Decor' }
    },
    {
        id: '3',
        type: 'sample_overdue',
        title: 'Sample Overdue',
        message: 'Leather Sample Collection from Modern Home Decor is 18 days overdue for return.',
        priority: 'medium',
        category: 'samples',
        isRead: false,
        isActionable: true,
        actionUrl: '/samples',
        actionLabel: 'Contact Customer',
        createdAt: new Date('2025-01-17T08:45:00'),
        metadata: { sampleName: 'Leather Sample Collection', daysPastDue: 18 }
    },
    {
        id: '4',
        type: 'sample_converted',
        title: 'Sample Converted to Sale',
        message: 'Premium Velvet Sample Set has been converted to a sale worth ৳62,700 by Rahman Furniture.',
        priority: 'low',
        category: 'samples',
        isRead: true,
        isActionable: false,
        createdAt: new Date('2025-01-16T14:20:00'),
        readAt: new Date('2025-01-16T15:30:00'),
        metadata: { saleAmount: 62700, customerName: 'Rahman Furniture' }
    },
    {
        id: '5',
        type: 'red_list_customer',
        title: 'Customer Added to Red List',
        message: 'Modern Home Decor has been automatically added to the red list due to 65 days overdue payment.',
        priority: 'critical',
        category: 'customers',
        isRead: false,
        isActionable: true,
        actionUrl: '/customers',
        actionLabel: 'Review Customer',
        createdAt: new Date('2025-01-16T12:00:00'),
        metadata: { daysPastDue: 65, outstandingAmount: 104000 }
    },
    {
        id: '6',
        type: 'stock_transfer_pending',
        title: 'Stock Transfer Pending Approval',
        message: 'Transfer request TRF-2025-002 for Silk Curtain Material (30 units) is awaiting approval.',
        priority: 'medium',
        category: 'inventory',
        isRead: true,
        isActionable: true,
        actionUrl: '/inventory',
        actionLabel: 'Review Transfer',
        createdAt: new Date('2025-01-16T11:30:00'),
        readAt: new Date('2025-01-16T13:45:00'),
        metadata: { transferNumber: 'TRF-2025-002', quantity: 30, productName: 'Silk Curtain Material' }
    },
    {
        id: '7',
        type: 'new_customer',
        title: 'New Customer Registration',
        message: 'Budget Furniture House has registered as a new customer with Regular type.',
        priority: 'low',
        category: 'customers',
        isRead: true,
        isActionable: false,
        createdAt: new Date('2025-01-15T16:45:00'),
        readAt: new Date('2025-01-15T17:00:00'),
        metadata: { customerName: 'Budget Furniture House', customerType: 'Regular' }
    },
    {
        id: '8',
        type: 'sales_milestone',
        title: 'Sales Milestone Achieved',
        message: 'Congratulations! Monthly sales target of ৳500,000 has been achieved 3 days early.',
        priority: 'low',
        category: 'sales',
        isRead: false,
        isActionable: false,
        createdAt: new Date('2025-01-15T10:00:00'),
        metadata: { target: 500000, achieved: 520000, daysEarly: 3 }
    }
];

export default function NotificationPage() {
    const { theme } = useTheme();
    const { user, hasPermission } = useAuth();
    const router = useRouter();

    // State management
    const [notifications, setNotifications] = useState<MobileNotification[]>([]);
    const [filters, setFilters] = useState<NotificationFilters>({});
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<MobileNotification | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Load notifications from database
    const loadNotifications = async () => {
        try {
            setLoading(true);

            // Fetch notifications from database
            const notificationsData = await FormService.getNotifications();

            // Transform database notifications to UI format
            const transformedNotifications: MobileNotification[] = notificationsData.map((notification: any) => ({
                id: notification.id.toString(),
                type: notification.type || 'info',
                title: notification.title,
                message: notification.message,
                priority: notification.priority || 'medium',
                category: notification.category || 'system',
                isRead: notification.is_read || false,
                isActionable: !!notification.action_url,
                actionUrl: notification.action_url,
                timestamp: new Date(notification.created_at),
                userId: notification.user_id?.toString(),
            }));

            setNotifications(transformedNotifications);
        } catch (error) {
            console.error('Failed to load notifications:', error);
            Alert.alert('Error', 'Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    // Load data on component mount
    React.useEffect(() => {
        loadNotifications();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    };

    // Filtered notifications
    const filteredNotifications = useMemo(() => {
        return notifications.filter(notification => {
            if (filters.search &&
                !notification.title.toLowerCase().includes(filters.search.toLowerCase()) &&
                !notification.message.toLowerCase().includes(filters.search.toLowerCase())) {
                return false;
            }
            if (filters.category && notification.category !== filters.category) {
                return false;
            }
            if (filters.priority && notification.priority !== filters.priority) {
                return false;
            }
            if (filters.isRead !== undefined && notification.isRead !== filters.isRead) {
                return false;
            }
            return true;
        });
    }, [notifications, filters]);

    // Analytics
    const analytics = useMemo(() => {
        const totalNotifications = notifications.length;
        const unreadNotifications = notifications.filter(n => !n.isRead).length;
        const criticalNotifications = notifications.filter(n => n.priority === 'critical').length;

        return {
            totalNotifications,
            unreadNotifications,
            criticalNotifications,
        };
    }, [notifications]);

    // Utility functions
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return theme.colors.status.error;
            case 'high': return theme.colors.status.warning;
            case 'medium': return theme.colors.status.info;
            case 'low': return theme.colors.status.success;
            default: return theme.colors.text.secondary;
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'inventory': return Package;
            case 'sales': return DollarSign;
            case 'customers': return Users;
            case 'samples': return TestTube;
            case 'payments': return DollarSign;
            case 'system': return Settings;
            case 'security': return Shield;
            default: return Bell;
        }
    };

    // Event handlers
    const handleMarkAsRead = (notificationId: string) => {
        // Haptic feedback for successful action
        Vibration.vibrate(50);
        setNotifications(prev => prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n
        ));
    };

    const handleMarkAllAsRead = () => {
        // Haptic feedback for bulk action
        Vibration.vibrate([50, 100, 50]);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date() })));
    };

    const handleDeleteNotification = (notificationId: string) => {
        // Haptic feedback for destructive action
        Vibration.vibrate(100);
        Alert.alert(
            'Delete Notification',
            'Are you sure you want to delete this notification?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        Vibration.vibrate(50);
                        setNotifications(prev => prev.filter(n => n.id !== notificationId));
                    }
                }
            ]
        );
    };

    const handleNotificationPress = (notification: MobileNotification) => {
        // Light haptic feedback for selection
        Vibration.vibrate(30);
        if (!notification.isRead) {
            handleMarkAsRead(notification.id);
        }
        setSelectedNotification(notification);
        setShowDetailModal(true);
    };

    const handleActionPress = (notification: MobileNotification) => {
        // Haptic feedback for navigation action
        Vibration.vibrate(50);
        if (notification.actionUrl) {
            router.push(notification.actionUrl as any);
        }
    };

    // Swipe action handlers
    const handleSwipeMarkAsRead = (notificationId: string) => {
        Vibration.vibrate(50);
        handleMarkAsRead(notificationId);
    };

    const handleSwipeDelete = (notificationId: string) => {
        Vibration.vibrate(100);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
    };

    const clearFilters = () => {
        setFilters({});
    };

    // Render functions
    const renderKPICards = () => (
        <View style={styles.kpiContainer}>
            <View style={styles.kpiRow}>
                <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                        <Bell size={24} color={theme.colors.primary} />
                    </View>
                    <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>
                        {analytics.totalNotifications}
                    </Text>
                    <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>
                        Total Notifications
                    </Text>
                </View>

                <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.info + '20' }]}>
                        <Mail size={24} color={theme.colors.status.info} />
                    </View>
                    <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>
                        {analytics.unreadNotifications}
                    </Text>
                    <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>
                        Unread
                    </Text>
                </View>
            </View>

            <View style={styles.kpiRow}>
                <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.error + '20' }]}>
                        <AlertTriangle size={24} color={theme.colors.status.error} />
                    </View>
                    <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>
                        {analytics.criticalNotifications}
                    </Text>
                    <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>
                        Critical
                    </Text>
                </View>

                <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <TouchableOpacity
                        style={[styles.kpiIcon, { backgroundColor: theme.colors.status.success + '20' }]}
                        onPress={handleMarkAllAsRead}
                    >
                        <CheckCircle size={24} color={theme.colors.status.success} />
                    </TouchableOpacity>
                    <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary, textAlign: 'center' }]}>
                        Mark All Read
                    </Text>
                </View>
            </View>
        </View>
    );

    const renderFilterSection = () => (
        <View style={[styles.filterContainer, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.searchContainer, { backgroundColor: theme.colors.input, borderColor: theme.colors.border }]}>
                <Search size={20} color={theme.colors.text.secondary} />
                <TextInput
                    style={[styles.searchInput, { color: theme.colors.text.primary }]}
                    placeholder="Search notifications..."
                    placeholderTextColor={theme.colors.text.muted}
                    value={filters.search || ''}
                    onChangeText={(text) => setFilters(prev => ({ ...prev, search: text }))}
                />
                {filters.search && (
                    <TouchableOpacity
                        onPress={() => setFilters(prev => ({ ...prev, search: '' }))}
                        style={styles.clearSearchButton}
                    >
                        <X size={16} color={theme.colors.text.muted} />
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: theme.colors.backgroundSecondary }]}
                onPress={() => {
                    Vibration.vibrate(30);
                    setShowFilters(!showFilters);
                }}
            >
                <Filter size={20} color={theme.colors.primary} />
                {showFilters ? <ChevronUp size={16} color={theme.colors.primary} /> : <ChevronDown size={16} color={theme.colors.primary} />}
            </TouchableOpacity>
        </View>
    );

    const renderExpandedFilters = () => {
        if (!showFilters) return null;

        return (
            <View style={[styles.expandedFilters, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                {/* Category Filter */}
                <View style={styles.filterGroup}>
                    <Text style={[styles.filterGroupTitle, { color: theme.colors.text.primary }]}>Category</Text>
                    <View style={styles.filterChips}>
                        {['inventory', 'sales', 'customers', 'samples', 'payments', 'system'].map((category) => (
                            <TouchableOpacity
                                key={category}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: filters.category === category ? theme.colors.primary : theme.colors.backgroundSecondary,
                                        borderColor: filters.category === category ? theme.colors.primary : theme.colors.border,
                                    }
                                ]}
                                onPress={() => {
                                    Vibration.vibrate(30);
                                    setFilters(prev => ({
                                        ...prev,
                                        category: prev.category === category ? undefined : category
                                    }));
                                }}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    { color: filters.category === category ? theme.colors.text.inverse : theme.colors.text.primary }
                                ]}>
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Priority Filter */}
                <View style={styles.filterGroup}>
                    <Text style={[styles.filterGroupTitle, { color: theme.colors.text.primary }]}>Priority</Text>
                    <View style={styles.filterChips}>
                        {['critical', 'high', 'medium', 'low'].map((priority) => (
                            <TouchableOpacity
                                key={priority}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: filters.priority === priority ? getPriorityColor(priority) : theme.colors.backgroundSecondary,
                                        borderColor: filters.priority === priority ? getPriorityColor(priority) : theme.colors.border,
                                    }
                                ]}
                                onPress={() => {
                                    Vibration.vibrate(30);
                                    setFilters(prev => ({
                                        ...prev,
                                        priority: prev.priority === priority ? undefined : priority
                                    }));
                                }}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    { color: filters.priority === priority ? theme.colors.text.inverse : theme.colors.text.primary }
                                ]}>
                                    {priority}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Read Status Filter */}
                <View style={styles.filterGroup}>
                    <Text style={[styles.filterGroupTitle, { color: theme.colors.text.primary }]}>Status</Text>
                    <View style={styles.filterChips}>
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: filters.isRead === false ? theme.colors.status.info : theme.colors.backgroundSecondary,
                                    borderColor: filters.isRead === false ? theme.colors.status.info : theme.colors.border,
                                }
                            ]}
                            onPress={() => {
                                Vibration.vibrate(30);
                                setFilters(prev => ({
                                    ...prev,
                                    isRead: prev.isRead === false ? undefined : false
                                }));
                            }}
                        >
                            <Text style={[
                                styles.filterChipText,
                                { color: filters.isRead === false ? theme.colors.text.inverse : theme.colors.text.primary }
                            ]}>
                                Unread
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: filters.isRead === true ? theme.colors.status.success : theme.colors.backgroundSecondary,
                                    borderColor: filters.isRead === true ? theme.colors.status.success : theme.colors.border,
                                }
                            ]}
                            onPress={() => {
                                Vibration.vibrate(30);
                                setFilters(prev => ({
                                    ...prev,
                                    isRead: prev.isRead === true ? undefined : true
                                }));
                            }}
                        >
                            <Text style={[
                                styles.filterChipText,
                                { color: filters.isRead === true ? theme.colors.text.inverse : theme.colors.text.primary }
                            ]}>
                                Read
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Clear Filters */}
                <TouchableOpacity
                    style={[styles.clearFiltersButton, { backgroundColor: theme.colors.status.error + '20' }]}
                    onPress={() => {
                        Vibration.vibrate(50);
                        clearFilters();
                    }}
                >
                    <X size={16} color={theme.colors.status.error} />
                    <Text style={[styles.clearFiltersText, { color: theme.colors.status.error }]}>
                        Clear All Filters
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderNotificationItem = ({ item }: { item: MobileNotification }) => {
        const CategoryIcon = getCategoryIcon(item.category);
        const priorityColor = getPriorityColor(item.priority);

        return (
            <TouchableOpacity
                style={[
                    styles.notificationCard,
                    {
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border,
                        borderLeftColor: priorityColor,
                        opacity: item.isRead ? 0.7 : 1,
                    }
                ]}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.7}
            >
                <View style={styles.notificationHeader}>
                    <View style={[styles.categoryIcon, { backgroundColor: priorityColor + '20' }]}>
                        <CategoryIcon size={20} color={priorityColor} />
                    </View>

                    <View style={styles.notificationContent}>
                        <View style={styles.titleRow}>
                            <Text
                                style={[styles.notificationTitle, { color: theme.colors.text.primary }]}
                                numberOfLines={1}
                            >
                                {item.title}
                            </Text>
                            {!item.isRead && (
                                <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
                            )}
                        </View>

                        <Text
                            style={[styles.notificationMessage, { color: theme.colors.text.secondary }]}
                            numberOfLines={2}
                        >
                            {item.message}
                        </Text>

                        <View style={styles.notificationFooter}>
                            <View style={styles.timeContainer}>
                                <Clock size={12} color={theme.colors.text.muted} />
                                <Text style={[styles.timeText, { color: theme.colors.text.muted }]}>
                                    {item.createdAt.toLocaleDateString()}
                                </Text>
                            </View>

                            <View style={styles.actionButtons}>
                                {item.isActionable && (
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: theme.colors.primary + '20' }]}
                                        onPress={() => handleActionPress(item)}
                                    >
                                        <Eye size={14} color={theme.colors.primary} />
                                    </TouchableOpacity>
                                )}

                                {!item.isRead && (
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: theme.colors.status.success + '20' }]}
                                        onPress={() => handleMarkAsRead(item.id)}
                                    >
                                        <Check size={14} color={theme.colors.status.success} />
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: theme.colors.status.error + '20' }]}
                                    onPress={() => handleDeleteNotification(item.id)}
                                >
                                    <Trash2 size={14} color={theme.colors.status.error} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SharedLayout title="Notifications">
            <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: theme.colors.backgroundSecondary }]}
                onPress={() => router.push('/settings')}
            >
                <Settings size={20} color={theme.colors.primary} />
            </TouchableOpacity>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* KPI Cards */}
                {renderKPICards()}

                {/* Filter Section */}
                {renderFilterSection()}

                {/* Expanded Filters */}
                {renderExpandedFilters()}

                {/* Notifications List */}
                <FlatList
                    data={filteredNotifications}
                    renderItem={renderNotificationItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Bell size={48} color={theme.colors.text.muted} />
                            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                                No notifications found
                            </Text>
                            <Text style={[styles.emptySubtext, { color: theme.colors.text.muted }]}>
                                Try adjusting your search or filters
                            </Text>
                        </View>
                    }
                />
            </ScrollView>

            {/* Detail Modal */}
            <Modal
                visible={showDetailModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowDetailModal(false)}
            >
                {selectedNotification && (
                    <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                                Notification Details
                            </Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setShowDetailModal(false)}
                            >
                                <X size={24} color={theme.colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            <View style={[styles.detailCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                                <Text style={[styles.detailTitle, { color: theme.colors.text.primary }]}>
                                    {selectedNotification.title}
                                </Text>
                                <Text style={[styles.detailMessage, { color: theme.colors.text.secondary }]}>
                                    {selectedNotification.message}
                                </Text>

                                <View style={styles.detailMeta}>
                                    <Text style={[styles.detailMetaText, { color: theme.colors.text.muted }]}>
                                        Priority: {selectedNotification.priority.toUpperCase()}
                                    </Text>
                                    <Text style={[styles.detailMetaText, { color: theme.colors.text.muted }]}>
                                        Category: {selectedNotification.category}
                                    </Text>
                                    <Text style={[styles.detailMetaText, { color: theme.colors.text.muted }]}>
                                        Created: {selectedNotification.createdAt.toLocaleString()}
                                    </Text>
                                    {selectedNotification.readAt && (
                                        <Text style={[styles.detailMetaText, { color: theme.colors.text.muted }]}>
                                            Read: {selectedNotification.readAt.toLocaleString()}
                                        </Text>
                                    )}
                                </View>

                                {selectedNotification.isActionable && selectedNotification.actionUrl && (
                                    <TouchableOpacity
                                        style={[styles.actionButtonLarge, { backgroundColor: theme.colors.primary }]}
                                        onPress={() => {
                                            handleActionPress(selectedNotification);
                                            setShowDetailModal(false);
                                        }}
                                    >
                                        <Text style={[styles.actionButtonText, { color: theme.colors.text.inverse }]}>
                                            {selectedNotification.actionLabel || 'Take Action'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </ScrollView>
                    </SafeAreaView>
                )}
            </Modal>
        </SharedLayout>
    );
}
const
    styles = StyleSheet.create({
        container: {
            flex: 1,
        },
        content: {
            flex: 1,
        },
        headerButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
        },
        kpiContainer: {
            padding: 16,
            gap: 12,
        },
        kpiRow: {
            flexDirection: 'row',
            gap: 12,
        },
        kpiCard: {
            flex: 1,
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            alignItems: 'center',
            minHeight: 100,
        },
        kpiIcon: {
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 8,
        },
        kpiValue: {
            fontSize: 20,
            fontWeight: 'bold',
            marginBottom: 4,
        },
        kpiLabel: {
            fontSize: 12,
            textAlign: 'center',
        },
        filterContainer: {
            flexDirection: 'row',
            padding: 16,
            gap: 12,
            alignItems: 'center',
        },
        searchContainer: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            borderWidth: 1,
            gap: 8,
        },
        searchInput: {
            flex: 1,
            fontSize: 16,
            paddingVertical: 4,
        },
        filterButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            gap: 4,
        },
        clearSearchButton: {
            padding: 4,
        },
        expandedFilters: {
            marginHorizontal: 16,
            marginBottom: 16,
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            gap: 16,
        },
        filterGroup: {
            gap: 12,
        },
        filterGroupTitle: {
            fontSize: 16,
            fontWeight: '600',
        },
        filterChips: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
        },
        filterChip: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            borderWidth: 1,
        },
        filterChipText: {
            fontSize: 14,
            fontWeight: '500',
            textTransform: 'capitalize',
        },
        clearFiltersButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 8,
            gap: 8,
        },
        clearFiltersText: {
            fontSize: 14,
            fontWeight: '600',
        },
        listContainer: {
            padding: 16,
            gap: 12,
        },
        notificationCard: {
            borderRadius: 12,
            borderWidth: 1,
            borderLeftWidth: 4,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        notificationHeader: {
            flexDirection: 'row',
            gap: 12,
        },
        categoryIcon: {
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
        },
        notificationContent: {
            flex: 1,
        },
        titleRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 4,
        },
        notificationTitle: {
            fontSize: 16,
            fontWeight: '600',
            flex: 1,
        },
        unreadDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            marginLeft: 8,
        },
        notificationMessage: {
            fontSize: 14,
            lineHeight: 20,
            marginBottom: 12,
        },
        notificationFooter: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        timeContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },
        timeText: {
            fontSize: 12,
        },
        actionButtons: {
            flexDirection: 'row',
            gap: 8,
        },
        actionButton: {
            width: 32,
            height: 32,
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
        },
        emptyContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 48,
            gap: 12,
        },
        emptyText: {
            fontSize: 18,
            fontWeight: '600',
        },
        emptySubtext: {
            fontSize: 14,
            textAlign: 'center',
        },
        modalContainer: {
            flex: 1,
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1,
        },
        modalTitle: {
            fontSize: 18,
            fontWeight: '600',
        },
        closeButton: {
            padding: 4,
        },
        modalContent: {
            flex: 1,
            padding: 16,
        },
        detailCard: {
            padding: 20,
            borderRadius: 12,
            borderWidth: 1,
            gap: 16,
        },
        detailTitle: {
            fontSize: 20,
            fontWeight: 'bold',
        },
        detailMessage: {
            fontSize: 16,
            lineHeight: 24,
        },
        detailMeta: {
            gap: 8,
        },
        detailMetaText: {
            fontSize: 14,
        },
        actionButtonLarge: {
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 8,
        },
        actionButtonText: {
            fontSize: 16,
            fontWeight: '600',
        },
    });
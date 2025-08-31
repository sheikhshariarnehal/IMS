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
} from 'react-native';
import {
    Search,
    Filter,
    Download,
    Activity,
    User,
    Calendar,
    AlertTriangle,
    Info,
    CheckCircle,
    XCircle,
    Eye,
    Shield,
    Database,
    Settings,
    Users,
    Package,
    ShoppingCart,
    FileText,
    Clock,
    ChevronDown,
    ChevronUp,
    X,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import SharedLayout from '@/components/SharedLayout';
import TopNavBar from '@/components/TopNavBar';
import BottomNavBar from '@/components/BottomNavBar';
import { FormService } from '@/lib/services/formService';

// Types for mobile activity logs
interface MobileActivityLog {
    id: string;
    userId: string;
    userName: string;
    userRole: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT';
    module: 'AUTH' | 'PRODUCTS' | 'INVENTORY' | 'SALES' | 'CUSTOMERS' | 'REPORTS' | 'SETTINGS' | 'SAMPLES';
    entityType?: string;
    entityId?: string;
    entityName?: string;
    description: string;
    details?: any;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface LogFilters {
    search?: string;
    userId?: string;
    userRole?: string;
    action?: string;
    module?: string;
    severity?: string;
}

// Mock activity logs data adapted for mobile
const mockActivityLogs: MobileActivityLog[] = [
    {
        id: '1',
        userId: '1',
        userName: 'Super Administrator',
        userRole: 'super_admin',
        action: 'CREATE',
        module: 'PRODUCTS',
        entityType: 'product',
        entityId: '1',
        entityName: 'Premium Velvet Sofa Fabric',
        description: 'Created new product: Premium Velvet Sofa Fabric',
        details: {
            newValues: {
                name: 'Premium Velvet Sofa Fabric',
                productCode: '#LWIL02012',
                category: 'Sofa Fabrics',
                purchasePrice: 1200,
                sellingPrice: 1500
            }
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date('2025-01-17T10:30:00'),
        severity: 'LOW'
    },
    {
        id: '2',
        userId: '2',
        userName: 'Admin User',
        userRole: 'admin',
        action: 'UPDATE',
        module: 'CUSTOMERS',
        entityType: 'customer',
        entityId: '3',
        entityName: 'Modern Home Decor',
        description: 'Updated customer payment status to Red Listed',
        details: {
            oldValues: { paymentStatus: 'Overdue' },
            newValues: { paymentStatus: 'Red Listed' },
            changes: ['paymentStatus']
        },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        timestamp: new Date('2025-01-17T09:15:00'),
        severity: 'HIGH'
    },
    {
        id: '3',
        userId: '1',
        userName: 'Super Administrator',
        userRole: 'super_admin',
        action: 'DELETE',
        module: 'INVENTORY',
        entityType: 'stock_item',
        entityId: '5',
        entityName: 'Discontinued Fabric Sample',
        description: 'Deleted discontinued stock item from inventory',
        details: {
            oldValues: {
                productName: 'Discontinued Fabric Sample',
                quantity: 0,
                status: 'Discontinued'
            }
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date('2025-01-17T08:45:00'),
        severity: 'MEDIUM'
    },
    {
        id: '4',
        userId: '3',
        userName: 'Sales Manager',
        userRole: 'sales_manager',
        action: 'VIEW',
        module: 'REPORTS',
        entityType: 'report',
        entityId: 'sales-2025-01',
        entityName: 'Monthly Sales Report - January 2025',
        description: 'Viewed monthly sales report',
        details: {
            metadata: { reportType: 'sales', period: 'monthly' }
        },
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        timestamp: new Date('2025-01-17T08:00:00'),
        severity: 'LOW'
    },
    {
        id: '5',
        userId: '1',
        userName: 'Super Administrator',
        userRole: 'super_admin',
        action: 'LOGIN',
        module: 'AUTH',
        description: 'User logged into the system',
        details: {
            metadata: { loginMethod: 'email_password', sessionId: 'sess_123456' }
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date('2025-01-17T07:30:00'),
        severity: 'LOW'
    },
    {
        id: '6',
        userId: '4',
        userName: 'Investor',
        userRole: 'investor',
        action: 'VIEW',
        module: 'REPORTS',
        entityType: 'report',
        entityId: 'financial-2025-01',
        entityName: 'Financial Report - January 2025',
        description: 'Viewed financial performance report',
        details: {
            metadata: { reportType: 'financial', period: 'monthly' }
        },
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        timestamp: new Date('2025-01-16T16:20:00'),
        severity: 'LOW'
    },
    {
        id: '7',
        userId: '2',
        userName: 'Admin User',
        userRole: 'admin',
        action: 'CREATE',
        module: 'SAMPLES',
        entityType: 'sample',
        entityId: '12',
        entityName: 'Leather Sample Set - Premium',
        description: 'Created new sample set for customer evaluation',
        details: {
            newValues: {
                sampleName: 'Leather Sample Set - Premium',
                customerName: 'Elite Furniture Co',
                expectedReturn: '2025-02-01'
            }
        },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        timestamp: new Date('2025-01-16T14:15:00'),
        severity: 'LOW'
    },
    {
        id: '8',
        userId: '1',
        userName: 'Super Administrator',
        userRole: 'super_admin',
        action: 'UPDATE',
        module: 'SETTINGS',
        entityType: 'system_setting',
        entityId: 'notification_config',
        entityName: 'Notification Configuration',
        description: 'Updated system notification settings',
        details: {
            oldValues: { emailNotifications: false },
            newValues: { emailNotifications: true },
            changes: ['emailNotifications']
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date('2025-01-16T11:30:00'),
        severity: 'MEDIUM'
    }
];

export default function LogsPage() {
    const { theme } = useTheme();
    const { user, hasPermission } = useAuth();
    const router = useRouter();

    // State management
    const [logs, setLogs] = useState<MobileActivityLog[]>([]);
    const [filters, setFilters] = useState<LogFilters>({});
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedLog, setSelectedLog] = useState<MobileActivityLog | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Load activity logs from database
    const loadLogs = async () => {
        try {
            setLoading(true);

            // Fetch activity logs from database
            const logsData = await FormService.getActivityLogs(filters);

            // Transform database logs to UI format
            const transformedLogs: MobileActivityLog[] = logsData.map((log: any) => ({
                id: log.id.toString(),
                userId: log.user_id?.toString() || '',
                userName: 'User ' + (log.user_id || 'Unknown'), // Would need to join with users table
                action: log.action,
                module: log.module,
                description: log.description,
                entityType: log.entity_type,
                entityId: log.entity_id?.toString(),
                oldValues: log.old_values,
                newValues: log.new_values,
                ipAddress: log.ip_address,
                userAgent: log.user_agent,
                timestamp: new Date(log.created_at),
                severity: log.action === 'DELETE' ? 'high' :
                         log.action === 'CREATE' ? 'medium' : 'low',
                category: log.module?.toLowerCase() || 'system',
            }));

            setLogs(transformedLogs);
        } catch (error) {
            console.error('Failed to load activity logs:', error);
            Alert.alert('Error', 'Failed to load activity logs');
        } finally {
            setLoading(false);
        }
    };

    // Load data on component mount
    React.useEffect(() => {
        loadLogs();
    }, []);

    // Reload when filters change
    React.useEffect(() => {
        loadLogs();
    }, [filters]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadLogs();
        setRefreshing(false);
    };

    // Filtered logs
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            if (filters.search &&
                !log.description.toLowerCase().includes(filters.search.toLowerCase()) &&
                !log.userName.toLowerCase().includes(filters.search.toLowerCase())) {
                return false;
            }
            if (filters.userId && log.userId !== filters.userId) {
                return false;
            }
            if (filters.userRole && log.userRole !== filters.userRole) {
                return false;
            }
            if (filters.action && log.action !== filters.action) {
                return false;
            }
            if (filters.module && log.module !== filters.module) {
                return false;
            }
            if (filters.severity && log.severity !== filters.severity) {
                return false;
            }
            return true;
        });
    }, [logs, filters]);

    // Analytics
    const analytics = useMemo(() => {
        const totalLogs = logs.length;
        const todayLogs = logs.filter(log => {
            const today = new Date();
            return log.timestamp.toDateString() === today.toDateString();
        }).length;
        const criticalLogs = logs.filter(log => log.severity === 'CRITICAL').length;

        const mostActiveUser = logs.reduce((acc, log) => {
            acc[log.userName] = (acc[log.userName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const mostActiveUserName = Object.keys(mostActiveUser).reduce((a, b) =>
            mostActiveUser[a] > mostActiveUser[b] ? a : b, Object.keys(mostActiveUser)[0]
        );

        return {
            totalLogs,
            todayLogs,
            criticalLogs,
            mostActiveUser: mostActiveUserName,
        };
    }, [logs]);

    // Check if user has permission to view logs
    if (!hasPermission('activityLogs', 'view') && user?.role !== 'super_admin') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <TopNavBar
                    title="Access Denied"
                    showBackButton={true}
                />
                <View style={styles.accessDeniedContainer}>
                    <Shield size={64} color={theme.colors.status.error} />
                    <Text style={[styles.accessDeniedTitle, { color: theme.colors.text.primary }]}>
                        Access Denied
                    </Text>
                    <Text style={[styles.accessDeniedText, { color: theme.colors.text.secondary }]}>
                        Only Super Administrators and Admins can view activity logs.
                    </Text>
                </View>
                <BottomNavBar activeTab="logs" />
            </SafeAreaView>
        );
    }

    // Utility functions
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return theme.colors.status.error;
            case 'HIGH': return theme.colors.status.warning;
            case 'MEDIUM': return theme.colors.status.info;
            case 'LOW': return theme.colors.status.success;
            default: return theme.colors.text.secondary;
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'CREATE': return CheckCircle;
            case 'UPDATE': return Info;
            case 'DELETE': return XCircle;
            case 'VIEW': return Eye;
            case 'LOGIN': return User;
            case 'LOGOUT': return User;
            default: return Activity;
        }
    };

    const getModuleIcon = (module: string) => {
        switch (module) {
            case 'AUTH': return Shield;
            case 'PRODUCTS': return Package;
            case 'INVENTORY': return Database;
            case 'SALES': return ShoppingCart;
            case 'CUSTOMERS': return Users;
            case 'REPORTS': return FileText;
            case 'SETTINGS': return Settings;
            case 'SAMPLES': return Package;
            default: return Activity;
        }
    };

    // Event handlers
    const handleLogPress = (log: MobileActivityLog) => {
        setSelectedLog(log);
        setShowDetailModal(true);
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
                        <Activity size={24} color={theme.colors.primary} />
                    </View>
                    <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>
                        {analytics.totalLogs}
                    </Text>
                    <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>
                        Total Activities
                    </Text>
                </View>

                <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.info + '20' }]}>
                        <Calendar size={24} color={theme.colors.status.info} />
                    </View>
                    <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>
                        {analytics.todayLogs}
                    </Text>
                    <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>
                        Today's Activities
                    </Text>
                </View>
            </View>

            <View style={styles.kpiRow}>
                <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.error + '20' }]}>
                        <AlertTriangle size={24} color={theme.colors.status.error} />
                    </View>
                    <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>
                        {analytics.criticalLogs}
                    </Text>
                    <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>
                        Critical Events
                    </Text>
                </View>

                <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.success + '20' }]}>
                        <User size={24} color={theme.colors.status.success} />
                    </View>
                    <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>
                        {analytics.mostActiveUser?.split(' ')[0] || 'N/A'}
                    </Text>
                    <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>
                        Most Active User
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
                    placeholder="Search activities, users..."
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
                onPress={() => setShowFilters(!showFilters)}
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
                {/* Action Filter */}
                <View style={styles.filterGroup}>
                    <Text style={[styles.filterGroupTitle, { color: theme.colors.text.primary }]}>Action</Text>
                    <View style={styles.filterChips}>
                        {['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN'].map((action) => (
                            <TouchableOpacity
                                key={action}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: filters.action === action ? theme.colors.primary : theme.colors.backgroundSecondary,
                                        borderColor: filters.action === action ? theme.colors.primary : theme.colors.border,
                                    }
                                ]}
                                onPress={() => {
                                    setFilters(prev => ({
                                        ...prev,
                                        action: prev.action === action ? undefined : action
                                    }));
                                }}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    { color: filters.action === action ? theme.colors.text.inverse : theme.colors.text.primary }
                                ]}>
                                    {action}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Module Filter */}
                <View style={styles.filterGroup}>
                    <Text style={[styles.filterGroupTitle, { color: theme.colors.text.primary }]}>Module</Text>
                    <View style={styles.filterChips}>
                        {['AUTH', 'PRODUCTS', 'INVENTORY', 'SALES', 'CUSTOMERS', 'REPORTS'].map((module) => (
                            <TouchableOpacity
                                key={module}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: filters.module === module ? theme.colors.status.info : theme.colors.backgroundSecondary,
                                        borderColor: filters.module === module ? theme.colors.status.info : theme.colors.border,
                                    }
                                ]}
                                onPress={() => {
                                    setFilters(prev => ({
                                        ...prev,
                                        module: prev.module === module ? undefined : module
                                    }));
                                }}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    { color: filters.module === module ? theme.colors.text.inverse : theme.colors.text.primary }
                                ]}>
                                    {module}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Severity Filter */}
                <View style={styles.filterGroup}>
                    <Text style={[styles.filterGroupTitle, { color: theme.colors.text.primary }]}>Severity</Text>
                    <View style={styles.filterChips}>
                        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((severity) => (
                            <TouchableOpacity
                                key={severity}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: filters.severity === severity ? getSeverityColor(severity) : theme.colors.backgroundSecondary,
                                        borderColor: filters.severity === severity ? getSeverityColor(severity) : theme.colors.border,
                                    }
                                ]}
                                onPress={() => {
                                    setFilters(prev => ({
                                        ...prev,
                                        severity: prev.severity === severity ? undefined : severity
                                    }));
                                }}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    { color: filters.severity === severity ? theme.colors.text.inverse : theme.colors.text.primary }
                                ]}>
                                    {severity}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Clear Filters */}
                <TouchableOpacity
                    style={[styles.clearFiltersButton, { backgroundColor: theme.colors.status.error + '20' }]}
                    onPress={clearFilters}
                >
                    <X size={16} color={theme.colors.status.error} />
                    <Text style={[styles.clearFiltersText, { color: theme.colors.status.error }]}>
                        Clear All Filters
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderLogItem = ({ item }: { item: MobileActivityLog }) => {
        const ActionIcon = getActionIcon(item.action);
        const ModuleIcon = getModuleIcon(item.module);
        const severityColor = getSeverityColor(item.severity);

        return (
            <TouchableOpacity
                style={[
                    styles.logCard,
                    {
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border,
                        borderLeftColor: severityColor,
                    }
                ]}
                onPress={() => handleLogPress(item)}
                activeOpacity={0.7}
            >
                <View style={styles.logHeader}>
                    <View style={[styles.actionIcon, { backgroundColor: severityColor + '20' }]}>
                        <ActionIcon size={20} color={severityColor} />
                    </View>

                    <View style={styles.logContent}>
                        <View style={styles.logTitleRow}>
                            <Text
                                style={[styles.logTitle, { color: theme.colors.text.primary }]}
                                numberOfLines={1}
                            >
                                {item.description}
                            </Text>
                            <View style={[styles.severityBadge, { backgroundColor: severityColor + '20' }]}>
                                <Text style={[styles.severityText, { color: severityColor }]}>
                                    {item.severity}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.logMeta}>
                            <View style={styles.userInfo}>
                                <User size={12} color={theme.colors.text.muted} />
                                <Text style={[styles.userName, { color: theme.colors.text.secondary }]}>
                                    {item.userName}
                                </Text>
                            </View>

                            <View style={styles.moduleInfo}>
                                <ModuleIcon size={12} color={theme.colors.text.muted} />
                                <Text style={[styles.moduleName, { color: theme.colors.text.secondary }]}>
                                    {item.module}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.logFooter}>
                            <View style={styles.timeContainer}>
                                <Clock size={12} color={theme.colors.text.muted} />
                                <Text style={[styles.timeText, { color: theme.colors.text.muted }]}>
                                    {item.timestamp.toLocaleDateString()} {item.timestamp.toLocaleTimeString()}
                                </Text>
                            </View>

                            <View style={[styles.actionBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                                <Text style={[styles.actionText, { color: theme.colors.primary }]}>
                                    {item.action}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SharedLayout title="Activity Logs">
            <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: theme.colors.backgroundSecondary }]}
            >
                <Download size={20} color={theme.colors.primary} />
            </TouchableOpacity>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* KPI Cards */}
                {renderKPICards()}

                {/* Filter Section */}
                {renderFilterSection()}

                {/* Expanded Filters */}
                {renderExpandedFilters()}

                {/* Activity Logs List */}
                <FlatList
                    data={filteredLogs}
                    renderItem={renderLogItem}
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
                            <Activity size={48} color={theme.colors.text.muted} />
                            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                                No activity logs found
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
                {selectedLog && (
                    <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                                Activity Details
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
                                    {selectedLog.description}
                                </Text>

                                <View style={styles.detailMeta}>
                                    <Text style={[styles.detailMetaText, { color: theme.colors.text.muted }]}>
                                        User: {selectedLog.userName} ({selectedLog.userRole.replace('_', ' ').toUpperCase()})
                                    </Text>
                                    <Text style={[styles.detailMetaText, { color: theme.colors.text.muted }]}>
                                        Action: {selectedLog.action}
                                    </Text>
                                    <Text style={[styles.detailMetaText, { color: theme.colors.text.muted }]}>
                                        Module: {selectedLog.module}
                                    </Text>
                                    <Text style={[styles.detailMetaText, { color: theme.colors.text.muted }]}>
                                        Severity: {selectedLog.severity}
                                    </Text>
                                    <Text style={[styles.detailMetaText, { color: theme.colors.text.muted }]}>
                                        Timestamp: {selectedLog.timestamp.toLocaleString()}
                                    </Text>
                                    <Text style={[styles.detailMetaText, { color: theme.colors.text.muted }]}>
                                        IP Address: {selectedLog.ipAddress}
                                    </Text>
                                    {selectedLog.entityName && (
                                        <Text style={[styles.detailMetaText, { color: theme.colors.text.muted }]}>
                                            Entity: {selectedLog.entityName}
                                        </Text>
                                    )}
                                </View>

                                {selectedLog.details && (
                                    <View style={styles.detailsSection}>
                                        <Text style={[styles.detailsSectionTitle, { color: theme.colors.text.primary }]}>
                                            Additional Details
                                        </Text>
                                        <Text style={[styles.detailsText, { color: theme.colors.text.secondary }]}>
                                            {JSON.stringify(selectedLog.details, null, 2)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </ScrollView>
                    </SafeAreaView>
                )}
            </Modal>
        </SharedLayout>
    );
}

const styles = StyleSheet.create({
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
    accessDeniedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        gap: 16,
    },
    accessDeniedTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    accessDeniedText: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
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
    clearSearchButton: {
        padding: 4,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 4,
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
        fontSize: 12,
        fontWeight: '500',
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
    logCard: {
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
    logHeader: {
        flexDirection: 'row',
        gap: 12,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logContent: {
        flex: 1,
    },
    logTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    logTitle: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
    },
    severityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    severityText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    logMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    userName: {
        fontSize: 12,
    },
    moduleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    moduleName: {
        fontSize: 12,
    },
    logFooter: {
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
        fontSize: 11,
    },
    actionBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    actionText: {
        fontSize: 10,
        fontWeight: '600',
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
        fontSize: 18,
        fontWeight: 'bold',
    },
    detailMeta: {
        gap: 8,
    },
    detailMetaText: {
        fontSize: 14,
    },
    detailsSection: {
        marginTop: 16,
        gap: 8,
    },
    detailsSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    detailsText: {
        fontSize: 12,
        fontFamily: 'monospace',
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
    },
});
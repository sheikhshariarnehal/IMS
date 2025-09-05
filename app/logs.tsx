import React, { useState, useMemo, useEffect } from 'react';
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
    Share,
    Platform,
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
    LogIn,
    LogOut,
    Trash2,
    Edit,
    Plus,
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
    userRole?: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT' | 'COMPLETE' | 'TRANSFER';
    module: 'AUTH' | 'PRODUCTS' | 'INVENTORY' | 'SALES' | 'CUSTOMERS' | 'REPORTS' | 'SETTINGS' | 'SAMPLES' | 'TRANSFERS' | 'SALE';
    entityType?: string;
    entityId?: string;
    entityName?: string;
    description: string;
    details?: any;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    creditAmount?: number;
    debitAmount?: number;
}

interface LogFilters {
    search?: string;
    userId?: string;
    userRole?: string;
    action?: string;
    module?: string;
    severity?: string;
    dateFrom?: string;
    dateTo?: string;
}

interface ActivityStats {
    totalActivities: number;
    todaysActivities: number;
    criticalEvents: number;
    mostActiveUser: string;
}



export default function LogsPage() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const router = useRouter();

    // State management
    const [logs, setLogs] = useState<MobileActivityLog[]>([]);
    const [stats, setStats] = useState<ActivityStats>({
        totalActivities: 0,
        todaysActivities: 0,
        criticalEvents: 0,
        mostActiveUser: 'N/A'
    });
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

            // Fetch activity logs and stats from database
            const [logsData, statsData] = await Promise.all([
                FormService.getActivityLogs(filters, user?.id),
                FormService.getActivityLogStats(user?.id)
            ]);

            // Transform database logs to UI format
            const transformedLogs: MobileActivityLog[] = logsData.map((log: any) => ({
                id: log.id?.toString() || '',
                userId: log.user_id?.toString() || '',
                userName: log.users?.name || `User ${log.user_id || 'Unknown'}`,
                userRole: log.users?.role || 'unknown',
                action: log.action || 'UNKNOWN',
                module: log.module || 'UNKNOWN',
                description: log.description || 'No description available',
                entityType: log.entity_type || '',
                entityId: log.entity_id?.toString() || '',
                entityName: log.entity_name || '',
                oldValues: log.old_values,
                newValues: log.new_values,
                ipAddress: log.ip_address || '',
                userAgent: log.user_agent || '',
                timestamp: new Date(log.created_at || new Date()),
                severity: getSeverityFromAction(log.action || 'VIEW'),
                creditAmount: log.credit_amount || 0,
                debitAmount: log.debit_amount || 0,
            })).filter(log => log.id && log.action && log.module); // Filter out invalid logs

            setLogs(transformedLogs);
            setStats(statsData);
        } catch (error) {
            console.error('Failed to load activity logs:', error);
            Alert.alert('Error', 'Failed to load activity logs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to determine severity from action
    const getSeverityFromAction = (action: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
        switch (action) {
            case 'DELETE':
                return 'CRITICAL';
            case 'UPDATE':
            case 'COMPLETE':
                return 'HIGH';
            case 'CREATE':
            case 'TRANSFER':
                return 'MEDIUM';
            case 'VIEW':
            case 'LOGIN':
            case 'LOGOUT':
            default:
                return 'LOW';
        }
    };

    // Load data on component mount
    useEffect(() => {
        loadLogs();
    }, []);

    // Reload when filters change
    useEffect(() => {
        if (Object.keys(filters).length > 0) {
            loadLogs();
        }
    }, [filters]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadLogs();
        setRefreshing(false);
    };

    // Export functionality
    const handleExport = async () => {
        try {
            const csvContent = generateCSVContent(filteredLogs);
            const fileName = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;

            if (Platform.OS === 'web') {
                // Web export
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.click();
                URL.revokeObjectURL(url);
            } else {
                // Mobile export via Share
                await Share.share({
                    message: csvContent,
                    title: 'Activity Logs Export',
                });
            }
        } catch (error) {
            console.error('Export failed:', error);
            Alert.alert('Export Failed', 'Unable to export activity logs. Please try again.');
        }
    };

    const generateCSVContent = (logs: MobileActivityLog[]): string => {
        const headers = [
            'Timestamp',
            'User',
            'Action',
            'Module',
            'Description',
            'Entity Type',
            'Entity Name',
            'Severity',
            'IP Address'
        ];

        const rows = logs.map(log => [
            log.timestamp.toISOString(),
            log.userName,
            log.action,
            log.module,
            log.description.replace(/,/g, ';'), // Replace commas to avoid CSV issues
            log.entityType || '',
            log.entityName || '',
            log.severity,
            log.ipAddress || ''
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
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

    // Check if user has permission to view logs - Only Super Admins
    if (user?.role !== 'super_admin') {
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
                        Access to this section is restricted to Super Admins only.
                        {'\n\n'}Other users will not be able to view this.
                        {'\n\n'}Currently, the logs display data for the last 60 days only, as showing too much data could overload the database due to frequent changes throughout the day.
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
            case 'CREATE': return Plus;
            case 'UPDATE': return Edit;
            case 'DELETE': return Trash2;
            case 'VIEW': return Eye;
            case 'LOGIN': return LogIn;
            case 'LOGOUT': return LogOut;
            case 'COMPLETE': return CheckCircle;
            case 'TRANSFER': return Activity;
            default: return Info;
        }
    };

    const getModuleIcon = (module: string) => {
        switch (module) {
            case 'AUTH': return Shield;
            case 'PRODUCTS': return Package;
            case 'INVENTORY': return Database;
            case 'SALES':
            case 'SALE': return ShoppingCart;
            case 'CUSTOMERS': return Users;
            case 'REPORTS': return FileText;
            case 'SETTINGS': return Settings;
            case 'SAMPLES': return Package;
            case 'TRANSFERS': return Activity;
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
                        {loading ? '...' : stats.totalActivities.toLocaleString()}
                    </Text>
                    <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>
                        Total Activities
                    </Text>
                    <Text style={[styles.kpiSubLabel, { color: theme.colors.text.muted }]}>
                        Last 60 days
                    </Text>
                </View>

                <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.info + '20' }]}>
                        <Calendar size={24} color={theme.colors.status.info} />
                    </View>
                    <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>
                        {loading ? '...' : stats.todaysActivities.toLocaleString()}
                    </Text>
                    <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>
                        Today's Activities
                    </Text>
                    <Text style={[styles.kpiSubLabel, { color: theme.colors.text.muted }]}>
                        {new Date().toLocaleDateString()}
                    </Text>
                </View>
            </View>

            <View style={styles.kpiRow}>
                <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.error + '20' }]}>
                        <AlertTriangle size={24} color={theme.colors.status.error} />
                    </View>
                    <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>
                        {loading ? '...' : stats.criticalEvents.toLocaleString()}
                    </Text>
                    <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>
                        Critical Events
                    </Text>
                    <Text style={[styles.kpiSubLabel, { color: theme.colors.text.muted }]}>
                        Delete actions
                    </Text>
                </View>

                <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.success + '20' }]}>
                        <User size={24} color={theme.colors.status.success} />
                    </View>
                    <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]} numberOfLines={1}>
                        {loading ? '...' : (stats.mostActiveUser?.split(' ')[0] || 'N/A')}
                    </Text>
                    <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>
                        Most Active User
                    </Text>
                    <Text style={[styles.kpiSubLabel, { color: theme.colors.text.muted }]}>
                        By activity count
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
                        {['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'COMPLETE', 'TRANSFER'].map((action) => (
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
                        {['AUTH', 'PRODUCTS', 'INVENTORY', 'SALES', 'SALE', 'CUSTOMERS', 'REPORTS', 'SETTINGS', 'SAMPLES', 'TRANSFERS'].map((module) => (
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
        // Validate item data
        if (!item || !item.id || !item.action || !item.module) {
            console.warn('Invalid log item:', item);
            return null;
        }

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
                                {item.description || 'No description'}
                            </Text>
                            <View style={[styles.severityBadge, { backgroundColor: severityColor + '20' }]}>
                                <Text style={[styles.severityText, { color: severityColor }]}>
                                    {item.severity || 'LOW'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.logMeta}>
                            <View style={styles.userInfo}>
                                <User size={12} color={theme.colors.text.muted} />
                                <Text style={[styles.userName, { color: theme.colors.text.secondary }]}>
                                    {item.userName || 'Unknown User'}
                                </Text>
                            </View>

                            <View style={styles.moduleInfo}>
                                <ModuleIcon size={12} color={theme.colors.text.muted} />
                                <Text style={[styles.moduleName, { color: theme.colors.text.secondary }]}>
                                    {item.module || 'UNKNOWN'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.logFooter}>
                            <View style={styles.timeContainer}>
                                <Clock size={12} color={theme.colors.text.muted} />
                                <Text style={[styles.timeText, { color: theme.colors.text.muted }]}>
                                    {item.timestamp?.toLocaleDateString() || 'N/A'} {item.timestamp?.toLocaleTimeString() || ''}
                                </Text>
                            </View>

                            <View style={[styles.actionBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                                <Text style={[styles.actionText, { color: theme.colors.primary }]}>
                                    {item.action || 'UNKNOWN'}
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
                onPress={handleExport}
                disabled={loading || filteredLogs.length === 0}
            >
                <Download size={20} color={loading || filteredLogs.length === 0 ? theme.colors.text.muted : theme.colors.primary} />
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
                                        User: {selectedLog.userName} ({selectedLog.userRole?.replace('_', ' ').toUpperCase() || 'Unknown'})
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
        marginBottom: 2,
    },
    kpiSubLabel: {
        fontSize: 10,
        textAlign: 'center',
        fontStyle: 'italic',
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
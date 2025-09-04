import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    Alert,
    RefreshControl,
    Switch,
    Image,
    Modal,
    ActivityIndicator,
} from 'react-native';
import {
    Settings,
    Users,
    User,
    Shield,
    Palette,
    Globe,
    Moon,
    Sun,
    Monitor,
    Plus,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Camera,
    Save,
    X,
    Bell,
    Lock,
    Smartphone,
    Mail,
    Phone,
    MapPin,
    Calendar,
    DollarSign,
    Languages,
    Clock,
    Download,
    Upload,
    RefreshCw,
    CheckCircle,
    AlertTriangle,
    UserCheck,
    UserX,
    MoreVertical,
    Power,
    PowerOff,
    Search,
    Filter,
    ChevronDown,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import SharedLayout from '@/components/SharedLayout';
import RoleAddForm from '@/components/forms/RoleAddForm';
import AdminPermissionTester from '@/components/AdminPermissionTester';
// Mock interfaces for UI demo
interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'super_admin' | 'admin' | 'sales_manager' | 'investor';
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
}

interface Location {
  id: string;
  name: string;
  type: 'warehouse' | 'showroom';
}

// Types - using UserProfile from service
type RoleManagement = UserProfile;

interface AccountSettings {
    id: string;
    userId: string;
    fullName: string;
    email: string;
    phone: string;
    profilePicture?: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    twoFactorEnabled: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    language: 'en' | 'bn' | 'hi';
    timezone: string;
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    currency: 'BDT' | 'USD' | 'EUR';
}

interface AppearanceSettings {
    theme: 'light' | 'dark' | 'system';
    colorPalette: 'default' | 'blue' | 'green' | 'purple';
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
    sidebarCollapsed: boolean;
}

const ROLE_LABELS = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    sales_manager: 'Sales Manager',
    investor: 'Investor',
};

// No mock data - will load from local storage

interface LocationMap {
  [key: string]: Location;
}

const COLOR_PALETTES = [
    {
        id: 'default',
        name: 'Default',
        primary: '#3B82F6',
        secondary: '#64748B',
        accent: '#8B5CF6',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
    },
    {
        id: 'blue',
        name: 'Ocean Blue',
        primary: '#0EA5E9',
        secondary: '#0284C7',
        accent: '#06B6D4',
        success: '#059669',
        warning: '#D97706',
        error: '#DC2626',
    },
    {
        id: 'green',
        name: 'Forest Green',
        primary: '#059669',
        secondary: '#047857',
        accent: '#10B981',
        success: '#065F46',
        warning: '#92400E',
        error: '#B91C1C',
    },
    {
        id: 'purple',
        name: 'Royal Purple',
        primary: '#7C3AED',
        secondary: '#6D28D9',
        accent: '#8B5CF6',
        success: '#047857',
        warning: '#B45309',
        error: '#C2410C',
    },
];

export default function SettingsPage() {
    const { theme, isDark, toggleTheme } = useTheme();
    const { user, hasPermission } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'role-management' | 'account' | 'appearance' | 'system' | 'permissions'>('account');
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [roleFilter, setRoleFilter] = useState<'all' | 'super_admin' | 'admin' | 'sales_manager' | 'investor'>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [locations, setLocations] = useState<LocationMap>({});
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [showPasswordFields, setShowPasswordFields] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);

    const [accountSettings, setAccountSettings] = useState<AccountSettings>({
        id: '1',
        userId: user?.email || '1', // Using email as unique identifier since there's no id
        fullName: user?.name || 'User',
        email: user?.email || 'user@serranotex.com',
        phone: '+880-1234-567890',
        profilePicture: undefined, // UserSession doesn't have avatar property
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        twoFactorEnabled: false,
        emailNotifications: true,
        smsNotifications: false,
        language: 'en',
        timezone: 'Asia/Dhaka',
        dateFormat: 'DD/MM/YYYY',
        currency: 'BDT',
    });

    const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
        theme: isDark ? 'dark' : 'light',
        colorPalette: 'default',
        fontSize: 'medium',
        compactMode: false,
        sidebarCollapsed: false,
    });

    // Load data when component mounts or tab changes
    React.useEffect(() => {
        if (activeTab === 'role-management' && user?.role === 'super_admin') {
            loadUsers();
            loadLocations();
        }
    }, [activeTab, user?.role]);

    // Filter users based on search query and filters
    React.useEffect(() => {
        let filtered = users;

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(user =>
                user.fullName.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query) ||
                user.phone?.toLowerCase().includes(query) ||
                user.id.toLowerCase().includes(query)
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(user =>
                statusFilter === 'active' ? user.isActive : !user.isActive
            );
        }

        // Apply role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter(user => user.role === roleFilter);
        }

        setFilteredUsers(filtered);
    }, [users, searchQuery, statusFilter, roleFilter]);

    const loadUsers = async () => {
        if (user?.role !== 'super_admin') return;

        setLoading(true);
        try {
            console.log('🔄 Loading users...');

            // Import supabase here to avoid circular dependencies
            const { supabase } = await import('@/lib/supabase');

            const { data: usersData, error } = await supabase
                .from('users')
                .select('id, name, email, phone, role, status, assigned_location_id, created_at, created_by')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Failed to load users:', error);
                Alert.alert('Error', `Failed to load users: ${error.message}`);
                return;
            }

            // Transform database users to UserProfile format
            const userData: UserProfile[] = (usersData || []).map(dbUser => ({
                id: dbUser.id.toString(),
                fullName: dbUser.name,
                email: dbUser.email,
                phone: dbUser.phone || undefined,
                role: dbUser.role as 'super_admin' | 'admin' | 'sales_manager' | 'investor',
                isActive: dbUser.status === 'active',
                createdAt: dbUser.created_at,
                createdBy: dbUser.created_by?.toString() || 'System'
            }));

            console.log('✅ Users loaded:', userData.length);
            setUsers(userData);
        } catch (error: any) {
            console.error('❌ Failed to load users:', error);
            Alert.alert('Error', `Failed to load users: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const loadLocations = async () => {
        try {
            console.log('🔄 Loading locations...');

            // Import supabase here to avoid circular dependencies
            const { supabase } = await import('@/lib/supabase');

            const { data: locationsData, error } = await supabase
                .from('locations')
                .select('id, name, type, address')
                .eq('status', 'active')
                .order('name');

            if (error) {
                console.error('❌ Failed to load locations:', error);
                return;
            }

            // Transform database locations to Location format
            const locationData: Location[] = (locationsData || []).map(dbLocation => ({
                id: dbLocation.id.toString(),
                name: dbLocation.name,
                type: dbLocation.type as 'warehouse' | 'showroom'
            }));

            const locationMap: LocationMap = {};
            locationData.forEach(location => {
                locationMap[location.id] = location;
            });

            console.log('✅ Locations loaded:', locationData.length);
            setLocations(locationMap);
        } catch (error) {
            console.error('Failed to load locations:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            if (activeTab === 'role-management' && user?.role === 'super_admin') {
                await Promise.all([loadUsers(), loadLocations()]);
            }
        } catch (error) {
            console.error('Refresh failed:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleSaveAccount = () => {
        Alert.alert('Success', 'Account settings saved successfully!');
    };

    const handleSaveAppearance = () => {
        Alert.alert('Success', 'Appearance settings saved successfully!');
    };

    const handleUserAdded = async (data: any) => {
        console.log('✅ User created successfully, refreshing user list...');
        // Reload the user list to get the latest data from database
        await loadUsers();
        Alert.alert('Success', 'User added successfully!');
    };

    const handleEditUser = (userProfile: UserProfile) => {
        setEditingUser(userProfile);
        setShowAddUserModal(true);
    };

    const handleDeleteUser = (userProfile: UserProfile) => {
        Alert.alert(
            'Delete User',
            `Are you sure you want to delete ${userProfile.fullName}?\n\nThis action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            console.log('🗑️ Deleting user:', userProfile.id);

                            // Import supabase here to avoid circular dependencies
                            const { supabase } = await import('@/lib/supabase');

                            const { error } = await supabase
                                .from('users')
                                .delete()
                                .eq('id', parseInt(userProfile.id));

                            if (error) {
                                console.error('❌ Failed to delete user:', error);
                                Alert.alert('Error', error.message || 'Failed to delete user');
                                return;
                            }

                            // Remove from local state
                            setUsers(prev => prev.filter(u => u.id !== userProfile.id));
                            Alert.alert('Success', 'User deleted successfully');
                            console.log('✅ User deleted successfully');
                        } catch (error: any) {
                            console.error('Failed to delete user:', error);
                            Alert.alert('Error', error.message || 'Failed to delete user');
                        }
                    }
                },
            ]
        );
    };

    const handleToggleUserStatus = async (userProfile: UserProfile) => {
        const newStatus = userProfile.isActive ? 'inactive' : 'active';
        const actionText = userProfile.isActive ? 'deactivate' : 'activate';

        Alert.alert(
            `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} User`,
            `Are you sure you want to ${actionText} ${userProfile.fullName}?\n\n${
                userProfile.isActive
                    ? 'This user will lose access to the system.'
                    : 'This user will regain access to the system.'
            }`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: actionText.charAt(0).toUpperCase() + actionText.slice(1),
                    style: userProfile.isActive ? 'destructive' : 'default',
                    onPress: async () => {
                        try {
                            console.log(`🔄 Toggling user status to ${newStatus}:`, userProfile.id);

                            // Import supabase here to avoid circular dependencies
                            const { supabase } = await import('@/lib/supabase');

                            const { error } = await supabase
                                .from('users')
                                .update({ status: newStatus })
                                .eq('id', parseInt(userProfile.id));

                            if (error) {
                                console.error('❌ Failed to toggle user status:', error);
                                Alert.alert('Error', error.message || 'Failed to update user status');
                                return;
                            }

                            // Update local state
                            const updatedUser = { ...userProfile, isActive: !userProfile.isActive };
                            setUsers(prev => prev.map(u => u.id === userProfile.id ? updatedUser : u));
                            Alert.alert(
                                'Success',
                                `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`
                            );
                            console.log('✅ User status updated successfully');
                        } catch (error: any) {
                            console.error('Failed to toggle user status:', error);
                            Alert.alert('Error', error.message || 'Failed to update user status');
                        }
                    }
                },
            ]
        );
    };

    const getLocationNames = (locationIds: string[]): string => {
        if (!locationIds || locationIds.length === 0) return 'No locations assigned';
        
        const names = locationIds
            .map(id => locations[id]?.name)
            .filter(Boolean);
        
        if (names.length === 0) return 'Unknown locations';
        if (names.length === 1) return names[0];
        if (names.length <= 3) return names.join(', ');
        return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
    };

    const getUserInitials = (fullName: string): string => {
        if (!fullName) return 'U';
        
        const nameParts = fullName.trim().split(' ').filter(Boolean);
        if (nameParts.length === 0) return 'U';
        if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
        
        // First letter of first name + first letter of last name
        const firstInitial = nameParts[0].charAt(0).toUpperCase();
        const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
        
        return firstInitial + lastInitial;
    };

    const renderTabs = () => (
        <View style={[styles.tabContainer, { borderBottomColor: theme.colors.border }]}>
            {user?.role === 'super_admin' && (
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'role-management' && { borderBottomColor: theme.colors.primary }]}
                    onPress={() => setActiveTab('role-management')}
                >
                    <Users size={16} color={activeTab === 'role-management' ? theme.colors.primary : theme.colors.text.secondary} />
                    <Text style={[
                        styles.tabText,
                        { color: activeTab === 'role-management' ? theme.colors.primary : theme.colors.text.secondary }
                    ]}>
                        Users
                    </Text>
                </TouchableOpacity>
            )}

            {user?.role === 'admin' && (
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'permissions' && { borderBottomColor: theme.colors.primary }]}
                    onPress={() => setActiveTab('permissions')}
                >
                    <Shield size={16} color={activeTab === 'permissions' ? theme.colors.primary : theme.colors.text.secondary} />
                    <Text style={[
                        styles.tabText,
                        { color: activeTab === 'permissions' ? theme.colors.primary : theme.colors.text.secondary }
                    ]}>
                        Permissions
                    </Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                style={[styles.tab, activeTab === 'account' && { borderBottomColor: theme.colors.primary }]}
                onPress={() => setActiveTab('account')}
            >
                <User size={16} color={activeTab === 'account' ? theme.colors.primary : theme.colors.text.secondary} />
                <Text style={[
                    styles.tabText,
                    { color: activeTab === 'account' ? theme.colors.primary : theme.colors.text.secondary }
                ]}>
                    Account
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.tab, activeTab === 'appearance' && { borderBottomColor: theme.colors.primary }]}
                onPress={() => setActiveTab('appearance')}
            >
                <Palette size={16} color={activeTab === 'appearance' ? theme.colors.primary : theme.colors.text.secondary} />
                <Text style={[
                    styles.tabText,
                    { color: activeTab === 'appearance' ? theme.colors.primary : theme.colors.text.secondary }
                ]}>
                    Theme
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderRoleManagement = () => {
        if (user?.role !== 'super_admin') {
            return (
                <View style={styles.accessDeniedContainer}>
                    <Shield size={64} color={theme.colors.status.error} />
                    <Text style={[styles.accessDeniedTitle, { color: theme.colors.text.primary }]}>
                        Access Denied
                    </Text>
                    <Text style={[styles.accessDeniedText, { color: theme.colors.text.secondary }]}>
                        Only Super Administrators can manage users.
                    </Text>
                </View>
            );
        }

        return (
            <View>
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionInfo}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                            User Management
                        </Text>
                        <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>
                            Manage system users and their permissions ({filteredUsers.length} of {users.length} users)
                        </Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={[styles.refreshButton, { backgroundColor: theme.colors.backgroundSecondary }]}
                            onPress={loadUsers}
                            disabled={loading}
                        >
                            <RefreshCw size={18} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                            onPress={() => setShowAddUserModal(true)}
                            disabled={loading}
                        >
                            <Plus size={20} color={theme.colors.text.inverse} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search and Filter Controls */}
                <View style={styles.controlsContainer}>
                    {/* Search Bar */}
                    <View style={[styles.searchContainer, { backgroundColor: theme.colors.input, borderColor: theme.colors.border }]}>
                        <Search size={18} color={theme.colors.text.muted} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.colors.text.primary }]}
                            placeholder="Search users..."
                            placeholderTextColor={theme.colors.text.muted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <X size={18} color={theme.colors.text.muted} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Filter Button */}
                    <TouchableOpacity
                        style={[
                            styles.filterToggleButton,
                            {
                                backgroundColor: (statusFilter !== 'all' || roleFilter !== 'all')
                                    ? theme.colors.primary
                                    : theme.colors.backgroundSecondary,
                                borderColor: theme.colors.border
                            }
                        ]}
                        onPress={() => setShowFilters(!showFilters)}
                    >
                        <Filter
                            size={18}
                            color={(statusFilter !== 'all' || roleFilter !== 'all')
                                ? theme.colors.text.inverse
                                : theme.colors.text.secondary
                            }
                        />
                        <Text style={[
                            styles.filterToggleText,
                            {
                                color: (statusFilter !== 'all' || roleFilter !== 'all')
                                    ? theme.colors.text.inverse
                                    : theme.colors.text.secondary
                            }
                        ]}>
                            Filter
                        </Text>
                        <ChevronDown
                            size={16}
                            color={(statusFilter !== 'all' || roleFilter !== 'all')
                                ? theme.colors.text.inverse
                                : theme.colors.text.secondary
                            }
                            style={{ transform: [{ rotate: showFilters ? '180deg' : '0deg' }] }}
                        />
                    </TouchableOpacity>
                </View>

                {/* Filter Options */}
                {showFilters && (
                    <View style={[styles.filtersPanel, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                        <View style={styles.filterSection}>
                            <Text style={[styles.filterSectionTitle, { color: theme.colors.text.primary }]}>Status</Text>
                            <View style={styles.filterChips}>
                                {(['all', 'active', 'inactive'] as const).map((status) => (
                                    <TouchableOpacity
                                        key={status}
                                        style={[
                                            styles.filterChip,
                                            {
                                                backgroundColor: statusFilter === status
                                                    ? theme.colors.primary
                                                    : 'transparent',
                                                borderColor: statusFilter === status
                                                    ? theme.colors.primary
                                                    : theme.colors.border
                                            }
                                        ]}
                                        onPress={() => setStatusFilter(status)}
                                    >
                                        <Text style={[
                                            styles.filterChipText,
                                            {
                                                color: statusFilter === status
                                                    ? theme.colors.text.inverse
                                                    : theme.colors.text.secondary
                                            }
                                        ]}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.filterSection}>
                            <Text style={[styles.filterSectionTitle, { color: theme.colors.text.primary }]}>Role</Text>
                            <View style={styles.filterChips}>
                                {(['all', 'super_admin', 'admin', 'sales_manager', 'investor'] as const).map((role) => (
                                    <TouchableOpacity
                                        key={role}
                                        style={[
                                            styles.filterChip,
                                            {
                                                backgroundColor: roleFilter === role
                                                    ? theme.colors.primary
                                                    : 'transparent',
                                                borderColor: roleFilter === role
                                                    ? theme.colors.primary
                                                    : theme.colors.border
                                            }
                                        ]}
                                        onPress={() => setRoleFilter(role)}
                                    >
                                        <Text style={[
                                            styles.filterChipText,
                                            {
                                                color: roleFilter === role
                                                    ? theme.colors.text.inverse
                                                    : theme.colors.text.secondary
                                            }
                                        ]}>
                                            {role === 'all' ? 'All Roles' : ROLE_LABELS[role as keyof typeof ROLE_LABELS]}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {(statusFilter !== 'all' || roleFilter !== 'all') && (
                            <TouchableOpacity
                                style={[styles.clearAllButton, { borderColor: theme.colors.border }]}
                                onPress={() => {
                                    setStatusFilter('all');
                                    setRoleFilter('all');
                                }}
                            >
                                <X size={16} color={theme.colors.text.muted} />
                                <Text style={[styles.clearAllText, { color: theme.colors.text.muted }]}>
                                    Clear All Filters
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
                            Loading users...
                        </Text>
                    </View>
                ) : (
                    <View style={styles.usersContainer}>
                        {filteredUsers.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Users size={48} color={theme.colors.text.muted} />
                                <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                                    {users.length === 0 ? 'No Users Found' : 'No Users Match Filters'}
                                </Text>
                                <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                                    {users.length === 0 ? 'Add your first user to get started' : 'Try adjusting your search or filter criteria'}
                                </Text>
                            </View>
                        ) : (
                            filteredUsers.map((userProfile) => (
                                <View key={userProfile.id} style={[styles.userCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                                    {/* User Main Info */}
                                    <View style={styles.userMainInfo}>
                                        <View style={styles.userAvatar}>
                                            <View style={[styles.avatarCircle, { backgroundColor: theme.colors.primary }]}>
                                                <Text style={[styles.avatarText, { color: theme.colors.text.inverse }]}>
                                                    {getUserInitials(userProfile.fullName)}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.userInfo}>
                                            <View style={styles.userNameRow}>
                                                <Text style={[styles.userName, { color: theme.colors.text.primary }]}>
                                                    {userProfile.fullName}
                                                </Text>
                                                <View style={[
                                                    styles.statusIndicator,
                                                    { backgroundColor: userProfile.isActive ? theme.colors.status.success : theme.colors.status.error }
                                                ]} />
                                            </View>

                                            <Text style={[styles.userEmail, { color: theme.colors.text.secondary }]}>
                                                {userProfile.email}
                                            </Text>

                                            <View style={styles.userMetaInfo}>
                                                <View style={[styles.roleBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                                                    <Text style={[styles.roleBadgeText, { color: theme.colors.primary }]}>
                                                        {ROLE_LABELS[userProfile.role]}
                                                    </Text>
                                                </View>

                                                {userProfile.phone && (
                                                    <View style={styles.phoneInfo}>
                                                        <Phone size={12} color={theme.colors.text.muted} />
                                                        <Text style={[styles.phoneText, { color: theme.colors.text.muted }]}>
                                                            {userProfile.phone}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    </View>

                                    {/* Location Info */}
                                    <View style={styles.locationInfo}>
                                        <MapPin size={12} color={theme.colors.text.muted} />
                                        <Text style={[styles.locationText, { color: theme.colors.text.muted }]}>
                                            {userProfile.role === 'super_admin' ? 'All Locations' :
                                             userProfile.role === 'investor' ? 'No Location Access' :
                                             locations[userProfile.id] ? locations[userProfile.id].name : 'No locations assigned'}
                                        </Text>
                                    </View>

                                    {/* Actions */}
                                    <View style={styles.userActions}>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.editBtn, { backgroundColor: theme.colors.backgroundSecondary }]}
                                            onPress={() => handleEditUser(userProfile)}
                                            activeOpacity={0.7}
                                        >
                                            <Edit size={16} color={theme.colors.text.secondary} />
                                            <Text style={[styles.actionBtnText, { color: theme.colors.text.secondary }]}>Edit</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[
                                                styles.actionBtn,
                                                styles.statusBtn,
                                                {
                                                    backgroundColor: userProfile.isActive
                                                        ? theme.colors.status.error + '15'
                                                        : theme.colors.status.success + '15'
                                                }
                                            ]}
                                            onPress={() => handleToggleUserStatus(userProfile)}
                                            activeOpacity={0.7}
                                        >
                                            {userProfile.isActive ? (
                                                <>
                                                    <UserX size={16} color={theme.colors.status.error} />
                                                    <Text style={[styles.actionBtnText, { color: theme.colors.status.error }]}>Deactivate</Text>
                                                </>
                                            ) : (
                                                <>
                                                    <UserCheck size={16} color={theme.colors.status.success} />
                                                    <Text style={[styles.actionBtnText, { color: theme.colors.status.success }]}>Activate</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.deleteBtn, { backgroundColor: theme.colors.status.error + '15' }]}
                                            onPress={() => handleDeleteUser(userProfile)}
                                            activeOpacity={0.7}
                                        >
                                            <Trash2 size={16} color={theme.colors.status.error} />
                                            <Text style={[styles.actionBtnText, { color: theme.colors.status.error }]}>Delete</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Footer Info */}
                                    <View style={[styles.userFooter, { borderTopColor: theme.colors.border }]}>
                                        <Text style={[styles.footerText, { color: theme.colors.text.muted }]}>
                                            ID: {userProfile.id} • Created: {new Date(userProfile.createdAt).toLocaleDateString()}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                )}
            </View>
        );
    };

    const renderAccountSettings = () => (
        <View>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Account Settings
            </Text>

            {/* Profile Section */}
            <View style={[styles.settingsCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>
                    Profile Information
                </Text>

                <View style={styles.profileSection}>
                    <View style={styles.profileImageContainer}>
                        {accountSettings.profilePicture ? (
                            <Image source={{ uri: accountSettings.profilePicture }} style={styles.profileImage} />
                        ) : (
                            <View style={[styles.profileImageFallback, { backgroundColor: theme.colors.primary }]}>
                                <Text style={[styles.profileImageText, { color: theme.colors.text.inverse }]}>
                                    {accountSettings.fullName.charAt(0)}
                                </Text>
                            </View>
                        )}
                        <TouchableOpacity style={[styles.cameraButton, { backgroundColor: theme.colors.primary }]}>
                            <Camera size={16} color={theme.colors.text.inverse} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, { color: theme.colors.text.primary }]}>
                            {accountSettings.fullName}
                        </Text>
                        <Text style={[styles.profileRole, { color: theme.colors.text.secondary }]}>
                            {user?.role ? ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] : 'User'}
                        </Text>
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>Full Name</Text>
                    <TextInput
                        style={[styles.textInput, { backgroundColor: theme.colors.input, borderColor: theme.colors.border, color: theme.colors.text.primary }]}
                        value={accountSettings.fullName}
                        onChangeText={(text) => setAccountSettings(prev => ({ ...prev, fullName: text }))}
                        placeholderTextColor={theme.colors.text.muted}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>Email Address</Text>
                    <TextInput
                        style={[styles.textInput, { backgroundColor: theme.colors.input, borderColor: theme.colors.border, color: theme.colors.text.primary }]}
                        value={accountSettings.email}
                        onChangeText={(text) => setAccountSettings(prev => ({ ...prev, email: text }))}
                        keyboardType="email-address"
                        placeholderTextColor={theme.colors.text.muted}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>Phone Number</Text>
                    <TextInput
                        style={[styles.textInput, { backgroundColor: theme.colors.input, borderColor: theme.colors.border, color: theme.colors.text.primary }]}
                        value={accountSettings.phone}
                        onChangeText={(text) => setAccountSettings(prev => ({ ...prev, phone: text }))}
                        keyboardType="phone-pad"
                        placeholderTextColor={theme.colors.text.muted}
                    />
                </View>
            </View>

            {/* Security Section */}
            <View style={[styles.settingsCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>
                        Security Settings
                    </Text>
                    <TouchableOpacity
                        style={[styles.changePasswordButton, { backgroundColor: theme.colors.backgroundSecondary }]}
                        onPress={() => setShowPasswordFields(!showPasswordFields)}
                    >
                        <Text style={[styles.changePasswordText, { color: theme.colors.primary }]}>
                            {showPasswordFields ? 'Cancel' : 'Change Password'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {showPasswordFields && (
                    <View style={styles.passwordSection}>
                        <View style={styles.inputContainer}>
                            <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>Current Password</Text>
                            <TextInput
                                style={[styles.textInput, { backgroundColor: theme.colors.input, borderColor: theme.colors.border, color: theme.colors.text.primary }]}
                                value={accountSettings.currentPassword}
                                onChangeText={(text) => setAccountSettings(prev => ({ ...prev, currentPassword: text }))}
                                secureTextEntry
                                placeholder="Enter current password"
                                placeholderTextColor={theme.colors.text.muted}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>New Password</Text>
                            <TextInput
                                style={[styles.textInput, { backgroundColor: theme.colors.input, borderColor: theme.colors.border, color: theme.colors.text.primary }]}
                                value={accountSettings.newPassword}
                                onChangeText={(text) => setAccountSettings(prev => ({ ...prev, newPassword: text }))}
                                secureTextEntry
                                placeholder="Enter new password"
                                placeholderTextColor={theme.colors.text.muted}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>Confirm New Password</Text>
                            <TextInput
                                style={[styles.textInput, { backgroundColor: theme.colors.input, borderColor: theme.colors.border, color: theme.colors.text.primary }]}
                                value={accountSettings.confirmPassword}
                                onChangeText={(text) => setAccountSettings(prev => ({ ...prev, confirmPassword: text }))}
                                secureTextEntry
                                placeholder="Confirm new password"
                                placeholderTextColor={theme.colors.text.muted}
                            />
                        </View>
                    </View>
                )}

                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                            Two-Factor Authentication
                        </Text>
                        <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                            Add an extra layer of security to your account
                        </Text>
                    </View>
                    <Switch
                        value={accountSettings.twoFactorEnabled}
                        onValueChange={(value) => setAccountSettings(prev => ({ ...prev, twoFactorEnabled: value }))}
                        trackColor={{ false: theme.colors.backgroundSecondary, true: theme.colors.primary + '40' }}
                        thumbColor={accountSettings.twoFactorEnabled ? theme.colors.primary : theme.colors.text.muted}
                    />
                </View>

                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                            Email Notifications
                        </Text>
                        <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                            Receive notifications via email
                        </Text>
                    </View>
                    <Switch
                        value={accountSettings.emailNotifications}
                        onValueChange={(value) => setAccountSettings(prev => ({ ...prev, emailNotifications: value }))}
                        trackColor={{ false: theme.colors.backgroundSecondary, true: theme.colors.primary + '40' }}
                        thumbColor={accountSettings.emailNotifications ? theme.colors.primary : theme.colors.text.muted}
                    />
                </View>

                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                            SMS Notifications
                        </Text>
                        <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                            Receive notifications via SMS
                        </Text>
                    </View>
                    <Switch
                        value={accountSettings.smsNotifications}
                        onValueChange={(value) => setAccountSettings(prev => ({ ...prev, smsNotifications: value }))}
                        trackColor={{ false: theme.colors.backgroundSecondary, true: theme.colors.primary + '40' }}
                        thumbColor={accountSettings.smsNotifications ? theme.colors.primary : theme.colors.text.muted}
                    />
                </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSaveAccount}
            >
                <Save size={20} color={theme.colors.text.inverse} />
                <Text style={[styles.saveButtonText, { color: theme.colors.text.inverse }]}>
                    Save Changes
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderAppearanceSettings = () => (
        <View>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Appearance Settings
            </Text>

            {/* Theme Mode */}
            <View style={[styles.settingsCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>
                    Theme Mode
                </Text>

                <View style={styles.themeOptions}>
                    {[
                        { id: 'light', label: 'Light', icon: Sun },
                        { id: 'dark', label: 'Dark', icon: Moon },
                        { id: 'system', label: 'System', icon: Monitor },
                    ].map((themeOption) => {
                        const IconComponent = themeOption.icon;
                        const isSelected = appearanceSettings.theme === themeOption.id;

                        return (
                            <TouchableOpacity
                                key={themeOption.id}
                                style={[
                                    styles.themeOption,
                                    {
                                        backgroundColor: isSelected ? theme.colors.primary + '20' : theme.colors.backgroundSecondary,
                                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                                    }
                                ]}
                                onPress={() => {
                                    setAppearanceSettings(prev => ({ ...prev, theme: themeOption.id as any }));
                                    if (themeOption.id !== 'system') {
                                        toggleTheme();
                                    }
                                }}
                            >
                                <IconComponent
                                    size={24}
                                    color={isSelected ? theme.colors.primary : theme.colors.text.secondary}
                                />
                                <Text style={[
                                    styles.themeOptionText,
                                    { color: isSelected ? theme.colors.primary : theme.colors.text.primary }
                                ]}>
                                    {themeOption.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Color Palette */}
            <View style={[styles.settingsCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>
                    Color Palette
                </Text>

                <View style={styles.colorPalettes}>
                    {COLOR_PALETTES.map((palette) => {
                        const isSelected = appearanceSettings.colorPalette === palette.id;

                        return (
                            <TouchableOpacity
                                key={palette.id}
                                style={[
                                    styles.colorPalette,
                                    {
                                        backgroundColor: isSelected ? theme.colors.primary + '20' : theme.colors.backgroundSecondary,
                                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                                    }
                                ]}
                                onPress={() => setAppearanceSettings(prev => ({ ...prev, colorPalette: palette.id as any }))}
                            >
                                <View style={styles.colorPreview}>
                                    {[palette.primary, palette.secondary, palette.accent, palette.success, palette.warning, palette.error].map((color, index) => (
                                        <View
                                            key={index}
                                            style={[styles.colorDot, { backgroundColor: color }]}
                                        />
                                    ))}
                                </View>
                                <Text style={[
                                    styles.colorPaletteName,
                                    { color: isSelected ? theme.colors.primary : theme.colors.text.primary }
                                ]}>
                                    {palette.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Language & Region */}
            <View style={[styles.settingsCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>
                    Language & Region
                </Text>

                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                            Language
                        </Text>
                        <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                            Choose your preferred language
                        </Text>
                    </View>
                    <View style={[styles.dropdown, { backgroundColor: theme.colors.input, borderColor: theme.colors.border }]}>
                        <Text style={[styles.dropdownText, { color: theme.colors.text.primary }]}>
                            {accountSettings.language === 'en' ? 'English' :
                                accountSettings.language === 'bn' ? 'বাংলা' : 'हिन्दी'}
                        </Text>
                    </View>
                </View>

                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                            Date Format
                        </Text>
                        <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                            How dates are displayed
                        </Text>
                    </View>
                    <View style={[styles.dropdown, { backgroundColor: theme.colors.input, borderColor: theme.colors.border }]}>
                        <Text style={[styles.dropdownText, { color: theme.colors.text.primary }]}>
                            {accountSettings.dateFormat}
                        </Text>
                    </View>
                </View>

                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                            Currency
                        </Text>
                        <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                            Default currency for transactions
                        </Text>
                    </View>
                    <View style={[styles.dropdown, { backgroundColor: theme.colors.input, borderColor: theme.colors.border }]}>
                        <Text style={[styles.dropdownText, { color: theme.colors.text.primary }]}>
                            {accountSettings.currency}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Display Settings */}
            <View style={[styles.settingsCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>
                    Display Settings
                </Text>

                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                            Compact Mode
                        </Text>
                        <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                            Reduce spacing for more content
                        </Text>
                    </View>
                    <Switch
                        value={appearanceSettings.compactMode}
                        onValueChange={(value) => setAppearanceSettings(prev => ({ ...prev, compactMode: value }))}
                        trackColor={{ false: theme.colors.backgroundSecondary, true: theme.colors.primary + '40' }}
                        thumbColor={appearanceSettings.compactMode ? theme.colors.primary : theme.colors.text.muted}
                    />
                </View>

                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                            Font Size
                        </Text>
                        <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                            Adjust text size for better readability
                        </Text>
                    </View>
                    <View style={[styles.dropdown, { backgroundColor: theme.colors.input, borderColor: theme.colors.border }]}>
                        <Text style={[styles.dropdownText, { color: theme.colors.text.primary }]}>
                            {appearanceSettings.fontSize.charAt(0).toUpperCase() + appearanceSettings.fontSize.slice(1)}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSaveAppearance}
            >
                <Save size={20} color={theme.colors.text.inverse} />
                <Text style={[styles.saveButtonText, { color: theme.colors.text.inverse }]}>
                    Save Preferences
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'role-management':
                return renderRoleManagement();
            case 'permissions':
                return <AdminPermissionTester />;
            case 'account':
                return renderAccountSettings();
            case 'appearance':
                return renderAppearanceSettings();
            default:
                return renderAccountSettings();
        }
    };

    return (
        <SharedLayout title="Settings">
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                    />
                }
            >
                {/* Tabs */}
                {renderTabs()}

                {/* Tab Content */}
                {renderTabContent()}
            </ScrollView>

            {/* Add/Edit User Modal */}
            <RoleAddForm
                visible={showAddUserModal}
                onClose={() => {
                    setShowAddUserModal(false);
                    setEditingUser(null);
                }}
                onSubmit={handleUserAdded}
                existingRole={editingUser ? {
                    id: editingUser.id,
                    userName: editingUser.fullName,
                    email: editingUser.email,
                    mobileNumber: editingUser.phone || '',
                    role: editingUser.role === 'super_admin' ? 'Super Admin' :
                          editingUser.role === 'admin' ? 'Admin' :
                          editingUser.role === 'sales_manager' ? 'Sales Manager' : 'Investor',
                    isActive: editingUser.isActive
                } : undefined}
            />
        </SharedLayout>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabText: {
        fontSize: 12,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginHorizontal: 16,
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 16,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    accessDeniedContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
        paddingHorizontal: 32,
        gap: 16,
    },
    accessDeniedTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    accessDeniedText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    rolesContainer: {
        paddingHorizontal: 16,
        gap: 12,
    },
    roleCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    roleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    roleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarFallback: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    roleDetails: {
        flex: 1,
    },
    roleName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    roleEmail: {
        fontSize: 14,
        marginBottom: 2,
    },
    rolePhone: {
        fontSize: 12,
    },
    roleBadges: {
        alignItems: 'flex-end',
        gap: 6,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    roleActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    changePasswordButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    changePasswordText: {
        fontSize: 12,
        fontWeight: '500',
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
    },
    profileImageContainer: {
        position: 'relative',
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    profileImageFallback: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImageText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    profileRole: {
        fontSize: 14,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 6,
    },
    textInput: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        fontSize: 14,
    },
    passwordSection: {
        marginBottom: 16,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingTitle: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 2,
    },
    settingDescription: {
        fontSize: 12,
        lineHeight: 16,
    },
    dropdown: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        minWidth: 80,
    },
    dropdownText: {
        fontSize: 12,
        textAlign: 'center',
    },
    themeOptions: {
        flexDirection: 'row',
        gap: 12,
    },
    themeOption: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
    },
    themeOptionText: {
        fontSize: 12,
        fontWeight: '500',
    },
    colorPalettes: {
        gap: 12,
    },
    colorPalette: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 12,
        borderWidth: 2,
    },
    colorPreview: {
        flexDirection: 'row',
        gap: 4,
    },
    colorDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },
    colorPaletteName: {
        fontSize: 14,
        fontWeight: '500',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 16,
        marginVertical: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // User Management Styles
    sectionInfo: {
        flex: 1,
    },
    sectionSubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    refreshButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 14,
        marginTop: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
    },
    usersContainer: {
        gap: 12,
    },
    // User Card Styles
    userCard: {
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
        overflow: 'hidden',
    },
    userMainInfo: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'flex-start',
        gap: 12,
    },
    userAvatar: {
        width: 48,
        height: 48,
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    userInfo: {
        flex: 1,
        gap: 4,
    },
    userNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    userEmail: {
        fontSize: 14,
        fontWeight: '400',
    },
    userMetaInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 4,
    },
    phoneInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    phoneText: {
        fontSize: 12,
        fontWeight: '400',
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    locationText: {
        fontSize: 12,
        fontWeight: '400',
    },
    userActions: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 8,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 6,
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: '500',
    },
    editBtn: {
        // Additional styles for edit button if needed
    },
    statusBtn: {
        // Additional styles for status button if needed
    },
    deleteBtn: {
        // Additional styles for delete button if needed
    },
    userFooter: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderTopWidth: 1,
    },
    footerText: {
        fontSize: 11,
        fontWeight: '400',
        textAlign: 'center',
    },
    // Search and Filter Controls
    controlsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
        alignItems: 'center',
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        paddingVertical: 0,
        fontWeight: '400',
    },
    filterToggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        gap: 8,
    },
    filterToggleText: {
        fontSize: 14,
        fontWeight: '500',
    },
    filtersPanel: {
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 16,
    },
    filterSection: {
        gap: 8,
    },
    filterSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    filterChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '500',
    },
    clearAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        gap: 6,
        marginTop: 8,
    },
    clearAllText: {
        fontSize: 12,
        fontWeight: '500',
    },
});
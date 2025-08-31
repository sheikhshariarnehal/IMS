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
    Alert,
    RefreshControl,
    Dimensions,
} from 'react-native';
import {
    Plus,
    Search,
    Filter,
    Download,
    FileText,
    BarChart3,
    PieChart,
    TrendingUp,
    DollarSign,
    Users,
    Calendar,
    Eye,
    Edit,
    Trash2,
    Mail,
    Settings,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Target,
    Activity,
    Zap,
    BookOpen,
    Database,
    Share2,
    Printer,
    FileSpreadsheet,
    File as FilePdf,
    FileJson,
    Package,
    Warehouse,
    TestTube,
    Clock,
    ArrowRight
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import SharedLayout from '@/components/SharedLayout';
import { FormService } from '@/lib/services/formService';
import {
    ReportType,
    SalesReport,
    CustomerReport,
    InventoryReport,
    FinancialReport,
    SampleReport,
    ScheduledReport,
    ReportTemplate,
    ExportFormat,
    BusinessIntelligence
} from '@/types/reports';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

// Mock data for reports
const mockSalesReports: SalesReport[] = [
    {
        id: '1',
        reportName: 'Monthly Sales Report - January 2025',
        reportType: 'monthly',
        dateRange: {
            start: new Date('2025-01-01'),
            end: new Date('2025-01-31'),
        },
        totalSales: 156,
        totalRevenue: 2847500,
        totalTransactions: 156,
        averageOrderValue: 18254,

        topCustomers: [
            {
                customerId: '1',
                customerName: 'Rahman Furniture',
                totalPurchases: 12,
                totalSpent: 425000,
                lastPurchase: new Date('2025-01-28'),
            },
            {
                customerId: '3',
                customerName: 'Modern Home Decor',
                totalPurchases: 8,
                totalSpent: 320000,
                lastPurchase: new Date('2025-01-25'),
            },
        ],
        salesByCategory: [
            { category: 'Sofa Fabrics', sales: 85, revenue: 1275000, percentage: 44.8 },
            { category: 'Curtains', sales: 42, revenue: 756000, percentage: 26.5 },
            { category: 'Artificial Leather', sales: 29, revenue: 816500, percentage: 28.7 },
        ],
        salesByLocation: [
            { locationId: '1', locationName: 'Main Warehouse', sales: 98, revenue: 1847500 },
            { locationId: '2', locationName: 'Gulshan Showroom', sales: 35, revenue: 625000 },
            { locationId: '3', locationName: 'Dhanmondi Showroom', sales: 23, revenue: 375000 },
        ],
        paymentAnalysis: {
            paid: 2450000,
            pending: 285000,
            overdue: 112500,
            totalDue: 397500,
        },
        trends: [
            { date: new Date('2025-01-01'), sales: 8, revenue: 145000, transactions: 8 },
            { date: new Date('2025-01-07'), sales: 12, revenue: 218000, transactions: 12 },
            { date: new Date('2025-01-14'), sales: 15, revenue: 275000, transactions: 15 },
            { date: new Date('2025-01-21'), sales: 18, revenue: 325000, transactions: 18 },
            { date: new Date('2025-01-28'), sales: 22, revenue: 385000, transactions: 22 },
        ],
        generatedAt: new Date(),
        generatedBy: 'Admin User',
    },
];

const mockScheduledReports: ScheduledReport[] = [
    {
        id: '1',
        name: 'Daily Sales Summary',
        reportType: 'sales',
        template: 'daily-sales-template',
        schedule: {
            frequency: 'daily',
            time: '08:00',
            timezone: 'Asia/Dhaka',
        },
        recipients: [
            { userId: '1', email: 'admin@serranotex.com', name: 'Admin User' },
            { userId: '2', email: 'manager@serranotex.com', name: 'Sales Manager' },
        ],
        format: ['pdf', 'excel'],
        isActive: true,
        lastRun: new Date('2025-01-17T08:00:00'),
        nextRun: new Date('2025-01-18T08:00:00'),
        createdBy: 'Super Admin',
        createdAt: new Date('2025-01-01'),
    },
    {
        id: '2',
        name: 'Weekly Inventory Report',
        reportType: 'sales',
        template: 'weekly-inventory-template',
        schedule: {
            frequency: 'weekly',
            time: '09:00',
            dayOfWeek: 1, // Monday
            timezone: 'Asia/Dhaka',
        },
        recipients: [
            { userId: '1', email: 'admin@serranotex.com', name: 'Admin User' },
            { userId: '3', email: 'inventory@serranotex.com', name: 'Inventory Manager' },
        ],
        format: ['pdf'],
        isActive: true,
        lastRun: new Date('2025-01-13T09:00:00'),
        nextRun: new Date('2025-01-20T09:00:00'),
        createdBy: 'Admin User',
        createdAt: new Date('2025-01-01'),
    },
];

const mockBusinessIntelligence: BusinessIntelligence = {
    kpis: {
        revenue: {
            current: 2847500,
            previous: 2456000,
            growth: 15.9,
            target: 3000000,
            achievement: 94.9,
        },
        profit: {
            current: 854250,
            previous: 736800,
            margin: 30.0,
            target: 900000,
        },
        customers: {
            total: 156,
            new: 12,
            retained: 144,
            churn: 3.2,
        },
        inventory: {
            turnover: 4.2,
            value: 1250000,
            efficiency: 87.5,
            wastage: 2.1,
        },
    },
    trends: [
        {
            sales: [
                { date: new Date('2025-01-01'), value: 145000 },
                { date: new Date('2025-01-07'), value: 218000 },
                { date: new Date('2025-01-14'), value: 275000 },
                { date: new Date('2025-01-21'), value: 325000 },
                { date: new Date('2025-01-28'), value: 385000 },
            ]
        },
    ],
    forecasts: {
        sales: [
            { date: new Date('2025-02-01'), predicted: 420000, confidence: 85 },
            { date: new Date('2025-02-07'), predicted: 465000, confidence: 82 },
            { date: new Date('2025-02-14'), predicted: 510000, confidence: 78 },
        ],

        cashFlow: [
            { date: new Date('2025-02-01'), predicted: 285000, confidence: 90 },
            { date: new Date('2025-02-15'), predicted: 320000, confidence: 87 },
        ],
    },
    insights: [
        {
            id: '1',
            type: 'opportunity',
            title: 'Sofa Fabrics Demand Surge',
            description: 'Premium velvet sofa fabrics showing 45% increase in demand. Consider increasing inventory.',
            impact: 'high',
            confidence: 92,
            recommendations: [
                'Increase premium velvet inventory by 30%',
                'Contact suppliers for bulk pricing',
                'Consider introducing new velvet colors',
            ],
            dataPoints: { demandIncrease: 45, currentStock: 450, recommendedStock: 585 },
            generatedAt: new Date(),
        },
        {
            id: '2',
            type: 'risk',
            title: 'Payment Collection Risk',
            description: 'Overdue payments increased by 25% this month. 3 customers at risk of red-listing.',
            impact: 'medium',
            confidence: 88,
            recommendations: [
                'Implement stricter credit policies',
                'Send payment reminders earlier',
                'Consider payment incentives for early settlement',
            ],
            dataPoints: { overdueIncrease: 25, atRiskCustomers: 3, totalOverdue: 112500 },
            generatedAt: new Date(),
        },
    ],
};

export default function ReportsPage() {
    const { theme } = useTheme();
    const { hasPermission, user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'reports' | 'scheduled' | 'templates' | 'analytics'>('reports');
    const [selectedReportType, setSelectedReportType] = useState<ReportType>('sales');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        end: new Date(),
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const reportTypes = [
        { id: 'sales', label: 'Sales Reports', icon: DollarSign, color: theme.colors.status.success },
        { id: 'customer', label: 'Customer Reports', icon: Users, color: theme.colors.status.info },
        { id: 'financial', label: 'Financial Reports', icon: BarChart3, color: theme.colors.status.success },
        { id: 'sample', label: 'Sample Reports', icon: TestTube, color: theme.colors.primary },
    ];

    const exportFormats = [
        { id: 'pdf', label: 'PDF', icon: FilePdf, color: theme.colors.status.error },
        { id: 'excel', label: 'Excel', icon: FileSpreadsheet, color: theme.colors.status.success },
        { id: 'csv', label: 'CSV', icon: FileText, color: theme.colors.status.info },
        { id: 'json', label: 'JSON', icon: FileJson, color: theme.colors.status.warning },
    ];

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    const generateReport = async (type: ReportType, format: ExportFormat) => {
        setIsGenerating(true);

        try {
            let reportData: any = {};

            switch (type) {
                case 'sales':
                    // Generate sales report from real data
                    const salesData = await FormService.getSalesSummary({
                        startDate: dateRange.start.toISOString(),
                        endDate: dateRange.end.toISOString()
                    });

                    reportData = {
                        type: 'Sales Report',
                        dateRange: `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`,
                        totalSales: salesData.length,
                        totalRevenue: salesData.reduce((sum: number, sale: any) => sum + parseFloat(sale.total_amount || '0'), 0),
                        paidAmount: salesData.filter((sale: any) => sale.payment_status === 'paid')
                            .reduce((sum: number, sale: any) => sum + parseFloat(sale.total_amount || '0'), 0),
                        pendingAmount: salesData.filter((sale: any) => sale.payment_status === 'pending')
                            .reduce((sum: number, sale: any) => sum + parseFloat(sale.due_amount || '0'), 0),
                        data: salesData
                    };
                    break;

                case 'customer':
                    // Generate customer report from real data
                    const customersData = await FormService.getCustomers();
                    const redListData = await FormService.getRedListCustomers();

                    reportData = {
                        type: 'Customer Report',
                        totalCustomers: customersData.length,
                        activeCustomers: customersData.filter((c: any) => !c.red_list_status).length,
                        redListCustomers: redListData.length,
                        totalDue: customersData.reduce((sum: number, c: any) => sum + parseFloat(c.total_due || '0'), 0),
                        data: customersData
                    };
                    break;

                case 'inventory':
                    // Generate inventory report from real data
                    const inventoryData = await FormService.getInventorySummary();
                    const lowStockData = await FormService.getLowStockProducts();

                    reportData = {
                        type: 'Inventory Report',
                        totalProducts: inventoryData.length,
                        lowStockProducts: lowStockData.length,
                        totalValue: inventoryData.reduce((sum: number, item: any) =>
                            sum + (item.total_quantity || 0) * (item.average_price || 0), 0),
                        data: inventoryData
                    };
                    break;

                case 'sample':
                    // Generate sample report from real data
                    const sampleData = await FormService.getSampleTracking();

                    reportData = {
                        type: 'Sample Report',
                        totalSamples: sampleData.length,
                        convertedSamples: sampleData.filter((s: any) => s.sample_status === 'converted').length,
                        pendingSamples: sampleData.filter((s: any) => s.sample_status === 'delivered').length,
                        totalCost: sampleData.reduce((sum: number, s: any) => sum + parseFloat(s.cost || '0'), 0),
                        data: sampleData
                    };
                    break;
            }

            // Log the report data (in real app, this would export to file)
            console.log(`Generated ${type} report:`, reportData);

            Alert.alert(
                'Report Generated',
                `${reportData.type} generated successfully!\n\nFormat: ${format.toUpperCase()}\nData points: ${reportData.data?.length || 0}`
            );

        } catch (error) {
            console.error('Error generating report:', error);
            Alert.alert('Error', 'Failed to generate report. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleReportAction = (action: string, report: any) => {
        switch (action) {
            case 'view':
                Alert.alert('View Report', `Viewing ${report.reportName || report.name}`);
                break;
            case 'download':
                Alert.alert('Download Report', `Downloading ${report.reportName || report.name}`);
                break;
            case 'share':
                Alert.alert('Share Report', `Sharing ${report.reportName || report.name}`);
                break;
            case 'edit':
                if (!hasPermission('reports', 'edit')) {
                    Alert.alert('Permission Denied', 'You do not have permission to edit reports.');
                    return;
                }
                Alert.alert('Edit Report', `Editing ${report.reportName || report.name}`);
                break;
            case 'delete':
                if (!hasPermission('reports', 'delete')) {
                    Alert.alert('Permission Denied', 'You do not have permission to delete reports.');
                    return;
                }
                Alert.alert('Delete Report', `Delete ${report.reportName || report.name}?`);
                break;
        }
    };

    const renderKPICards = () => (
        <View style={styles.kpiContainer}>
            <View style={styles.kpiRow}>
                <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.success + '20' }]}>
                        <DollarSign size={24} color={theme.colors.status.success} />
                    </View>
                    <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>
                        ৳{mockBusinessIntelligence.kpis.revenue.current.toLocaleString()}
                    </Text>
                    <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Total Revenue</Text>
                    <View style={styles.kpiChange}>
                        <TrendingUp size={12} color={theme.colors.status.success} />
                        <Text style={[styles.kpiChangeText, { color: theme.colors.status.success }]}>
                            +{mockBusinessIntelligence.kpis.revenue.growth}%
                        </Text>
                    </View>
                </View>

                <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                        <Target size={24} color={theme.colors.primary} />
                    </View>
                    <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>
                        ৳{mockBusinessIntelligence.kpis.profit.current.toLocaleString()}
                    </Text>
                    <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Gross Profit</Text>
                    <View style={styles.kpiChange}>
                        <Activity size={12} color={theme.colors.primary} />
                        <Text style={[styles.kpiChangeText, { color: theme.colors.primary }]}>
                            {mockBusinessIntelligence.kpis.profit.margin}% margin
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.kpiRow}>
                <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.info + '20' }]}>
                        <Users size={24} color={theme.colors.status.info} />
                    </View>
                    <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>
                        {mockBusinessIntelligence.kpis.customers.total}
                    </Text>
                    <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Total Customers</Text>
                    <View style={styles.kpiChange}>
                        <Plus size={12} color={theme.colors.status.success} />
                        <Text style={[styles.kpiChangeText, { color: theme.colors.status.success }]}>
                            {mockBusinessIntelligence.kpis.customers.new} new
                        </Text>
                    </View>
                </View>

                <View style={[styles.kpiCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: theme.colors.status.warning + '20' }]}>
                        <Package size={24} color={theme.colors.status.warning} />
                    </View>
                    <Text style={[styles.kpiValue, { color: theme.colors.text.primary }]}>
                        {mockBusinessIntelligence.kpis.inventory.turnover}x
                    </Text>
                    <Text style={[styles.kpiLabel, { color: theme.colors.text.secondary }]}>Inventory Turnover</Text>
                    <View style={styles.kpiChange}>
                        <Zap size={12} color={theme.colors.status.warning} />
                        <Text style={[styles.kpiChangeText, { color: theme.colors.status.warning }]}>
                            {mockBusinessIntelligence.kpis.inventory.efficiency}% efficiency
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderTabs = () => (
        <View style={[styles.tabContainer, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'reports' && { borderBottomColor: theme.colors.primary }]}
                onPress={() => setActiveTab('reports')}
            >
                <FileText size={16} color={activeTab === 'reports' ? theme.colors.primary : theme.colors.text.secondary} />
                <Text style={[
                    styles.tabText,
                    { color: activeTab === 'reports' ? theme.colors.primary : theme.colors.text.secondary }
                ]}>
                    Reports
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.tab, activeTab === 'scheduled' && { borderBottomColor: theme.colors.primary }]}
                onPress={() => setActiveTab('scheduled')}
            >
                <Clock size={16} color={activeTab === 'scheduled' ? theme.colors.primary : theme.colors.text.secondary} />
                <Text style={[
                    styles.tabText,
                    { color: activeTab === 'scheduled' ? theme.colors.primary : theme.colors.text.secondary }
                ]}>
                    Scheduled
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.tab, activeTab === 'templates' && { borderBottomColor: theme.colors.primary }]}
                onPress={() => setActiveTab('templates')}
            >
                <BookOpen size={16} color={activeTab === 'templates' ? theme.colors.primary : theme.colors.text.secondary} />
                <Text style={[
                    styles.tabText,
                    { color: activeTab === 'templates' ? theme.colors.primary : theme.colors.text.secondary }
                ]}>
                    Templates
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.tab, activeTab === 'analytics' && { borderBottomColor: theme.colors.primary }]}
                onPress={() => setActiveTab('analytics')}
            >
                <BarChart3 size={16} color={activeTab === 'analytics' ? theme.colors.primary : theme.colors.text.secondary} />
                <Text style={[
                    styles.tabText,
                    { color: activeTab === 'analytics' ? theme.colors.primary : theme.colors.text.secondary }
                ]}>
                    Analytics
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderReportTypeCard = ({ item }: { item: typeof reportTypes[0] }) => {
        const IconComponent = item.icon;
        const isSelected = selectedReportType === item.id;

        return (
            <TouchableOpacity
                style={[
                    styles.reportTypeCard,
                    {
                        backgroundColor: theme.colors.card,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        borderWidth: isSelected ? 2 : 1,
                    }
                ]}
                onPress={() => setSelectedReportType(item.id as ReportType)}
            >
                <View style={styles.reportTypeHeader}>
                    <View style={[styles.reportTypeIcon, { backgroundColor: item.color + '20' }]}>
                        <IconComponent size={24} color={item.color} />
                    </View>
                    <Text style={[styles.reportTypeTitle, { color: theme.colors.text.primary }]}>
                        {item.label}
                    </Text>
                </View>

                <Text style={[styles.reportTypeDescription, { color: theme.colors.text.secondary }]}>
                    Generate comprehensive {item.label.toLowerCase()} with detailed analytics and insights.
                </Text>

                <View style={styles.reportTypeActions}>
                    {exportFormats.slice(0, 2).map((format) => {
                        const FormatIcon = format.icon;
                        return (
                            <TouchableOpacity
                                key={format.id}
                                style={[styles.formatButton, { backgroundColor: theme.colors.backgroundSecondary }]}
                                onPress={() => generateReport(item.id as ReportType, format.id as ExportFormat)}
                                disabled={isGenerating}
                            >
                                <FormatIcon size={14} color={format.color} />
                                <Text style={[styles.formatButtonText, { color: theme.colors.text.primary }]}>
                                    {format.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </TouchableOpacity>
        );
    };

    const renderReportItem = ({ item }: { item: SalesReport }) => (
        <View style={[styles.reportCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.reportHeader}>
                <View style={styles.reportInfo}>
                    <Text style={[styles.reportTitle, { color: theme.colors.text.primary }]} numberOfLines={2}>
                        {item.reportName}
                    </Text>
                    <View style={styles.reportMeta}>
                        <View style={styles.reportMetaItem}>
                            <Calendar size={12} color={theme.colors.text.muted} />
                            <Text style={[styles.reportMetaText, { color: theme.colors.text.muted }]}>
                                {item.dateRange.start.toLocaleDateString()} - {item.dateRange.end.toLocaleDateString()}
                            </Text>
                        </View>
                        <Text style={[styles.reportMetaText, { color: theme.colors.text.muted }]}>
                            by {item.generatedBy}
                        </Text>
                    </View>
                </View>
                <View style={[styles.reportTypeIcon, { backgroundColor: theme.colors.status.success + '20' }]}>
                    <FileText size={20} color={theme.colors.status.success} />
                </View>
            </View>

            <View style={styles.reportStats}>
                <View style={styles.reportStat}>
                    <Text style={[styles.reportStatValue, { color: theme.colors.primary }]}>
                        ৳{item.totalRevenue.toLocaleString()}
                    </Text>
                    <Text style={[styles.reportStatLabel, { color: theme.colors.text.secondary }]}>Revenue</Text>
                </View>
                <View style={styles.reportStat}>
                    <Text style={[styles.reportStatValue, { color: theme.colors.status.info }]}>
                        {item.totalSales}
                    </Text>
                    <Text style={[styles.reportStatLabel, { color: theme.colors.text.secondary }]}>Sales</Text>
                </View>
                <View style={styles.reportStat}>
                    <Text style={[styles.reportStatValue, { color: theme.colors.status.warning }]}>
                        ৳{item.averageOrderValue.toLocaleString()}
                    </Text>
                    <Text style={[styles.reportStatLabel, { color: theme.colors.text.secondary }]}>Avg Order</Text>
                </View>
            </View>

            <View style={styles.reportActions}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.colors.status.info + '20' }]}
                    onPress={() => handleReportAction('view', item)}
                >
                    <Eye size={16} color={theme.colors.status.info} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.colors.primary + '20' }]}
                    onPress={() => handleReportAction('download', item)}
                >
                    <Download size={16} color={theme.colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.colors.status.success + '20' }]}
                    onPress={() => handleReportAction('share', item)}
                >
                    <Share2 size={16} color={theme.colors.status.success} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderScheduledReportItem = ({ item }: { item: ScheduledReport }) => (
        <View style={[styles.reportCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.reportHeader}>
                <View style={styles.reportInfo}>
                    <Text style={[styles.reportTitle, { color: theme.colors.text.primary }]}>
                        {item.name}
                    </Text>
                    <View style={styles.reportMeta}>
                        <View style={styles.reportMetaItem}>
                            <Clock size={12} color={theme.colors.text.muted} />
                            <Text style={[styles.reportMetaText, { color: theme.colors.text.muted }]}>
                                {item.schedule.frequency} at {item.schedule.time}
                            </Text>
                        </View>
                        <View style={styles.reportMetaItem}>
                            <Mail size={12} color={theme.colors.text.muted} />
                            <Text style={[styles.reportMetaText, { color: theme.colors.text.muted }]}>
                                {item.recipients.length} recipient(s)
                            </Text>
                        </View>
                    </View>
                </View>
                <View style={[
                    styles.statusBadge,
                    {
                        backgroundColor: item.isActive ? theme.colors.status.success + '20' : theme.colors.text.muted + '20',
                    }
                ]}>
                    <Text style={[
                        styles.statusBadgeText,
                        { color: item.isActive ? theme.colors.status.success : theme.colors.text.muted }
                    ]}>
                        {item.isActive ? 'Active' : 'Inactive'}
                    </Text>
                </View>
            </View>

            <View style={styles.scheduleInfo}>
                <Text style={[styles.scheduleInfoText, { color: theme.colors.text.secondary }]}>
                    Last run: {item.lastRun?.toLocaleDateString() || 'Never'}
                </Text>
                <Text style={[styles.scheduleInfoText, { color: theme.colors.text.secondary }]}>
                    Next run: {item.nextRun?.toLocaleDateString() || 'Not scheduled'}
                </Text>
            </View>

            <View style={styles.reportActions}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.colors.status.info + '20' }]}
                    onPress={() => handleReportAction('view', item)}
                >
                    <Eye size={16} color={theme.colors.status.info} />
                </TouchableOpacity>

                {hasPermission('reports', 'edit') && (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.colors.status.warning + '20' }]}
                        onPress={() => handleReportAction('edit', item)}
                    >
                        <Edit size={16} color={theme.colors.status.warning} />
                    </TouchableOpacity>
                )}

                {hasPermission('reports', 'delete') && (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.colors.status.error + '20' }]}
                        onPress={() => handleReportAction('delete', item)}
                    >
                        <Trash2 size={16} color={theme.colors.status.error} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const renderInsightCard = ({ item }: { item: typeof mockBusinessIntelligence.insights[0] }) => (
        <View style={[
            styles.insightCard,
            {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                borderLeftColor: item.type === 'opportunity' ? theme.colors.status.success :
                    item.type === 'risk' ? theme.colors.status.error :
                        item.type === 'trend' ? theme.colors.status.info :
                            theme.colors.status.warning,
                borderLeftWidth: 4,
            }
        ]}>
            <View style={styles.insightHeader}>
                <Text style={[styles.insightTitle, { color: theme.colors.text.primary }]}>
                    {item.title}
                </Text>
                <View style={styles.insightMeta}>
                    <View style={[
                        styles.impactBadge,
                        {
                            backgroundColor: item.impact === 'high' ? theme.colors.status.error + '20' :
                                item.impact === 'medium' ? theme.colors.status.warning + '20' :
                                    theme.colors.status.success + '20'
                        }
                    ]}>
                        <Text style={[
                            styles.impactBadgeText,
                            {
                                color: item.impact === 'high' ? theme.colors.status.error :
                                    item.impact === 'medium' ? theme.colors.status.warning :
                                        theme.colors.status.success
                            }
                        ]}>
                            {item.impact.toUpperCase()}
                        </Text>
                    </View>
                    <Text style={[styles.confidenceText, { color: theme.colors.text.muted }]}>
                        {item.confidence}% confidence
                    </Text>
                </View>
            </View>

            <Text style={[styles.insightDescription, { color: theme.colors.text.secondary }]}>
                {item.description}
            </Text>

            <View style={styles.recommendationsContainer}>
                <Text style={[styles.recommendationsTitle, { color: theme.colors.text.primary }]}>
                    Recommendations:
                </Text>
                {item.recommendations.slice(0, 2).map((rec, index) => (
                    <Text key={index} style={[styles.recommendationItem, { color: theme.colors.text.secondary }]}>
                        • {rec}
                    </Text>
                ))}
                {item.recommendations.length > 2 && (
                    <Text style={[styles.moreRecommendations, { color: theme.colors.primary }]}>
                        +{item.recommendations.length - 2} more recommendations
                    </Text>
                )}
            </View>
        </View>
    );

    const renderQuickActions = () => (
        <View style={[styles.quickActionsCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.quickActionsTitle, { color: theme.colors.text.primary }]}>
                Quick Actions
            </Text>

            <View style={styles.quickActionsList}>
                <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: theme.colors.primary }]}>
                    <FileText size={16} color={theme.colors.text.inverse} />
                    <Text style={[styles.quickActionText, { color: theme.colors.text.inverse }]}>
                        Generate Monthly Report
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: theme.colors.backgroundSecondary }]}>
                    <Calendar size={16} color={theme.colors.primary} />
                    <Text style={[styles.quickActionText, { color: theme.colors.text.primary }]}>
                        Schedule Report
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: theme.colors.backgroundSecondary }]}>
                    <Share2 size={16} color={theme.colors.primary} />
                    <Text style={[styles.quickActionText, { color: theme.colors.text.primary }]}>
                        Share Dashboard
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: theme.colors.backgroundSecondary }]}>
                    <Settings size={16} color={theme.colors.primary} />
                    <Text style={[styles.quickActionText, { color: theme.colors.text.primary }]}>
                        Customize View
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderExportOptions = () => (
        <View style={[styles.exportCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.exportTitle, { color: theme.colors.text.primary }]}>
                Export Options
            </Text>

            <View style={styles.exportGrid}>
                {exportFormats.map((format) => {
                    const FormatIcon = format.icon;
                    return (
                        <TouchableOpacity
                            key={format.id}
                            style={[styles.exportButton, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}
                            onPress={() => generateReport('sales', format.id as ExportFormat)}
                            disabled={isGenerating}
                        >
                            <FormatIcon size={20} color={format.color} />
                            <Text style={[styles.exportButtonText, { color: theme.colors.text.primary }]}>
                                {format.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'reports':
                return (
                    <View>
                        {/* Report Type Selection */}
                        <FlatList
                            data={reportTypes}
                            renderItem={renderReportTypeCard}
                            keyExtractor={(item) => item.id}
                            numColumns={1}
                            key={`reportTypes-${activeTab}-1`}
                            contentContainerStyle={styles.reportTypesContainer}
                            showsVerticalScrollIndicator={false}
                            scrollEnabled={false}
                        />

                        {/* Recent Reports */}
                        <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                                    Recent Reports
                                </Text>
                                <TouchableOpacity style={styles.refreshButton}>
                                    <RefreshCw size={16} color={theme.colors.primary} />
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={mockSalesReports}
                                renderItem={renderReportItem}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={styles.reportsContainer}
                                showsVerticalScrollIndicator={false}
                                scrollEnabled={false}
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <FileText size={48} color={theme.colors.text.muted} />
                                        <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                                            No reports found
                                        </Text>
                                        <Text style={[styles.emptySubtext, { color: theme.colors.text.muted }]}>
                                            Generate your first report to get started
                                        </Text>
                                    </View>
                                }
                            />
                        </View>
                    </View>
                );

            case 'scheduled':
                return (
                    <View>
                        <FlatList
                            data={mockScheduledReports}
                            renderItem={renderScheduledReportItem}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.reportsContainer}
                            showsVerticalScrollIndicator={false}
                            scrollEnabled={false}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Clock size={48} color={theme.colors.text.muted} />
                                    <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                                        No scheduled reports
                                    </Text>
                                    <Text style={[styles.emptySubtext, { color: theme.colors.text.muted }]}>
                                        Create a schedule to automate your reports
                                    </Text>
                                </View>
                            }
                        />
                    </View>
                );

            case 'templates':
                return (
                    <View style={styles.placeholderContainer}>
                        <BookOpen size={48} color={theme.colors.text.muted} />
                        <Text style={[styles.placeholderTitle, { color: theme.colors.text.secondary }]}>
                            Report Templates
                        </Text>
                        <Text style={[styles.placeholderSubtitle, { color: theme.colors.text.muted }]}>
                            Template management interface coming soon...
                        </Text>
                    </View>
                );

            case 'analytics':
                return (
                    <View>
                        {/* AI Insights */}
                        <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTitleContainer}>
                                    <Zap size={20} color={theme.colors.primary} />
                                    <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                                        AI-Powered Business Insights
                                    </Text>
                                </View>
                            </View>

                            <FlatList
                                data={mockBusinessIntelligence.insights}
                                renderItem={renderInsightCard}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={styles.insightsContainer}
                                showsVerticalScrollIndicator={false}
                                scrollEnabled={false}
                            />
                        </View>

                        {/* Quick Actions and Export Options */}
                        <View style={styles.actionsRow}>
                            {renderQuickActions()}
                            {renderExportOptions()}
                        </View>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <SharedLayout title="Reports">
            <View style={styles.headerActions}>
                <TouchableOpacity
                    style={[styles.headerButton, { backgroundColor: theme.colors.backgroundSecondary }]}
                >
                    <Settings size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                {hasPermission('reports', 'add') && (
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                        onPress={() => Alert.alert('Add Report', 'Add new report functionality')}
                    >
                        <Plus size={20} color={theme.colors.text.inverse} />
                    </TouchableOpacity>
                )}
            </View>

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
                {/* KPI Cards */}
                {renderKPICards()}

                {/* Tabs */}
                {renderTabs()}

                {/* Search and Filters - Only show for reports and scheduled tabs */}
                {(activeTab === 'reports' || activeTab === 'scheduled') && (
                    <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
                        <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.input, borderColor: theme.colors.border }]}>
                            <Search size={20} color={theme.colors.text.secondary} />
                            <TextInput
                                style={[styles.searchInput, { color: theme.colors.text.primary }]}
                                placeholder="Search reports..."
                                placeholderTextColor={theme.colors.text.muted}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        <TouchableOpacity
                            style={[styles.filterButton, { backgroundColor: theme.colors.backgroundSecondary }]}
                        >
                            <Filter size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Tab Content */}
                {renderTabContent()}
            </ScrollView>
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
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButton: {
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    kpiIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    kpiValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    kpiLabel: {
        fontSize: 12,
        marginBottom: 8,
    },
    kpiChange: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    kpiChangeText: {
        fontSize: 12,
        fontWeight: '500',
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
    },
    filterButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reportTypesContainer: {
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 16,
    },
    reportTypeCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    reportTypeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    reportTypeIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reportTypeTitle: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    reportTypeDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    reportTypeActions: {
        flexDirection: 'row',
        gap: 8,
    },
    formatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    formatButtonText: {
        fontSize: 12,
        fontWeight: '500',
    },
    sectionCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    refreshButton: {
        padding: 4,
    },
    reportsContainer: {
        padding: 16,
        gap: 12,
    },
    reportCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    reportHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 12,
    },
    reportInfo: {
        flex: 1,
    },
    reportTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    reportMeta: {
        gap: 4,
    },
    reportMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    reportMetaText: {
        fontSize: 12,
    },
    reportStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    reportStat: {
        alignItems: 'center',
    },
    reportStatValue: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    reportStatLabel: {
        fontSize: 12,
    },
    reportActions: {
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
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    scheduleInfo: {
        marginBottom: 16,
        gap: 4,
    },
    scheduleInfoText: {
        fontSize: 12,
    },
    insightsContainer: {
        padding: 16,
        gap: 12,
    },
    insightCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    insightHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    insightTitle: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        marginRight: 12,
    },
    insightMeta: {
        alignItems: 'flex-end',
        gap: 4,
    },
    impactBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    impactBadgeText: {
        fontSize: 10,
        fontWeight: '600',
    },
    confidenceText: {
        fontSize: 10,
    },
    insightDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    recommendationsContainer: {
        gap: 6,
    },
    recommendationsTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    recommendationItem: {
        fontSize: 12,
        lineHeight: 18,
    },
    moreRecommendations: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
    },
    actionsRow: {
        flexDirection: 'column',
        gap: 16,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    quickActionsCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    quickActionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    quickActionsList: {
        gap: 12,
    },
    quickActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
    },
    quickActionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    exportCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    exportTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    exportGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    exportButton: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        width: '48%',
    },
    exportButtonText: {
        fontSize: 12,
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        gap: 12,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500',
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
    },
    placeholderContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
        gap: 16,
    },
    placeholderTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    placeholderSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 32,
    },
});
import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    FlatList,
    RefreshControl,
    Alert,
    Modal,
    Image,
} from 'react-native';
import {
    Search,
    BookOpen,
    Play,
    HelpCircle,
    MessageSquare,
    Star,
    ThumbsUp,
    ThumbsDown,
    Clock,
    User,
    Tag,
    Filter,
    ExternalLink,
    Download,
    FileText,
    Video,
    X,
    ChevronDown,
    ChevronUp,
    Send,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import SharedLayout from '@/components/SharedLayout';

// Types
interface HelpArticle {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    isPublished: boolean;
    views: number;
    helpful: number;
    notHelpful: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}

interface VideoTutorial {
    id: string;
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl: string;
    duration: number; // in seconds
    category: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    views: number;
    likes: number;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
    isPublished: boolean;
    order: number;
    helpful: number;
    notHelpful: number;
    createdAt: Date;
    updatedAt: Date;
}

interface HelpFilters {
    search?: string;
    category?: string;
    difficulty?: string;
}

interface ContactForm {
    subject: string;
    category: string;
    description: string;
}

// Mock data
const mockHelpArticles: HelpArticle[] = [
    {
        id: '1',
        title: 'Getting Started with Serrano Tex IMS',
        content: 'Learn the basics of navigating and using the Inventory Management System. This comprehensive guide will walk you through the main features and help you get up to speed quickly.',
        category: 'Getting Started',
        tags: ['basics', 'navigation', 'overview'],
        isPublished: true,
        views: 1250,
        helpful: 45,
        notHelpful: 3,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-15'),
        createdBy: 'Support Team',
    },
    {
        id: '2',
        title: 'How to Add New Products',
        content: 'Step-by-step guide to adding new products to your inventory. Learn how to set up product categories, pricing, and stock levels effectively.',
        category: 'Products & Inventory',
        tags: ['products', 'inventory', 'add'],
        isPublished: true,
        views: 890,
        helpful: 38,
        notHelpful: 2,
        createdAt: new Date('2025-01-02'),
        updatedAt: new Date('2025-01-10'),
        createdBy: 'Support Team',
    },
    {
        id: '3',
        title: 'Managing Customer Information',
        content: 'Learn how to add, edit, and manage customer profiles effectively. This guide covers customer data management, payment tracking, and relationship management.',
        category: 'Customer Management',
        tags: ['customers', 'profiles', 'management'],
        isPublished: true,
        views: 675,
        helpful: 29,
        notHelpful: 1,
        createdAt: new Date('2025-01-03'),
        updatedAt: new Date('2025-01-12'),
        createdBy: 'Support Team',
    },
];

const mockVideoTutorials: VideoTutorial[] = [
    {
        id: '1',
        title: 'Dashboard Overview - Complete Walkthrough',
        description: 'Get familiar with the main dashboard and all its features',
        videoUrl: 'https://example.com/video1',
        thumbnailUrl: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=1',
        duration: 480, // 8 minutes
        category: 'Getting Started',
        difficulty: 'Beginner',
        views: 2340,
        likes: 89,
        isPublished: true,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
    },
    {
        id: '2',
        title: 'Product Management Best Practices',
        description: 'Learn advanced techniques for managing your product catalog',
        videoUrl: 'https://example.com/video2',
        thumbnailUrl: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=1',
        duration: 720, // 12 minutes
        category: 'Products & Inventory',
        difficulty: 'Intermediate',
        views: 1560,
        likes: 67,
        isPublished: true,
        createdAt: new Date('2025-01-05'),
        updatedAt: new Date('2025-01-05'),
    },
    {
        id: '3',
        title: 'Advanced Reporting and Analytics',
        description: 'Master the reporting features and generate insightful analytics',
        videoUrl: 'https://example.com/video3',
        thumbnailUrl: 'https://images.pexels.com/photos/3184293/pexels-photo-3184293.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=1',
        duration: 900, // 15 minutes
        category: 'Reports & Analytics',
        difficulty: 'Advanced',
        views: 890,
        likes: 45,
        isPublished: true,
        createdAt: new Date('2025-01-08'),
        updatedAt: new Date('2025-01-08'),
    },
];

const mockFAQs: FAQ[] = [
    {
        id: '1',
        question: 'How do I reset my password?',
        answer: 'You can reset your password by clicking on "Forgot Password" on the login page or by contacting your system administrator.',
        category: 'Getting Started',
        isPublished: true,
        order: 1,
        helpful: 25,
        notHelpful: 2,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
    },
    {
        id: '2',
        question: 'Can I export my inventory data?',
        answer: 'Yes, you can export your inventory data in various formats including Excel, CSV, and PDF from the inventory management section.',
        category: 'Products & Inventory',
        isPublished: true,
        order: 2,
        helpful: 18,
        notHelpful: 1,
        createdAt: new Date('2025-01-02'),
        updatedAt: new Date('2025-01-02'),
    },
    {
        id: '3',
        question: 'How do I set up low stock alerts?',
        answer: 'Low stock alerts can be configured in the notification settings. You can set custom thresholds for each product.',
        category: 'Settings & Configuration',
        isPublished: true,
        order: 3,
        helpful: 22,
        notHelpful: 0,
        createdAt: new Date('2025-01-03'),
        updatedAt: new Date('2025-01-03'),
    },
];

export default function SupportPage() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'articles' | 'videos' | 'faq' | 'contact'>('articles');
    const [articles] = useState<HelpArticle[]>(mockHelpArticles);
    const [videos] = useState<VideoTutorial[]>(mockVideoTutorials);
    const [faqs] = useState<FAQ[]>(mockFAQs);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showArticleModal, setShowArticleModal] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
    const [contactForm, setContactForm] = useState<ContactForm>({
        subject: '',
        category: '',
        description: '',
    });

    const filteredArticles = useMemo(() => {
        return articles.filter(article => {
            if (searchQuery &&
                !article.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !article.content.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
            if (selectedCategory && article.category !== selectedCategory) {
                return false;
            }
            return true;
        });
    }, [articles, searchQuery, selectedCategory]);

    const filteredVideos = useMemo(() => {
        return videos.filter(video => {
            if (searchQuery &&
                !video.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !video.description.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
            if (selectedCategory && video.category !== selectedCategory) {
                return false;
            }
            if (selectedDifficulty && video.difficulty !== selectedDifficulty) {
                return false;
            }
            return true;
        });
    }, [videos, searchQuery, selectedCategory, selectedDifficulty]);

    const filteredFAQs = useMemo(() => {
        return faqs.filter(faq => {
            if (searchQuery &&
                !faq.question.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !faq.answer.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
            if (selectedCategory && faq.category !== selectedCategory) {
                return false;
            }
            return true;
        });
    }, [faqs, searchQuery, selectedCategory]);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleArticlePress = (article: HelpArticle) => {
        setSelectedArticle(article);
        setShowArticleModal(true);
    };

    const handleSubmitTicket = () => {
        if (!contactForm.subject || !contactForm.category || !contactForm.description) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }
        Alert.alert('Success', 'Your support ticket has been submitted successfully!');
        setContactForm({ subject: '', category: '', description: '' });
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('');
        setSelectedDifficulty('');
    };

    // Render functions
    const renderTabs = () => (
        <View style={[styles.tabContainer, { borderBottomColor: theme.colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'articles' && { borderBottomColor: theme.colors.primary }]}
                    onPress={() => setActiveTab('articles')}
                >
                    <BookOpen size={16} color={activeTab === 'articles' ? theme.colors.primary : theme.colors.text.secondary} />
                    <Text style={[
                        styles.tabText,
                        { color: activeTab === 'articles' ? theme.colors.primary : theme.colors.text.secondary }
                    ]}>
                        Articles
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'videos' && { borderBottomColor: theme.colors.primary }]}
                    onPress={() => setActiveTab('videos')}
                >
                    <Play size={16} color={activeTab === 'videos' ? theme.colors.primary : theme.colors.text.secondary} />
                    <Text style={[
                        styles.tabText,
                        { color: activeTab === 'videos' ? theme.colors.primary : theme.colors.text.secondary }
                    ]}>
                        Videos
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'faq' && { borderBottomColor: theme.colors.primary }]}
                    onPress={() => setActiveTab('faq')}
                >
                    <HelpCircle size={16} color={activeTab === 'faq' ? theme.colors.primary : theme.colors.text.secondary} />
                    <Text style={[
                        styles.tabText,
                        { color: activeTab === 'faq' ? theme.colors.primary : theme.colors.text.secondary }
                    ]}>
                        FAQ
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'contact' && { borderBottomColor: theme.colors.primary }]}
                    onPress={() => setActiveTab('contact')}
                >
                    <MessageSquare size={16} color={activeTab === 'contact' ? theme.colors.primary : theme.colors.text.secondary} />
                    <Text style={[
                        styles.tabText,
                        { color: activeTab === 'contact' ? theme.colors.primary : theme.colors.text.secondary }
                    ]}>
                        Contact
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );

    const renderSearchAndFilters = () => (
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.input, borderColor: theme.colors.border }]}>
                <Search size={20} color={theme.colors.text.secondary} />
                <TextInput
                    style={[styles.searchInput, { color: theme.colors.text.primary }]}
                    placeholder="Search documentation, videos, or FAQs..."
                    placeholderTextColor={theme.colors.text.muted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery && (
                    <TouchableOpacity
                        onPress={() => setSearchQuery('')}
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
                {/* Category Filter */}
                <View style={styles.filterGroup}>
                    <Text style={[styles.filterGroupTitle, { color: theme.colors.text.primary }]}>Category</Text>
                    <View style={styles.filterChips}>
                        {['Getting Started', 'Products & Inventory', 'Customer Management', 'Reports & Analytics', 'Settings & Configuration'].map((category) => (
                            <TouchableOpacity
                                key={category}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: selectedCategory === category ? theme.colors.primary : theme.colors.backgroundSecondary,
                                        borderColor: selectedCategory === category ? theme.colors.primary : theme.colors.border,
                                    }
                                ]}
                                onPress={() => {
                                    setSelectedCategory(selectedCategory === category ? '' : category);
                                }}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    { color: selectedCategory === category ? theme.colors.text.inverse : theme.colors.text.primary }
                                ]}>
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Difficulty Filter (for videos) */}
                {activeTab === 'videos' && (
                    <View style={styles.filterGroup}>
                        <Text style={[styles.filterGroupTitle, { color: theme.colors.text.primary }]}>Difficulty</Text>
                        <View style={styles.filterChips}>
                            {['Beginner', 'Intermediate', 'Advanced'].map((difficulty) => (
                                <TouchableOpacity
                                    key={difficulty}
                                    style={[
                                        styles.filterChip,
                                        {
                                            backgroundColor: selectedDifficulty === difficulty ? theme.colors.status.info : theme.colors.backgroundSecondary,
                                            borderColor: selectedDifficulty === difficulty ? theme.colors.status.info : theme.colors.border,
                                        }
                                    ]}
                                    onPress={() => {
                                        setSelectedDifficulty(selectedDifficulty === difficulty ? '' : difficulty);
                                    }}
                                >
                                    <Text style={[
                                        styles.filterChipText,
                                        { color: selectedDifficulty === difficulty ? theme.colors.text.inverse : theme.colors.text.primary }
                                    ]}>
                                        {difficulty}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

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

    const renderArticleItem = ({ item }: { item: HelpArticle }) => (
        <TouchableOpacity
            style={[styles.itemCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => handleArticlePress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.itemHeader}>
                <View style={[styles.itemIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                    <FileText size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.itemContent}>
                    <Text style={[styles.itemTitle, { color: theme.colors.text.primary }]} numberOfLines={2}>
                        {item.title}
                    </Text>
                    <Text style={[styles.itemDescription, { color: theme.colors.text.secondary }]} numberOfLines={2}>
                        {item.content}
                    </Text>
                </View>
            </View>

            <View style={styles.itemMeta}>
                <View style={styles.metaItem}>
                    <Tag size={12} color={theme.colors.text.muted} />
                    <Text style={[styles.metaText, { color: theme.colors.text.muted }]}>{item.category}</Text>
                </View>
                <View style={styles.metaItem}>
                    <User size={12} color={theme.colors.text.muted} />
                    <Text style={[styles.metaText, { color: theme.colors.text.muted }]}>{item.views} views</Text>
                </View>
                <View style={styles.metaItem}>
                    <ThumbsUp size={12} color={theme.colors.status.success} />
                    <Text style={[styles.metaText, { color: theme.colors.status.success }]}>{item.helpful}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderVideoItem = ({ item }: { item: VideoTutorial }) => (
        <TouchableOpacity
            style={[styles.videoCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            activeOpacity={0.7}
        >
            <View style={styles.videoThumbnail}>
                <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnailImage} />
                <View style={styles.playButton}>
                    <Play size={24} color={theme.colors.text.inverse} />
                </View>
                <View style={[styles.durationBadge, { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}>
                    <Text style={[styles.durationText, { color: theme.colors.text.inverse }]}>
                        {formatDuration(item.duration)}
                    </Text>
                </View>
            </View>

            <View style={styles.videoContent}>
                <Text style={[styles.videoTitle, { color: theme.colors.text.primary }]} numberOfLines={2}>
                    {item.title}
                </Text>
                <Text style={[styles.videoDescription, { color: theme.colors.text.secondary }]} numberOfLines={2}>
                    {item.description}
                </Text>

                <View style={styles.videoMeta}>
                    <View style={[styles.difficultyBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                        <Text style={[styles.difficultyText, { color: theme.colors.primary }]}>
                            {item.difficulty}
                        </Text>
                    </View>
                    <Text style={[styles.videoViews, { color: theme.colors.text.muted }]}>
                        {item.views} views
                    </Text>
                    <View style={styles.metaItem}>
                        <ThumbsUp size={12} color={theme.colors.status.success} />
                        <Text style={[styles.metaText, { color: theme.colors.status.success }]}>{item.likes}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderFAQItem = ({ item }: { item: FAQ }) => (
        <View style={[styles.faqCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.faqHeader}>
                <View style={[styles.faqIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                    <HelpCircle size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.faqContent}>
                    <Text style={[styles.faqQuestion, { color: theme.colors.text.primary }]}>
                        {item.question}
                    </Text>
                    <Text style={[styles.faqAnswer, { color: theme.colors.text.secondary }]}>
                        {item.answer}
                    </Text>
                </View>
            </View>

            <View style={styles.faqFooter}>
                <View style={[styles.categoryBadge, { backgroundColor: theme.colors.backgroundSecondary }]}>
                    <Text style={[styles.categoryText, { color: theme.colors.text.secondary }]}>
                        {item.category}
                    </Text>
                </View>

                <View style={styles.helpfulSection}>
                    <Text style={[styles.helpfulLabel, { color: theme.colors.text.muted }]}>
                        Was this helpful?
                    </Text>
                    <View style={styles.helpfulButtons}>
                        <TouchableOpacity style={styles.helpfulButton}>
                            <ThumbsUp size={12} color={theme.colors.status.success} />
                            <Text style={[styles.helpfulCount, { color: theme.colors.status.success }]}>
                                {item.helpful}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.helpfulButton}>
                            <ThumbsDown size={12} color={theme.colors.status.error} />
                            <Text style={[styles.helpfulCount, { color: theme.colors.status.error }]}>
                                {item.notHelpful}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderContactForm = () => (
        <View style={styles.contactContainer}>
            <View style={[styles.contactCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Text style={[styles.contactTitle, { color: theme.colors.text.primary }]}>
                    Contact Support
                </Text>

                <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: theme.colors.text.secondary }]}>Subject *</Text>
                    <TextInput
                        style={[styles.formInput, { backgroundColor: theme.colors.input, borderColor: theme.colors.border, color: theme.colors.text.primary }]}
                        placeholder="Brief description of your issue"
                        placeholderTextColor={theme.colors.text.muted}
                        value={contactForm.subject}
                        onChangeText={(text) => setContactForm(prev => ({ ...prev, subject: text }))}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: theme.colors.text.secondary }]}>Category *</Text>
                    <View style={[styles.pickerContainer, { backgroundColor: theme.colors.input, borderColor: theme.colors.border }]}>
                        <Text style={[styles.pickerText, { color: contactForm.category ? theme.colors.text.primary : theme.colors.text.muted }]}>
                            {contactForm.category || 'Select a category'}
                        </Text>
                        <ChevronDown size={16} color={theme.colors.text.muted} />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: theme.colors.text.secondary }]}>Description *</Text>
                    <TextInput
                        style={[styles.formTextArea, { backgroundColor: theme.colors.input, borderColor: theme.colors.border, color: theme.colors.text.primary }]}
                        placeholder="Please provide detailed information about your issue..."
                        placeholderTextColor={theme.colors.text.muted}
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                        value={contactForm.description}
                        onChangeText={(text) => setContactForm(prev => ({ ...prev, description: text }))}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                    onPress={handleSubmitTicket}
                >
                    <Send size={16} color={theme.colors.text.inverse} />
                    <Text style={[styles.submitButtonText, { color: theme.colors.text.inverse }]}>
                        Submit Ticket
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Quick Links */}
            <View style={[styles.quickLinksCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Text style={[styles.quickLinksTitle, { color: theme.colors.text.primary }]}>
                    Quick Links
                </Text>

                <TouchableOpacity style={[styles.quickLinkItem, { backgroundColor: theme.colors.backgroundSecondary }]}>
                    <Download size={20} color={theme.colors.primary} />
                    <View style={styles.quickLinkContent}>
                        <Text style={[styles.quickLinkTitle, { color: theme.colors.text.primary }]}>
                            User Manual
                        </Text>
                        <Text style={[styles.quickLinkSubtitle, { color: theme.colors.text.muted }]}>
                            Complete guide (PDF)
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.quickLinkItem, { backgroundColor: theme.colors.backgroundSecondary }]}>
                    <Video size={20} color={theme.colors.primary} />
                    <View style={styles.quickLinkContent}>
                        <Text style={[styles.quickLinkTitle, { color: theme.colors.text.primary }]}>
                            Video Tutorials
                        </Text>
                        <Text style={[styles.quickLinkSubtitle, { color: theme.colors.text.muted }]}>
                            Step-by-step guides
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.quickLinkItem, { backgroundColor: theme.colors.backgroundSecondary }]}>
                    <MessageSquare size={20} color={theme.colors.primary} />
                    <View style={styles.quickLinkContent}>
                        <Text style={[styles.quickLinkTitle, { color: theme.colors.text.primary }]}>
                            Live Chat
                        </Text>
                        <Text style={[styles.quickLinkSubtitle, { color: theme.colors.text.muted }]}>
                            Get instant help
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );

    const getCurrentData = () => {
        switch (activeTab) {
            case 'articles':
                return filteredArticles;
            case 'videos':
                return filteredVideos;
            case 'faq':
                return filteredFAQs;
            default:
                return [];
        }
    };

    const renderCurrentTabContent = () => {
        if (activeTab === 'contact') {
            return renderContactForm();
        }

        const data = getCurrentData();
        const renderItem = ({ item }: { item: any }) => {
            switch (activeTab) {
                case 'articles':
                    return renderArticleItem({ item });
                case 'videos':
                    return renderVideoItem({ item });
                case 'faq':
                    return renderFAQItem({ item });
                default:
                    return null;
            }
        };

        return (
            <FlatList
                data={data}
                renderItem={renderItem}
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
                        {activeTab === 'articles' && <BookOpen size={48} color={theme.colors.text.muted} />}
                        {activeTab === 'videos' && <Play size={48} color={theme.colors.text.muted} />}
                        {activeTab === 'faq' && <HelpCircle size={48} color={theme.colors.text.muted} />}
                        <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                            No {activeTab} found
                        </Text>
                        <Text style={[styles.emptySubtext, { color: theme.colors.text.muted }]}>
                            Try adjusting your search or filters
                        </Text>
                    </View>
                }
            />
        );
    };

    return (
        <SharedLayout
            title="Help & Support"
            onLogout={() => {
                // Handle logout if needed
                router.push('/login');
            }}
        >
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Tabs */}
                {renderTabs()}

                {/* Search and Filters */}
                {activeTab !== 'contact' && renderSearchAndFilters()}

                {/* Expanded Filters */}
                {activeTab !== 'contact' && renderExpandedFilters()}

                {/* Content */}
                {renderCurrentTabContent()}
            </ScrollView>

            {/* Article Detail Modal */}
            <Modal
                visible={showArticleModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowArticleModal(false)}
            >
                {selectedArticle && (
                    <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                                Article Details
                            </Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setShowArticleModal(false)}
                            >
                                <X size={24} color={theme.colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            <View style={[styles.articleDetailCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                                <Text style={[styles.articleDetailTitle, { color: theme.colors.text.primary }]}>
                                    {selectedArticle.title}
                                </Text>

                                <View style={styles.articleDetailMeta}>
                                    <Text style={[styles.articleDetailMetaText, { color: theme.colors.text.muted }]}>
                                        Category: {selectedArticle.category}
                                    </Text>
                                    <Text style={[styles.articleDetailMetaText, { color: theme.colors.text.muted }]}>
                                        Views: {selectedArticle.views}
                                    </Text>
                                    <Text style={[styles.articleDetailMetaText, { color: theme.colors.text.muted }]}>
                                        Created: {selectedArticle.createdAt.toLocaleDateString()}
                                    </Text>
                                    <Text style={[styles.articleDetailMetaText, { color: theme.colors.text.muted }]}>
                                        Author: {selectedArticle.createdBy}
                                    </Text>
                                </View>

                                <Text style={[styles.articleDetailContent, { color: theme.colors.text.secondary }]}>
                                    {selectedArticle.content}
                                </Text>

                                <View style={styles.articleDetailTags}>
                                    {selectedArticle.tags.map((tag, index) => (
                                        <View key={index} style={[styles.tagBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                                            <Text style={[styles.tagText, { color: theme.colors.primary }]}>
                                                {tag}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                <View style={styles.articleDetailFooter}>
                                    <Text style={[styles.helpfulQuestion, { color: theme.colors.text.muted }]}>
                                        Was this article helpful?
                                    </Text>
                                    <View style={styles.helpfulButtons}>
                                        <TouchableOpacity style={[styles.helpfulButton, { backgroundColor: theme.colors.status.success + '20' }]}>
                                            <ThumbsUp size={16} color={theme.colors.status.success} />
                                            <Text style={[styles.helpfulButtonText, { color: theme.colors.status.success }]}>
                                                Yes ({selectedArticle.helpful})
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.helpfulButton, { backgroundColor: theme.colors.status.error + '20' }]}>
                                            <ThumbsDown size={16} color={theme.colors.status.error} />
                                            <Text style={[styles.helpfulButtonText, { color: theme.colors.status.error }]}>
                                                No ({selectedArticle.notHelpful})
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                )}
            </Modal>
        </SharedLayout>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
    },
    tabContainer: {
        borderBottomWidth: 1,
        backgroundColor: 'transparent',
    },
    tabScrollContainer: {
        paddingHorizontal: 16,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginRight: 8,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
        gap: 8,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
    },
    searchContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        alignItems: 'center',
    },
    searchInputContainer: {
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
    itemCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        gap: 12,
    },
    itemHeader: {
        flexDirection: 'row',
        gap: 12,
    },
    itemIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContent: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    itemDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    itemMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
    },
    videoCard: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    videoThumbnail: {
        height: 180,
        position: 'relative',
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    playButton: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -30 }, { translateY: -30 }],
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    durationBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    durationText: {
        fontSize: 12,
        fontWeight: '500',
    },
    videoContent: {
        padding: 16,
        gap: 8,
    },
    videoTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    videoDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    videoMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    difficultyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    difficultyText: {
        fontSize: 12,
        fontWeight: '500',
    },
    videoViews: {
        fontSize: 12,
    },
    faqCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        gap: 12,
    },
    faqHeader: {
        flexDirection: 'row',
        gap: 12,
    },
    faqIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    faqContent: {
        flex: 1,
        gap: 8,
    },
    faqQuestion: {
        fontSize: 16,
        fontWeight: '600',
    },
    faqAnswer: {
        fontSize: 14,
        lineHeight: 20,
    },
    faqFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '500',
    },
    helpfulSection: {
        alignItems: 'center',
        gap: 8,
    },
    helpfulLabel: {
        fontSize: 12,
    },
    helpfulButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    helpfulButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    helpfulCount: {
        fontSize: 12,
        fontWeight: '500',
    },
    helpfulButtonText: {
        fontSize: 12,
        fontWeight: '500',
    },
    contactContainer: {
        padding: 16,
        gap: 16,
    },
    contactCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        gap: 16,
    },
    contactTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    formGroup: {
        gap: 8,
    },
    formLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    formInput: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
    },
    pickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    pickerText: {
        fontSize: 16,
    },
    formTextArea: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        minHeight: 120,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        gap: 8,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    quickLinksCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        gap: 16,
    },
    quickLinksTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    quickLinkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 12,
    },
    quickLinkContent: {
        flex: 1,
    },
    quickLinkTitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    quickLinkSubtitle: {
        fontSize: 12,
        marginTop: 2,
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
    articleDetailCard: {
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        gap: 16,
    },
    articleDetailTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    articleDetailMeta: {
        gap: 4,
    },
    articleDetailMetaText: {
        fontSize: 14,
    },
    articleDetailContent: {
        fontSize: 16,
        lineHeight: 24,
    },
    articleDetailTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '500',
    },
    articleDetailFooter: {
        alignItems: 'center',
        gap: 12,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    helpfulQuestion: {
        fontSize: 14,
    },
});
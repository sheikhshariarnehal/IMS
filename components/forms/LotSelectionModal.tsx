import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { X, Package, Calendar, MapPin, Hash } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';

const { width: screenWidth } = Dimensions.get('window');

interface ProductLot {
  id: number;
  product_id: number;
  lot_number: number;
  quantity: number;
  purchase_price: number;
  selling_price: number;
  supplier_id?: number;
  location_id?: number;
  received_date?: string;
  expiry_date?: string;
  status?: string;
  notes?: string;
  per_unit_price?: number;
  locations?: {
    id: number;
    name: string;
    type: string;
  };
}

interface LotSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLot: (lot: ProductLot) => void;
  productId: number;
  productName: string;
  accessibleLocations?: string[]; // User's accessible location IDs
}

export default function LotSelectionModal({
  visible,
  onClose,
  onSelectLot,
  productId,
  productName,
  accessibleLocations,
}: LotSelectionModalProps) {
  const { theme } = useTheme();
  const [lots, setLots] = useState<ProductLot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLot, setSelectedLot] = useState<ProductLot | null>(null);

  useEffect(() => {
    if (visible && productId) {
      fetchProductLots();
    }
  }, [visible, productId]);

  const fetchProductLots = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products_lot')
        .select(`
          *,
          locations(id, name, type)
        `)
        .eq('product_id', productId)
        .eq('status', 'active')
        .gt('quantity', 0);

      // Apply location filtering if accessible locations are provided
      if (accessibleLocations && accessibleLocations.length > 0) {
        const locationIds = accessibleLocations.map(id => parseInt(id));
        query = query.in('location_id', locationIds);
        console.log('🔒 Filtering lots by accessible locations:', locationIds);
      }

      const { data, error } = await query.order('lot_number', { ascending: true });

      if (error) {
        console.error('Error fetching lots:', error);
        Alert.alert('Error', 'Failed to fetch product lots');
        return;
      }

      console.log('📦 Fetched lots with location filtering:', {
        totalLots: data?.length || 0,
        accessibleLocations,
        lots: data?.map(lot => ({
          lotNumber: lot.lot_number,
          locationId: lot.location_id,
          locationName: lot.locations?.name
        }))
      });

      setLots(data || []);
    } catch (error) {
      console.error('Error fetching lots:', error);
      Alert.alert('Error', 'Failed to fetch product lots');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLot = () => {
    if (selectedLot) {
      onSelectLot(selectedLot);
      onClose();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const renderLotItem = ({ item }: { item: ProductLot }) => (
    <TouchableOpacity
      style={[
        styles.lotItem,
        selectedLot?.id === item.id && styles.lotItemSelected,
      ]}
      onPress={() => setSelectedLot(item)}
    >
      <View style={styles.lotHeader}>
        <View style={styles.lotNumberContainer}>
          <Hash size={16} color={theme.colors.primary} />
          <Text style={styles.lotNumber}>Lot {item.lot_number}</Text>
        </View>
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityLabel}>Available:</Text>
          <Text style={styles.quantityValue}>{item.quantity}</Text>
        </View>
      </View>

      <View style={styles.lotDetails}>
        <View style={styles.lotDetailRow}>
          <Calendar size={14} color={theme.colors.text.secondary} />
          <Text style={styles.lotDetailText}>
            Received: {formatDate(item.received_date)}
          </Text>
        </View>
        
        <View style={styles.lotDetailRow}>
          <Package size={14} color={theme.colors.text.secondary} />
          <Text style={styles.lotDetailText}>
            Price: ${item.selling_price?.toFixed(2) || 'N/A'}
          </Text>
        </View>

        <View style={styles.lotDetailRow}>
          <MapPin size={14} color={theme.colors.text.secondary} />
          <Text style={styles.lotDetailText}>
            Location: {item.locations?.name || 'Unknown Location'}
          </Text>
        </View>

        {item.expiry_date && (
          <View style={styles.lotDetailRow}>
            <Calendar size={14} color={theme.colors.status.warning} />
            <Text style={[styles.lotDetailText, { color: theme.colors.status.warning }]}>
              Expires: {formatDate(item.expiry_date)}
            </Text>
          </View>
        )}
      </View>

      {selectedLot?.id === item.id && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.selectedText}>✓ Selected</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    container: {
      backgroundColor: theme.colors.background,
      borderRadius: 20,
      width: '100%',
      maxWidth: 400,
      maxHeight: '85%',
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme.colors.primary,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
      flex: 1,
    },
    closeButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    content: {
      padding: 20,
    },
    productInfo: {
      marginBottom: 20,
      padding: 16,
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    productName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    productLabel: {
      fontSize: 14,
      color: theme.colors.text.secondary,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 16,
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.colors.text.secondary,
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    lotItem: {
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: theme.colors.border,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    lotItemSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '15',
      elevation: 4,
      shadowOpacity: 0.15,
    },
    lotHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    lotNumberContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    lotNumber: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text.primary,
      marginLeft: 6,
    },
    quantityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    quantityLabel: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginRight: 6,
    },
    quantityValue: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    lotDetails: {
      gap: 8,
    },
    lotDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    lotDetailText: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginLeft: 8,
    },
    selectedIndicator: {
      marginTop: 12,
      padding: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      alignItems: 'center',
    },
    selectedText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    footer: {
      flexDirection: 'row',
      gap: 12,
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    button: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    cancelButton: {
      backgroundColor: theme.colors.backgroundTertiary,
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
    selectButton: {
      backgroundColor: theme.colors.primary,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    selectButtonDisabled: {
      backgroundColor: theme.colors.text.muted,
      opacity: 0.6,
      elevation: 0,
      shadowOpacity: 0,
    },
    selectButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Lot for Transfer</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{productName}</Text>
              <Text style={styles.productLabel}>Select a lot to transfer from</Text>
            </View>

            <Text style={styles.sectionTitle}>Available Lots</Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading lots...</Text>
              </View>
            ) : lots.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No active lots found for this product
                </Text>
              </View>
            ) : (
              <FlatList
                data={lots}
                renderItem={renderLotItem}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 300 }}
              />
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.selectButton,
                !selectedLot && styles.selectButtonDisabled,
              ]}
              onPress={handleSelectLot}
              disabled={!selectedLot}
              activeOpacity={selectedLot ? 0.8 : 1}
            >
              <Text style={styles.selectButtonText}>Select Lot</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

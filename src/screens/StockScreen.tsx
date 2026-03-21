import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { useStock } from '../hooks/useStock';
import { StockItem } from '../components/stock/StockItem';
import { ProductSearchDropdown } from '../components/stock/ProductSearchDropdown';
import { ProductsService, ListsService } from '../services/supabase';
import { StockService } from '../services/supabase/stock';
import type { MainTabScreenProps } from '../navigation/types';
import type { StockEntry, Product } from '../types/models';

export const StockScreen: React.FC<MainTabScreenProps<'Stock'>> = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [currentListId, setCurrentListId] = useState<string | null>(null);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<StockEntry | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [saving, setSaving] = useState(false);

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  const [addQuantity, setAddQuantity] = useState('1');
  const [addUnit, setAddUnit] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const { stockEntries, loading, decrementStock, setStockQuantity, removeStockEntry, refetch } = useStock(
    currentListId ?? ''
  );

  // Load current list from AsyncStorage, refresh on focus
  useFocusEffect(
    useCallback(() => {
      const loadList = async () => {
        if (!user) return;

        const savedListId = await AsyncStorage.getItem('default_list_id');
        if (savedListId) {
          setCurrentListId(savedListId);
          return;
        }

        const { data: lists } = await ListsService.getUserLists(user.id);
        if (lists && lists.length > 0) {
          setCurrentListId(lists[0].id);
        }
      };

      loadList();
      if (currentListId) {
        refetch();
      }
    }, [user, currentListId, refetch])
  );

  const handleDecrement = async (stockId: string, currentQuantity: number) => {
    if (currentQuantity === 0) return;

    const success = await decrementStock(stockId, currentQuantity, 1);
    if (!success) {
      Alert.alert('Stock is already at 0');
    }
  };

  const handleEdit = (entry: StockEntry) => {
    setEditingEntry(entry);
    setEditQuantity(
      entry.quantity % 1 === 0 ? entry.quantity.toFixed(0) : entry.quantity.toString()
    );
    setEditUnit(entry.unit ?? '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingEntry || !currentListId) return;

    const qty = parseFloat(editQuantity);
    if (isNaN(qty) || qty < 0) {
      Alert.alert('Invalid quantity', 'Please enter a valid number.');
      return;
    }

    setSaving(true);
    await setStockQuantity(editingEntry.productId, qty, editUnit.trim() || null);
    setSaving(false);
    setShowEditModal(false);
    setEditingEntry(null);
  };

  const handleDelete = (stockId: string) => {
    Alert.alert(
      'Remove from Stock',
      'Stop tracking this product in your stock?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeStockEntry(stockId),
        },
      ]
    );
  };

  const handleProductSelect = (product: Product | { id: ''; name: string }) => {
    if (product.id === '') {
      // "Add as new product" — store name, resolve on save
      setSelectedProduct({ id: '', name: product.name, createdBy: null, createdAt: '', updatedAt: '' });
    } else {
      setSelectedProduct(product as Product);
    }
    setAddQuery(product.name);
    setShowDropdown(false);
  };

  const handleAddStock = async () => {
    if (!currentListId) return;

    if (!addQuery.trim()) {
      Alert.alert('Please enter or select a product');
      return;
    }

    const qty = parseFloat(addQuantity);
    if (isNaN(qty) || qty < 0) {
      Alert.alert('Invalid quantity', 'Please enter a valid number.');
      return;
    }

    setSaving(true);

    let productId: string;

    if (selectedProduct && selectedProduct.id !== '') {
      productId = selectedProduct.id;
    } else {
      // Find or create product by name
      const { data, error } = await ProductsService.findOrCreate(addQuery.trim());
      if (error || !data) {
        Alert.alert('Error', 'Failed to create product');
        setSaving(false);
        return;
      }
      productId = data.id;
    }

    const { error } = await StockService.setStock(productId, currentListId, qty, addUnit.trim() || null);

    setSaving(false);

    if (error) {
      Alert.alert('Error', 'Failed to add stock entry');
      return;
    }

    setAddQuery('');
    setAddQuantity('1');
    setAddUnit('');
    setSelectedProduct(null);
    setShowAddModal(false);
    refetch();
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddQuery('');
    setAddQuantity('1');
    setAddUnit('');
    setSelectedProduct(null);
    setShowDropdown(false);
  };

  if (!currentListId || loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {stockEntries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: theme.colors.text, fontSize: theme.fontSizes.h2 }]}>
            No Stock Yet
          </Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.body }]}>
            Items marked as bought will appear here automatically when linked to a product.
          </Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.body }]}>
            Tap + to add stock manually.
          </Text>
        </View>
      ) : (
        <FlatList
          data={stockEntries}
          renderItem={({ item }) => (
            <StockItem
              item={item}
              onDecrement={handleDecrement}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={loading}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={() => setShowEditModal(false)} disabled={saving}>
              <Text style={[styles.modalButton, { color: theme.colors.primary, fontSize: theme.fontSizes.body }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: theme.fontSizes.h2 }]}>
              Edit Stock
            </Text>
            <TouchableOpacity onPress={handleSaveEdit} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text style={[styles.modalButton, { color: theme.colors.primary, fontSize: theme.fontSizes.body, fontWeight: '700' }]}>
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.productLabel, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.small }]}>
              PRODUCT
            </Text>
            <Text style={[styles.productName, { color: theme.colors.text, fontSize: theme.fontSizes.body }]}>
              {editingEntry?.productName}
            </Text>

            <Text style={[styles.label, { color: theme.colors.text, fontSize: theme.fontSizes.body, marginTop: 20 }]}>
              Quantity
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  fontSize: theme.fontSizes.body,
                },
              ]}
              value={editQuantity}
              onChangeText={setEditQuantity}
              keyboardType="decimal-pad"
              autoFocus
              editable={!saving}
            />

            <Text style={[styles.label, { color: theme.colors.text, fontSize: theme.fontSizes.body, marginTop: 16 }]}>
              Unit (optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  fontSize: theme.fontSizes.body,
                },
              ]}
              placeholder="e.g. kg, L, pieces"
              placeholderTextColor={theme.colors.textSecondary}
              value={editUnit}
              onChangeText={setEditUnit}
              editable={!saving}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Add Stock Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={closeAddModal} disabled={saving}>
              <Text style={[styles.modalButton, { color: theme.colors.primary, fontSize: theme.fontSizes.body }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: theme.fontSizes.h2 }]}>
              Add Stock
            </Text>
            <TouchableOpacity onPress={handleAddStock} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text style={[styles.modalButton, { color: theme.colors.primary, fontSize: theme.fontSizes.body, fontWeight: '700' }]}>
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.label, { color: theme.colors.text, fontSize: theme.fontSizes.body }]}>
              Product *
            </Text>
            <View style={styles.searchWrapper}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.card,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                    fontSize: theme.fontSizes.body,
                  },
                ]}
                placeholder="Search or type a product name"
                placeholderTextColor={theme.colors.textSecondary}
                value={addQuery}
                onChangeText={(text) => {
                  setAddQuery(text);
                  setSelectedProduct(null);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                editable={!saving}
                autoFocus
              />
              <ProductSearchDropdown
                query={addQuery}
                visible={showDropdown}
                onSelect={handleProductSelect}
                onDismiss={() => setShowDropdown(false)}
              />
            </View>

            <Text style={[styles.label, { color: theme.colors.text, fontSize: theme.fontSizes.body, marginTop: 16 }]}>
              Quantity
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  fontSize: theme.fontSizes.body,
                },
              ]}
              value={addQuantity}
              onChangeText={setAddQuantity}
              keyboardType="decimal-pad"
              editable={!saving}
            />

            <Text style={[styles.label, { color: theme.colors.text, fontSize: theme.fontSizes.body, marginTop: 16 }]}>
              Unit (optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  fontSize: theme.fontSizes.body,
                },
              ]}
              placeholder="e.g. kg, L, pieces"
              placeholderTextColor={theme.colors.textSecondary}
              value={addUnit}
              onChangeText={setAddUnit}
              editable={!saving}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 6,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '300',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalButton: {
    fontWeight: '600',
    minWidth: 60,
  },
  modalTitle: {
    fontWeight: '700',
  },
  modalContent: {
    padding: 16,
  },
  productLabel: {
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  productName: {
    fontWeight: '600',
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchWrapper: {
    position: 'relative',
    zIndex: 10,
  },
});

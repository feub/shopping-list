import React, { useState, useEffect, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { FavoritesService, ListsService } from '../services/supabase';
import type { MainTabScreenProps } from '../navigation/types';
import type { Database } from '../types/database';

type FavoriteItem = Database['public']['Tables']['favorite_items']['Row'];

export const FavoritesScreen: React.FC<MainTabScreenProps<'Favorites'>> = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemNotes, setNewItemNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Get user's current list
  useEffect(() => {
    const getCurrentList = async () => {
      if (!user) return;

      const { data: lists } = await ListsService.getUserLists(user.id);
      if (lists && lists.length > 0) {
        setCurrentListId(lists[0].id);
      }
    };

    getCurrentList();
  }, [user]);

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await FavoritesService.getUserFavorites(user.id);
    if (data) {
      setFavorites(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Refresh when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites])
  );

  const handleAddToList = async (item: FavoriteItem) => {
    if (!currentListId) {
      Alert.alert('Error', 'No active list found');
      return;
    }

    Alert.alert(
      'Add to List',
      `Add "${item.text}" to your shopping list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: async () => {
            const { error } = await FavoritesService.addFavoriteToList(item.id, currentListId);
            if (error) {
              Alert.alert('Error', 'Failed to add item to list');
            } else {
              Alert.alert('Success', 'Item added to your list!');
              // Refresh to update usage count
              fetchFavorites();
            }
          },
        },
      ]
    );
  };

  const handleDeleteFavorite = (item: FavoriteItem) => {
    Alert.alert(
      'Remove Favorite',
      `Remove "${item.text}" from favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const { error } = await FavoritesService.deleteFavorite(item.id);
            if (error) {
              Alert.alert('Error', 'Failed to remove favorite');
            } else {
              // Update local state
              setFavorites(favorites.filter(f => f.id !== item.id));
            }
          },
        },
      ]
    );
  };

  const handleCreateFavorite = async () => {
    if (!user) return;

    if (!newItemText.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    setSaving(true);
    const { data, error } = await FavoritesService.createFavorite(
      user.id,
      newItemText,
      parseInt(newItemQuantity) || 1,
      newItemNotes || null
    );

    setSaving(false);

    if (error) {
      Alert.alert('Error', 'Failed to create favorite item');
    } else {
      // Add to local state
      if (data) {
        setFavorites([data, ...favorites]);
      }
      // Reset and close modal
      setNewItemText('');
      setNewItemQuantity('1');
      setNewItemNotes('');
      setShowAddModal(false);
    }
  };

  const renderFavorite = ({ item }: { item: FavoriteItem }) => (
    <View style={[styles.favoriteCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.favoriteContent}>
        <Text style={[styles.favoriteText, { color: theme.colors.text, fontSize: theme.fontSizes.body }]}>
          {item.text}
        </Text>
        {item.quantity > 1 && (
          <Text style={[styles.favoriteQuantity, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.small }]}>
            Qty: {item.quantity}
          </Text>
        )}
        {item.notes && (
          <Text style={[styles.favoriteNotes, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.small }]}>
            💬 {item.notes}
          </Text>
        )}
        {item.usage_count > 0 && (
          <Text style={[styles.usageCount, { color: theme.colors.textTertiary, fontSize: theme.fontSizes.small }]}>
            Used {item.usage_count} time{item.usage_count !== 1 ? 's' : ''}
          </Text>
        )}
      </View>
      <View style={styles.favoriteActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => handleAddToList(item)}
        >
          <Text style={[styles.actionButtonText, { fontSize: theme.fontSizes.small }]}>+ Add</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
          onPress={() => handleDeleteFavorite(item)}
        >
          <Text style={[styles.actionButtonText, { fontSize: theme.fontSizes.small }]}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: theme.colors.text, fontSize: theme.fontSizes.h2 }]}>
            No Favorites Yet
          </Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.body }]}>
            Your favorite items will appear here for quick access.
          </Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.body }]}>
            Tap the + button below to add your first favorite item!
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderFavorite}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Add Favorite Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={() => setShowAddModal(false)} disabled={saving}>
              <Text style={[styles.modalButton, { color: theme.colors.primary, fontSize: theme.fontSizes.body }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: theme.fontSizes.h2 }]}>
              New Favorite
            </Text>
            <TouchableOpacity onPress={handleCreateFavorite} disabled={saving}>
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
              Item Name *
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
              placeholder="e.g., Organic Milk"
              placeholderTextColor={theme.colors.textSecondary}
              value={newItemText}
              onChangeText={setNewItemText}
              editable={!saving}
              autoFocus
            />

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
              placeholder="1"
              placeholderTextColor={theme.colors.textSecondary}
              value={newItemQuantity}
              onChangeText={setNewItemQuantity}
              keyboardType="numeric"
              editable={!saving}
            />

            <Text style={[styles.label, { color: theme.colors.text, fontSize: theme.fontSizes.body, marginTop: 16 }]}>
              Notes (optional)
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
              placeholder="e.g., from Trader Joe's"
              placeholderTextColor={theme.colors.textSecondary}
              value={newItemNotes}
              onChangeText={setNewItemNotes}
              editable={!saving}
            />
          </View>
        </View>
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
  favoriteCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteContent: {
    marginBottom: 12,
  },
  favoriteText: {
    fontWeight: '600',
    marginBottom: 4,
  },
  favoriteQuantity: {
    marginTop: 4,
  },
  favoriteNotes: {
    fontStyle: 'italic',
    marginTop: 4,
  },
  usageCount: {
    marginTop: 4,
  },
  favoriteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
});

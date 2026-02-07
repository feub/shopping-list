import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { SavedListsService, ListsService } from '../services/supabase';
import { CreateSavedListModal } from '../components/savedLists/CreateSavedListModal';
import { EditSavedListModal } from '../components/savedLists/EditSavedListModal';
import type { MainTabScreenProps } from '../navigation/types';
import Logger from '../utils/logger';

interface SavedListWithItems {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
  last_used_at: string | null;
  saved_list_items: Array<{
    id: string;
    text: string;
    quantity: number;
    notes: string | null;
    order_index: number;
  }>;
}

export const SavedListsScreen: React.FC<MainTabScreenProps<'SavedLists'>> = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [savedLists, setSavedLists] = useState<SavedListWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSavedList, setEditingSavedList] = useState<SavedListWithItems | null>(null);

  useEffect(() => {
    if (user) {
      fetchSavedLists();
      fetchCurrentList();
    }
  }, [user]);

  const fetchSavedLists = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await SavedListsService.getUserSavedLists(user.id);

    if (error) {
      Logger.error('Error loading saved lists:', error);
    } else if (data) {
      setSavedLists(data as SavedListWithItems[]);
    }

    setLoading(false);
  };

  const fetchCurrentList = async () => {
    if (!user) return;

    const { data: lists } = await ListsService.getUserLists(user.id);
    if (lists && lists.length > 0) {
      setCurrentListId(lists[0].id);
    }
  };

  const handleCloneToList = async (savedList: SavedListWithItems) => {
    if (!currentListId) {
      Alert.alert('Error', 'No active shopping list found');
      return;
    }

    Alert.alert(
      'Clone to Shopping List',
      `Add ${savedList.saved_list_items.length} items from "${savedList.name}" to your current list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clone',
          onPress: async () => {
            const { error } = await SavedListsService.cloneToList(savedList.id, currentListId);

            if (error) {
              Alert.alert('Error', 'Failed to clone list');
            } else {
              Alert.alert('Success', `Added ${savedList.saved_list_items.length} items to your list!`);
            }
          },
        },
      ]
    );
  };

  const handleDeleteSavedList = async (savedList: SavedListWithItems) => {
    Alert.alert('Delete Saved List', `Delete "${savedList.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await SavedListsService.deleteSavedList(savedList.id);

          if (error) {
            Alert.alert('Error', 'Failed to delete saved list');
          } else {
            fetchSavedLists();
          }
        },
      },
    ]);
  };

  const handleCreateSavedList = async (
    name: string,
    description: string | null,
    items: Array<{ text: string; quantity?: number; notes?: string | null; order_index: number }>
  ) => {
    if (!user) return;

    const { data, error } = await SavedListsService.createSavedList(user.id, name, description, items);

    if (error) {
      Alert.alert('Error', 'Failed to create saved list');
      throw error;
    } else {
      Alert.alert('Success', 'Saved list created!');
      fetchSavedLists();
    }
  };

  const handleUpdateSavedList = async (
    savedListId: string,
    name: string,
    description: string | null,
    items: Array<{ text: string; quantity?: number; notes?: string | null; order_index: number }>
  ) => {
    Logger.log('Updating saved list:', { savedListId, name, itemCount: items.length });
    const { error } = await SavedListsService.updateSavedListWithItems(savedListId, name, description, items);

    if (error) {
      Logger.error('Failed to update saved list:', error);
      Alert.alert('Error', `Failed to update saved list: ${error.message || 'Unknown error'}`);
      throw error;
    } else {
      Alert.alert('Success', 'Saved list updated!');
      setEditingSavedList(null);
      fetchSavedLists();
    }
  };

  const renderSavedList = ({ item }: { item: SavedListWithItems }) => (
    <View style={[styles.savedListCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.savedListHeader}>
        <View style={styles.savedListInfo}>
          <Text style={[styles.savedListName, { color: theme.colors.text, fontSize: theme.fontSizes.h3 }]}>
            {item.name}
          </Text>
          {item.description && (
            <Text
              style={[
                styles.savedListDescription,
                { color: theme.colors.textSecondary, fontSize: theme.fontSizes.small },
              ]}
            >
              {item.description}
            </Text>
          )}
          <View style={styles.savedListMeta}>
            <Text style={[styles.metaText, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.small }]}>
              {item.saved_list_items.length} items
            </Text>
            {item.usage_count > 0 && (
              <Text style={[styles.metaText, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.small }]}>
                • Used {item.usage_count} times
              </Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.savedListActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => handleCloneToList(item)}
        >
          <Text style={[styles.actionButtonText, { fontSize: theme.fontSizes.small }]}>📋 Clone</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.primary }]}
          onPress={() => setEditingSavedList(item)}
        >
          <Text style={[styles.actionButtonText, { fontSize: theme.fontSizes.small, color: theme.colors.primary }]}>✏️ Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
          onPress={() => handleDeleteSavedList(item)}
        >
          <Text style={[styles.actionButtonText, { fontSize: theme.fontSizes.small }]}>🗑</Text>
        </TouchableOpacity>
      </View>

      {/* Items preview */}
      {item.saved_list_items.slice(0, 3).map((listItem, index) => (
        <Text
          key={listItem.id}
          style={[styles.itemPreview, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.small }]}
        >
          • {listItem.text}
          {listItem.quantity > 1 && ` (${listItem.quantity})`}
        </Text>
      ))}
      {item.saved_list_items.length > 3 && (
        <Text style={[styles.itemPreview, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.small }]}>
          + {item.saved_list_items.length - 3} more
        </Text>
      )}
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
      {savedLists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: theme.colors.text, fontSize: theme.fontSizes.h2 }]}>
            No Saved Lists Yet
          </Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.body }]}>
            Saved lists let you create reusable templates for common shopping trips.
          </Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.body }]}>
            Create your first saved list to get started!
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedLists}
          renderItem={renderSavedList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowCreateModal(true)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Create Modal */}
      <CreateSavedListModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateSavedList}
      />

      {/* Edit Modal */}
      <EditSavedListModal
        visible={!!editingSavedList}
        savedList={editingSavedList}
        onClose={() => setEditingSavedList(null)}
        onSave={handleUpdateSavedList}
      />
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
  savedListCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  savedListHeader: {
    marginBottom: 12,
  },
  savedListInfo: {
    flex: 1,
  },
  savedListName: {
    fontWeight: '700',
    marginBottom: 4,
  },
  savedListDescription: {
    marginBottom: 8,
    fontStyle: 'italic',
  },
  savedListMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  metaText: {
    fontWeight: '500',
  },
  savedListActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cloneButton: {},
  deleteButton: {},
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  itemPreview: {
    marginVertical: 2,
    paddingLeft: 8,
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
});

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Alert, ScrollView, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { useList } from '../hooks/useList';
import { ListsService, FavoritesService } from '../services/supabase';
import Logger from '../utils/logger';
import { DraggableList } from '../components/list/DraggableList';
import { SwipeableItem } from '../components/list/SwipeableItem';
import { AddItemInput } from '../components/list/AddItemInput';
import { ShareListModal } from '../components/list/ShareListModal';
import { ListSelectorModal } from '../components/list/ListSelectorModal';
import { SendBoughtListModal } from '../components/list/SendBoughtListModal';
import type { MainTabScreenProps } from '../navigation/types';
import { NotificationService } from '../services/notifications';
import type { Item } from '../types/models';

const DEFAULT_LIST_KEY = 'default_list_id';

export const ListScreen: React.FC<MainTabScreenProps<'List'>> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const [initLoading, setInitLoading] = useState(true);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [listSelectorVisible, setListSelectorVisible] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<'viewer' | 'editor' | 'owner'>('owner');
  const [memberCount, setMemberCount] = useState(1);
  const [listName, setListName] = useState('Shopping List');
  const [sendEmailModalVisible, setSendEmailModalVisible] = useState(false);

  const {
    unboughtItems,
    boughtItems,
    loading,
    error,
    addItem,
    updateItem,
    toggleItem,
    deleteItem,
    reorderItems,
    clearBoughtItems,
    refetch,
  } = useList(currentListId || '');

  const [refreshing, setRefreshing] = useState(false);
  const [favoriteTexts, setFavoriteTexts] = useState<Set<string>>(new Set());

  // Initialize or get the user's primary list
  useEffect(() => {
    const initializeList = async () => {
      console.log('[ListScreen] initializeList called, user:', user?.id);
      if (!user) {
        console.log('[ListScreen] No user, returning early');
        return;
      }

      setInitLoading(true);
      console.log('[ListScreen] Fetching lists for user:', user.id);

      // Get user's lists
      const { data: lists } = await ListsService.getUserLists(user.id);

      console.log('[ListScreen] getUserLists returned:', {
        listsCount: lists?.length || 0,
        lists: lists?.map(l => ({ id: l.id, name: l.name }))
      });

      if (lists && lists.length > 0) {
        // Check for a saved default list
        const savedListId = await AsyncStorage.getItem(DEFAULT_LIST_KEY);
        const savedList = savedListId ? lists.find(l => l.id === savedListId) : null;

        if (savedList) {
          console.log('[ListScreen] Using saved default list:', savedList.id);
          setCurrentListId(savedList.id);
          setListName(savedList.name);
        } else {
          // Fall back to the first list (most recently updated)
          console.log('[ListScreen] Using first list:', lists[0].id);
          setCurrentListId(lists[0].id);
          setListName(lists[0].name);
        }
      } else {
        // Create a default list
        console.log('[ListScreen] No lists found, creating default list');
        const { data: newList } = await ListsService.createList(
          user.id,
          'My Shopping List'
        );
        if (newList) {
          console.log('[ListScreen] Created new list:', newList.id);
          setCurrentListId(newList.id);
        }
      }

      setInitLoading(false);
    };

    initializeList();
  }, [user]);

  // Fetch list name, user's role, and member count when list changes
  useEffect(() => {
    const fetchListDetails = async () => {
      if (!currentListId || !user) return;

      const { data: listData } = await ListsService.getListById(currentListId);
      if (listData) setListName(listData.name);

      const { data: members } = await ListsService.getListMembers(currentListId);

      if (members) {
        setMemberCount(members.length);

        const currentMember = members.find((m: any) => m.user_id === user.id);
        if (currentMember) {
          setCurrentUserRole(currentMember.role);
        }
      }
    };

    fetchListDetails();
  }, [currentListId, user, listSelectorVisible]);

  // Set up header with list selector and share buttons
  const totalItems = unboughtItems.length + boughtItems.length;
  const headerTitle = totalItems > 0
    ? `${listName} (${boughtItems.length}/${totalItems})`
    : listName;

  useEffect(() => {
    navigation.setOptions({
      headerTitle,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => setListSelectorVisible(true)}
          style={{ marginLeft: 16 }}
        >
          <Ionicons name="list" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShareModalVisible(true)}
          style={{ marginRight: 16, position: 'relative' }}
        >
          <Ionicons name="people-outline" size={24} color={theme.colors.text} />
          {memberCount > 1 && (
            <View
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                backgroundColor: theme.colors.primary,
                borderRadius: 10,
                minWidth: 20,
                height: 20,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 4,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>
                {memberCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme, memberCount, headerTitle]);

  // Fetch favorite texts for star indicator
  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    const { data } = await FavoritesService.getUserFavorites(user.id);
    if (data) {
      setFavoriteTexts(new Set(data.map((f: any) => f.text.toLowerCase())));
    }
  }, [user]);

  // Refresh when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      if (currentListId) {
        refetch();
      }
      fetchFavorites();
    }, [currentListId, refetch, fetchFavorites])
  );

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleAddItem = async (text: string, quantity?: string, isImportant?: boolean) => {
    await addItem(text, quantity, undefined, user?.email || undefined, isImportant);

    // Fire-and-forget: notify other list members
    if (currentListId && user) {
      const displayName = user.email?.split('@')[0] || 'Someone';
      NotificationService.notifyListMembers(
        currentListId,
        user.id,
        displayName,
        text,
        listName,
      );
    }
  };

  const handleToggleImportant = (itemId: string, isImportant: boolean) => {
    updateItem(itemId, { isImportant });
  };

  const handleAddToFavorites = async (item: Item) => {
    if (!user) return;
    if (favoriteTexts.has(item.text.toLowerCase())) return;
    const quantity = item.quantity ? parseInt(item.quantity, 10) : undefined;
    const { error: favError } = await FavoritesService.createFavorite(
      user.id,
      item.text,
      isNaN(quantity as number) ? undefined : quantity,
      item.notes || null,
    );
    if (favError) {
      Logger.error('Failed to add item to favorites:', favError);
    } else {
      setFavoriteTexts(prev => new Set(prev).add(item.text.toLowerCase()));
    }
  };

  const handleClearBought = () => {
    if (boughtItems.length === 0) return;

    Alert.alert(
      'Clear Bought Items',
      `Remove ${boughtItems.length} bought item${boughtItems.length === 1 ? '' : 's'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearBoughtItems },
      ]
    );
  };

  if (initLoading || !currentListId) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error, fontSize: theme.fontSizes.body }]}>
          Error loading list
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Add item input - at top for better UX */}
      <AddItemInput onAdd={handleAddItem} disabled={loading} />

      {loading && unboughtItems.length === 0 && boughtItems.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <>
          {/* Unbought items - draggable */}
          <View style={styles.listContainer}>
            <DraggableList
              items={unboughtItems}
              onReorder={reorderItems}
              onToggle={toggleItem}
              onToggleImportant={handleToggleImportant}
              onAddToFavorites={handleAddToFavorites}
              favoriteTexts={favoriteTexts}
              onDelete={deleteItem}
            />
          </View>

          {/* Bought items section */}
          {boughtItems.length > 0 && (
            <View style={[styles.boughtSection, { borderTopColor: theme.colors.border }]}>
              <View style={styles.boughtHeader}>
                <Text style={[styles.boughtTitle, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.body }]}>
                  Bought ({boughtItems.length})
                </Text>
                <View style={styles.boughtActions}>
                  <TouchableOpacity
                    onPress={() => setSendEmailModalVisible(true)}
                    style={styles.boughtActionButton}
                  >
                    <Ionicons name="mail-outline" size={18} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleClearBought}>
                    <Text style={[styles.clearButton, { color: theme.colors.primary, fontSize: theme.fontSizes.small }]}>
                      Clear
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <FlatList
                data={boughtItems}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <SwipeableItem
                    item={item}
                    onToggle={toggleItem}
                    onDelete={deleteItem}
                  />
                )}
                style={{ maxHeight: 200 }}
              />
            </View>
          )}

          {/* Empty state */}
          {unboughtItems.length === 0 && boughtItems.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.body }]}>
                No items yet. Add your first item above!
              </Text>
            </View>
          )}
        </>
      )}

      {/* List Selector Modal */}
      {user && (
        <ListSelectorModal
          visible={listSelectorVisible}
          onClose={() => setListSelectorVisible(false)}
          currentListId={currentListId || ''}
          onSelectList={async (listId) => {
            setCurrentListId(listId);
            await AsyncStorage.setItem(DEFAULT_LIST_KEY, listId);
          }}
          userId={user.id}
        />
      )}

      {/* Share List Modal */}
      {currentListId && (
        <ShareListModal
          visible={shareModalVisible}
          onClose={() => setShareModalVisible(false)}
          listId={currentListId}
          currentUserRole={currentUserRole}
        />
      )}

      {/* Send Bought List Modal */}
      <SendBoughtListModal
        visible={sendEmailModalVisible}
        onClose={() => setSendEmailModalVisible(false)}
        boughtItems={boughtItems}
        listName={listName}
        currentUserEmail={user?.email ?? null}
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
  listContainer: {
    flex: 1,
  },
  boughtSection: {
    borderTopWidth: 2,
    maxHeight: 250,
  },
  boughtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  boughtTitle: {
    fontWeight: '600',
  },
  boughtActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  boughtActionButton: {
    padding: 2,
  },
  clearButton: {
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
  },
});

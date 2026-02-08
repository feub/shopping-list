import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { ListsService } from '../../services/supabase';
import type { List } from '../../types/models';

interface ListSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  currentListId: string;
  onSelectList: (listId: string) => void;
  userId: string;
}

export const ListSelectorModal: React.FC<ListSelectorModalProps> = ({
  visible,
  onClose,
  currentListId,
  onSelectList,
  userId,
}) => {
  const { theme } = useTheme();
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [creatingList, setCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    if (visible) {
      loadLists();
      setCreatingList(false);
      setNewListName('');
      setEditingListId(null);
      setEditingName('');
    }
  }, [visible, userId]);

  const loadLists = async () => {
    setLoading(true);
    const { data } = await ListsService.getUserLists(userId);

    if (data) {
      setLists(data as List[]);

      // Load member counts for each list
      const counts: Record<string, number> = {};
      await Promise.all(
        data.map(async (list: List) => {
          const { data: members } = await ListsService.getListMembers(list.id);
          counts[list.id] = members?.length || 1;
        })
      );
      setMemberCounts(counts);
    }

    setLoading(false);
  };

  const handleSelectList = (listId: string) => {
    onSelectList(listId);
    onClose();
  };

  const handleCreateList = async () => {
    const trimmed = newListName.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    const { data: newList, error } = await ListsService.createList(userId, trimmed);
    if (error) {
      Alert.alert('Error', 'Failed to create list');
      return;
    }

    setCreatingList(false);
    setNewListName('');
    if (newList) {
      onSelectList(newList.id);
      onClose();
    }
  };

  const handleStartRename = (list: List) => {
    setEditingListId(list.id);
    setEditingName(list.name);
  };

  const handleSaveRename = async () => {
    if (!editingListId) return;
    const trimmed = editingName.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    const { error } = await ListsService.updateList(editingListId, { name: trimmed });
    if (error) {
      Alert.alert('Error', 'Failed to rename list');
      return;
    }

    setEditingListId(null);
    setEditingName('');
    await loadLists();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <View style={styles.headerButton} />
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Lists</Text>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: theme.colors.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.listContainer}>
              {/* Create new list */}
              {creatingList ? (
                <View
                  style={[
                    styles.listItem,
                    { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1 },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.nameInput,
                      {
                        backgroundColor: theme.colors.background,
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    placeholder="List name"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={newListName}
                    onChangeText={setNewListName}
                    autoFocus
                    onSubmitEditing={handleCreateList}
                  />
                  <View style={styles.inlineActions}>
                    <TouchableOpacity
                      onPress={() => { setCreatingList(false); setNewListName(''); }}
                      style={styles.inlineButton}
                    >
                      <Text style={{ color: theme.colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleCreateList}
                      style={[styles.inlineButton, styles.primaryButton, { backgroundColor: theme.colors.primary }]}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Create</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.listItem,
                    styles.createButton,
                    { borderColor: theme.colors.primary, borderStyle: 'dashed' },
                  ]}
                  onPress={() => setCreatingList(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.listItemContent}>
                    <View style={styles.listItemLeft}>
                      <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} style={styles.listIcon} />
                      <Text style={[styles.listName, { color: theme.colors.primary, fontWeight: '600' }]}>
                        New List
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              {/* Existing lists */}
              {lists.map((list) => {
                const isSelected = list.id === currentListId;
                const isShared = (memberCounts[list.id] || 1) > 1;
                const isEditing = editingListId === list.id;

                return (
                  <TouchableOpacity
                    key={list.id}
                    style={[
                      styles.listItem,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primary + '15'
                          : theme.colors.card,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => !isEditing && handleSelectList(list.id)}
                    activeOpacity={isEditing ? 1 : 0.7}
                  >
                    {isEditing ? (
                      <View>
                        <TextInput
                          style={[
                            styles.nameInput,
                            {
                              backgroundColor: theme.colors.background,
                              color: theme.colors.text,
                              borderColor: theme.colors.border,
                            },
                          ]}
                          value={editingName}
                          onChangeText={setEditingName}
                          autoFocus
                          onSubmitEditing={handleSaveRename}
                          selectTextOnFocus
                        />
                        <View style={styles.inlineActions}>
                          <TouchableOpacity
                            onPress={() => { setEditingListId(null); setEditingName(''); }}
                            style={styles.inlineButton}
                          >
                            <Text style={{ color: theme.colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={handleSaveRename}
                            style={[styles.inlineButton, styles.primaryButton, { backgroundColor: theme.colors.primary }]}
                          >
                            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Save</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.listItemContent}>
                        <View style={styles.listItemLeft}>
                          <Ionicons
                            name={isShared ? 'people' : 'list'}
                            size={24}
                            color={isSelected ? theme.colors.primary : theme.colors.text}
                            style={styles.listIcon}
                          />
                          <View style={styles.listInfo}>
                            <Text
                              style={[
                                styles.listName,
                                {
                                  color: isSelected ? theme.colors.primary : theme.colors.text,
                                  fontWeight: isSelected ? '700' : '600',
                                },
                              ]}
                              numberOfLines={1}
                            >
                              {list.name}
                            </Text>
                            {isShared && (
                              <Text
                                style={[
                                  styles.listMemberCount,
                                  { color: theme.colors.textSecondary },
                                ]}
                              >
                                {memberCounts[list.id]} members
                              </Text>
                            )}
                          </View>
                        </View>

                        <View style={styles.listItemRight}>
                          <TouchableOpacity
                            onPress={() => handleStartRename(list)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="pencil-outline" size={18} color={theme.colors.textSecondary} />
                          </TouchableOpacity>
                          {isSelected && (
                            <Ionicons
                              name="checkmark-circle"
                              size={24}
                              color={theme.colors.primary}
                            />
                          )}
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerButton: {
    minWidth: 60,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  createButton: {
    borderWidth: 1.5,
  },
  listItem: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listIcon: {
    marginRight: 12,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 16,
    marginBottom: 2,
  },
  listMemberCount: {
    fontSize: 13,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  inlineActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  inlineButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryButton: {
    paddingHorizontal: 20,
  },
});

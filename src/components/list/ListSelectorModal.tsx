import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
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

  useEffect(() => {
    if (visible) {
      loadLists();
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
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Select List</Text>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: theme.colors.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : lists.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No lists found
            </Text>
          ) : (
            <View style={styles.listContainer}>
              {lists.map((list) => {
                const isSelected = list.id === currentListId;
                const isShared = (memberCounts[list.id] || 1) > 1;

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
                    onPress={() => handleSelectList(list.id)}
                    activeOpacity={0.7}
                  >
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

                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={theme.colors.primary}
                        />
                      )}
                    </View>
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
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    padding: 24,
  },
  listContainer: {
    padding: 16,
    gap: 12,
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
});

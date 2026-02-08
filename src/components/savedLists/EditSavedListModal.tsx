import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  Switch,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface SavedListItemInput {
  id?: string; // Existing items have IDs
  text: string;
  quantity: number;
  notes: string;
  order_index: number;
}

interface SavedListData {
  id: string;
  name: string;
  description: string | null;
  saved_list_items: Array<{
    id: string;
    text: string;
    quantity: number;
    notes: string | null;
    order_index: number;
  }>;
}

interface EditSavedListModalProps {
  visible: boolean;
  savedList: SavedListData | null;
  onClose: () => void;
  onSave: (
    savedListId: string,
    name: string,
    description: string | null,
    items: SavedListItemInput[]
  ) => Promise<void>;
  onAddToCurrentList?: (text: string, quantity: string) => Promise<void>;
}

export const EditSavedListModal: React.FC<EditSavedListModalProps> = ({
  visible,
  savedList,
  onClose,
  onSave,
  onAddToCurrentList,
}) => {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<SavedListItemInput[]>([]);
  const [currentItemText, setCurrentItemText] = useState('');
  const [currentItemQuantity, setCurrentItemQuantity] = useState('1');
  const [currentItemNotes, setCurrentItemNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [alsoAddToCurrentList, setAlsoAddToCurrentList] = useState(false);

  // Load saved list data when modal opens
  useEffect(() => {
    if (savedList && visible) {
      setName(savedList.name);
      setDescription(savedList.description || '');
      setItems(
        savedList.saved_list_items.map((item) => ({
          id: item.id,
          text: item.text,
          quantity: item.quantity,
          notes: item.notes || '',
          order_index: item.order_index,
        }))
      );
    }
  }, [savedList, visible]);

  const handleAddItem = async () => {
    if (!currentItemText.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    const newItem: SavedListItemInput = {
      text: currentItemText.trim(),
      quantity: parseInt(currentItemQuantity) || 1,
      notes: currentItemNotes.trim(),
      order_index: items.length,
    };

    setItems([...items, newItem]);

    // Also add to current shopping list if checkbox is checked
    if (alsoAddToCurrentList && onAddToCurrentList) {
      await onAddToCurrentList(currentItemText.trim(), currentItemQuantity);
    }

    setCurrentItemText('');
    setCurrentItemQuantity('1');
    setCurrentItemNotes('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!savedList) return;

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    try {
      setSaving(true);
      // Reindex items and format them properly (remove id field, ensure proper types)
      const formattedItems = items.map((item, index) => ({
        text: item.text,
        quantity: item.quantity,
        notes: item.notes.trim() || null,
        order_index: index,
      }));
      await onSave(savedList.id, name.trim(), description.trim() || null, formattedItems);
      onClose();
    } catch (error) {
      // Error is already handled and displayed in the parent component
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    if (savedList) {
      setName(savedList.name);
      setDescription(savedList.description || '');
      setItems(
        savedList.saved_list_items.map((item) => ({
          id: item.id,
          text: item.text,
          quantity: item.quantity,
          notes: item.notes || '',
          order_index: item.order_index,
        }))
      );
    }
    setCurrentItemText('');
    setCurrentItemQuantity('1');
    setCurrentItemNotes('');
    onClose();
  };

  if (!savedList) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={handleCancel} disabled={saving}>
            <Text style={[styles.headerButton, { color: theme.colors.primary, fontSize: theme.fontSizes.body }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text, fontSize: theme.fontSizes.h2 }]}>
            Edit Saved List
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text
                style={[
                  styles.headerButton,
                  { color: theme.colors.primary, fontSize: theme.fontSizes.body, fontWeight: '700' },
                ]}
              >
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* List Details */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.label, { color: theme.colors.text, fontSize: theme.fontSizes.body }]}>
              List Name *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  fontSize: theme.fontSizes.body,
                },
              ]}
              placeholder="e.g., Weekly Groceries"
              placeholderTextColor={theme.colors.textSecondary}
              value={name}
              onChangeText={setName}
              editable={!saving}
            />

            <Text style={[styles.label, { color: theme.colors.text, fontSize: theme.fontSizes.body, marginTop: 16 }]}>
              Description (optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  fontSize: theme.fontSizes.body,
                },
              ]}
              placeholder="e.g., Regular items for weekly shopping trip"
              placeholderTextColor={theme.colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              editable={!saving}
            />
          </View>

          {/* Items List */}
          {items.length > 0 && (
            <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: theme.fontSizes.h3 }]}>
                Items ({items.length})
              </Text>
              {items.map((item, index) => (
                <View key={item.id || index} style={[styles.itemCard, { backgroundColor: theme.colors.background }]}>
                  <View style={styles.itemCardContent}>
                    <Text style={[styles.itemText, { color: theme.colors.text, fontSize: theme.fontSizes.body }]}>
                      {item.text}
                    </Text>
                    {item.quantity > 1 && (
                      <Text
                        style={[styles.itemQuantity, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.small }]}
                      >
                        x{item.quantity}
                      </Text>
                    )}
                    {item.notes && (
                      <Text
                        style={[styles.itemNotes, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.small }]}
                      >
                        💬 {item.notes}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveItem(index)} disabled={saving}>
                    <Text style={{ fontSize: 20 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Add Items */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: theme.fontSizes.h3 }]}>
              Add New Item
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  fontSize: theme.fontSizes.body,
                },
              ]}
              placeholder="Item name"
              placeholderTextColor={theme.colors.textSecondary}
              value={currentItemText}
              onChangeText={setCurrentItemText}
              editable={!saving}
            />

            <View style={styles.itemRow}>
              <View style={styles.quantityContainer}>
                <Text style={[styles.label, { color: theme.colors.text, fontSize: theme.fontSizes.small }]}>
                  Quantity
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.quantityInput,
                    {
                      backgroundColor: theme.colors.background,
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                      fontSize: theme.fontSizes.body,
                    },
                  ]}
                  placeholder="1"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={currentItemQuantity}
                  onChangeText={setCurrentItemQuantity}
                  keyboardType="numeric"
                  editable={!saving}
                />
              </View>

              <View style={styles.notesContainer}>
                <Text style={[styles.label, { color: theme.colors.text, fontSize: theme.fontSizes.small }]}>
                  Notes (optional)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.background,
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                      fontSize: theme.fontSizes.body,
                    },
                  ]}
                  placeholder="e.g., organic"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={currentItemNotes}
                  onChangeText={setCurrentItemNotes}
                  editable={!saving}
                />
              </View>
            </View>

            {onAddToCurrentList && (
              <View style={styles.checkboxRow}>
                <Switch
                  value={alsoAddToCurrentList}
                  onValueChange={setAlsoAddToCurrentList}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                  thumbColor={alsoAddToCurrentList ? theme.colors.primary : theme.colors.textTertiary}
                />
                <Text style={[styles.checkboxLabel, { color: theme.colors.text, fontSize: theme.fontSizes.small }]}>
                  Also add to current shopping list
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleAddItem}
              disabled={saving}
            >
              <Text style={[styles.addButtonText, { fontSize: theme.fontSizes.body }]}>+ Add Item</Text>
            </TouchableOpacity>
          </View>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    fontWeight: '600',
    minWidth: 60,
  },
  headerTitle: {
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 12,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  itemRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  quantityContainer: {
    flex: 1,
  },
  notesContainer: {
    flex: 2,
  },
  quantityInput: {
    textAlign: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  checkboxLabel: {
    flex: 1,
  },
  addButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemCardContent: {
    flex: 1,
  },
  itemText: {
    fontWeight: '600',
    marginBottom: 4,
  },
  itemQuantity: {
    fontWeight: '500',
  },
  itemNotes: {
    fontStyle: 'italic',
    marginTop: 2,
  },
});

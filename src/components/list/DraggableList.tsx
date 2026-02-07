import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SwipeableItem } from './SwipeableItem';
import type { Item } from '../../types/models';

interface DraggableListProps {
  items: Item[];
  onReorder: (items: Item[]) => void;
  onToggle: (itemId: string, isBought: boolean) => void;
  onDelete: (itemId: string) => void;
  onItemPress?: (item: Item) => void;
}

// Temporarily using FlatList instead of DraggableFlatList for Expo Go compatibility
// Drag-to-reorder will be added when using a development build
export const DraggableList: React.FC<DraggableListProps> = ({
  items,
  onReorder,
  onToggle,
  onDelete,
  onItemPress,
}) => {
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <SwipeableItem
          item={item}
          onToggle={onToggle}
          onDelete={onDelete}
          onPress={onItemPress}
        />
      )}
      contentContainerStyle={styles.contentContainer}
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    paddingVertical: 8,
  },
});

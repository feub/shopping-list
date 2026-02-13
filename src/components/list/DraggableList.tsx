import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { SwipeableItem } from './SwipeableItem';
import type { Item } from '../../types/models';

interface DraggableListProps {
  items: Item[];
  onReorder: (items: Item[]) => void;
  onToggle: (itemId: string, isBought: boolean) => void;
  onToggleImportant?: (itemId: string, isImportant: boolean) => void;
  onDelete: (itemId: string) => void;
  onItemPress?: (item: Item) => void;
}

export const DraggableList: React.FC<DraggableListProps> = ({
  items,
  onReorder,
  onToggle,
  onToggleImportant,
  onDelete,
  onItemPress,
}) => {
  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Item>) => (
      <SwipeableItem
        item={item}
        onToggle={onToggle}
        onToggleImportant={onToggleImportant}
        onDelete={onDelete}
        onPress={onItemPress}
        drag={drag}
        isActive={isActive}
      />
    ),
    [onToggle, onToggleImportant, onDelete, onItemPress]
  );

  const keyExtractor = useCallback((item: Item) => item.id, []);

  return (
    <DraggableFlatList
      data={items}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onDragEnd={({ data }) => onReorder(data)}
      contentContainerStyle={styles.contentContainer}
      activationDistance={10}
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    paddingVertical: 8,
  },
});

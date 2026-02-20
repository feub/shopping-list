import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import ReorderableList, {
  useReorderableDrag,
  useIsActive,
  reorderItems,
} from 'react-native-reorderable-list';
import { SwipeableItem } from './SwipeableItem';
import type { Item } from '../../types/models';

interface DraggableListProps {
  items: Item[];
  onReorder: (items: Item[]) => void;
  onToggle: (itemId: string, isBought: boolean) => void;
  onToggleImportant?: (itemId: string, isImportant: boolean) => void;
  onAddToFavorites?: (item: Item) => void;
  favoriteTexts?: Set<string>;
  onDelete: (itemId: string) => void;
  onItemPress?: (item: Item) => void;
}

interface ItemRowProps {
  item: Item;
  onToggle: (itemId: string, isBought: boolean) => void;
  onToggleImportant?: (itemId: string, isImportant: boolean) => void;
  onAddToFavorites?: (item: Item) => void;
  favoriteTexts?: Set<string>;
  onDelete: (itemId: string) => void;
  onPress?: (item: Item) => void;
}

// Wrapper component so hooks can be used within the ReorderableList cell context
const ItemRow: React.FC<ItemRowProps> = (props) => {
  const drag = useReorderableDrag();
  const isActive = useIsActive();
  return <SwipeableItem {...props} drag={drag} isActive={isActive} />;
};

export const DraggableList: React.FC<DraggableListProps> = ({
  items,
  onReorder,
  onToggle,
  onToggleImportant,
  onAddToFavorites,
  favoriteTexts,
  onDelete,
  onItemPress,
}) => {
  const handleReorder = useCallback(
    ({ from, to }: { from: number; to: number }) => {
      onReorder(reorderItems(items, from, to));
    },
    [items, onReorder]
  );

  const renderItem = useCallback(
    ({ item }: { item: Item }) => (
      <ItemRow
        item={item}
        onToggle={onToggle}
        onToggleImportant={onToggleImportant}
        onAddToFavorites={onAddToFavorites}
        favoriteTexts={favoriteTexts}
        onDelete={onDelete}
        onPress={onItemPress}
      />
    ),
    [onToggle, onToggleImportant, onAddToFavorites, favoriteTexts, onDelete, onItemPress]
  );

  const keyExtractor = useCallback((item: Item) => item.id, []);

  return (
    <ReorderableList
      data={items}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onReorder={handleReorder}
      shouldUpdateActiveItem
      contentContainerStyle={styles.contentContainer}
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
  },
});

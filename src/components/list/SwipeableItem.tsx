import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useTheme } from '../../hooks/useTheme';
import { ListItem } from './ListItem';
import type { Item } from '../../types/models';

interface SwipeableItemProps {
  item: Item;
  onToggle: (itemId: string, isBought: boolean) => void;
  onDelete: (itemId: string) => void;
  onPress?: (item: Item) => void;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({
  item,
  onToggle,
  onDelete,
  onPress,
}) => {
  const { theme } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);

  const handleDelete = () => {
    onDelete(item.id);
  };

  const handleToggleBought = () => {
    onToggle(item.id, !item.isBought);
    swipeableRef.current?.close();
  };

  const renderLeftActions = () => (
    <TouchableOpacity
      style={[styles.leftAction, { backgroundColor: theme.colors.swipeBought }]}
      onPress={handleToggleBought}
    >
      <Text style={[styles.actionText, { fontSize: theme.fontSizes.body }]}>
        {item.isBought ? '↩ Unbought' : '✓ Bought'}
      </Text>
    </TouchableOpacity>
  );

  const renderRightActions = () => (
    <TouchableOpacity
      style={[styles.rightAction, { backgroundColor: theme.colors.swipeDelete }]}
      onPress={handleDelete}
    >
      <Text style={[styles.actionText, { fontSize: theme.fontSizes.body }]}>
        🗑 Delete
      </Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      overshootLeft={false}
      overshootRight={false}
    >
      <ListItem item={item} onToggle={onToggle} onPress={onPress} />
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  leftAction: {
    justifyContent: 'center',
    paddingHorizontal: 20,
    minWidth: 120,
  },
  rightAction: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    minWidth: 120,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

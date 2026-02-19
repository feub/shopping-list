import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import type { Item } from '../../types/models';

interface ListItemProps {
  item: Item;
  onToggle: (itemId: string, isBought: boolean) => void;
  onToggleImportant?: (itemId: string, isImportant: boolean) => void;
  onAddToFavorites?: (item: Item) => void;
  favoriteTexts?: Set<string>;
  onPress?: (item: Item) => void;
  drag?: () => void;
  isActive?: boolean;
}

export const ListItem: React.FC<ListItemProps> = ({ item, onToggle, onToggleImportant, onAddToFavorites, favoriteTexts, onPress, drag, isActive }) => {
  const { theme } = useTheme();
  const isFavorite = favoriteTexts?.has(item.text.toLowerCase()) ?? false;
  const [starFilled, setStarFilled] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleAddToFavorites = () => {
    onAddToFavorites?.(item);
    setStarFilled(true);
    timerRef.current = setTimeout(() => setStarFilled(false), 1000);
  };

  const handleToggle = () => {
    onToggle(item.id, !item.isBought);
  };

  const handlePress = () => {
    if (onPress) {
      onPress(item);
    }
  };

  const isVisiblyImportant = item.isImportant && !item.isBought;

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: isVisiblyImportant ? theme.colors.warning + '12' : theme.colors.card,
          borderBottomColor: theme.colors.border,
          ...(isVisiblyImportant && {
            borderLeftWidth: 3,
            borderLeftColor: theme.colors.warning,
          }),
          ...(isActive && {
            elevation: 4,
            transform: [{ scale: 1.02 }],
          }),
        },
      ]}
    >
      <TouchableOpacity
        style={styles.container}
        onPress={handlePress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        {/* Drag handle - long press to drag */}
        <Pressable
          onLongPress={drag}
          delayLongPress={150}
          style={[styles.dragHandle, { opacity: drag ? 0.5 : 0.3 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={[styles.dragLine, { backgroundColor: theme.colors.textSecondary }]} />
          <View style={[styles.dragLine, { backgroundColor: theme.colors.textSecondary }]} />
          <View style={[styles.dragLine, { backgroundColor: theme.colors.textSecondary }]} />
        </Pressable>

        <TouchableOpacity
          style={[
            styles.checkbox,
            {
              borderColor: item.isBought ? theme.colors.primary : theme.colors.border,
              backgroundColor: item.isBought ? theme.colors.primary : 'transparent',
            },
          ]}
          onPress={handleToggle}
        >
          {item.isBought && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.mainRow}>
            <Text
              style={[
                styles.text,
                {
                  color: item.isBought ? theme.colors.textSecondary : theme.colors.text,
                  fontSize: theme.fontSizes.body,
                  fontWeight: isVisiblyImportant ? '600' : '500',
                  textDecorationLine: item.isBought ? 'line-through' : 'none',
                },
              ]}
              numberOfLines={2}
            >
              {isVisiblyImportant && (
                <Text style={{ color: theme.colors.warning }}>⚑ </Text>
              )}
              {item.text}
            </Text>
            {item.quantity && (
              <View style={[styles.quantityBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                <Text
                  style={[
                    styles.quantity,
                    {
                      color: theme.colors.primary,
                      fontSize: theme.fontSizes.small,
                    },
                  ]}
                >
                  {item.quantity}
                </Text>
              </View>
            )}
            {onAddToFavorites && !item.isBought && (
              <TouchableOpacity
                style={[
                  styles.favoriteButton,
                  {
                    backgroundColor: (isFavorite || starFilled) ? theme.colors.primary : theme.colors.background,
                    borderColor: (isFavorite || starFilled) ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={handleAddToFavorites}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons
                  name={(isFavorite || starFilled) ? 'star' : 'star-outline'}
                  size={14}
                  color={(isFavorite || starFilled) ? '#FFFFFF' : theme.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
            {onToggleImportant && !item.isBought && (
              <TouchableOpacity
                style={[
                  styles.importantButton,
                  {
                    backgroundColor: item.isImportant ? theme.colors.warning : theme.colors.background,
                    borderColor: item.isImportant ? theme.colors.warning : theme.colors.border,
                  },
                ]}
                onPress={() => onToggleImportant(item.id, !item.isImportant)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text
                  style={{
                    color: item.isImportant ? '#FFFFFF' : theme.colors.textSecondary,
                    fontSize: theme.fontSizes.small,
                    fontWeight: '700',
                  }}
                >
                  !
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {item.notes && (
            <Text
              style={[
                styles.notes,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.fontSizes.small,
                },
              ]}
              numberOfLines={1}
            >
              💬 {item.notes}
            </Text>
          )}
          {item.createdByName && (
            <Text
              style={[
                styles.createdBy,
                {
                  color: theme.colors.textTertiary,
                  fontSize: theme.fontSizes.small,
                },
              ]}
              numberOfLines={1}
            >
              Added by {item.createdByName}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  dragHandle: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dragLine: {
    width: 18,
    height: 2,
    borderRadius: 1,
    marginVertical: 2,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    flex: 1,
    fontWeight: '500',
    lineHeight: 22,
  },
  quantityBadge: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  favoriteButton: {
    marginLeft: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  importantButton: {
    marginLeft: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontWeight: '700',
  },
  notes: {
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  createdBy: {
    marginTop: 4,
    lineHeight: 16,
  },
});

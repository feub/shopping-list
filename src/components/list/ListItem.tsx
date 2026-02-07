import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { Item } from '../../types/models';

interface ListItemProps {
  item: Item;
  onToggle: (itemId: string, isBought: boolean) => void;
  onPress?: (item: Item) => void;
}

export const ListItem: React.FC<ListItemProps> = ({ item, onToggle, onPress }) => {
  const { theme } = useTheme();

  const handleToggle = () => {
    onToggle(item.id, !item.isBought);
  };

  const handlePress = () => {
    if (onPress) {
      onPress(item);
    }
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: theme.colors.card,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.container}
        onPress={handlePress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        {/* Drag handle icon - will be functional with development build */}
        <View style={[styles.dragHandle, { opacity: 0.3 }]}>
          <View style={[styles.dragLine, { backgroundColor: theme.colors.textSecondary }]} />
          <View style={[styles.dragLine, { backgroundColor: theme.colors.textSecondary }]} />
          <View style={[styles.dragLine, { backgroundColor: theme.colors.textSecondary }]} />
        </View>

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
                  textDecorationLine: item.isBought ? 'line-through' : 'none',
                },
              ]}
              numberOfLines={2}
            >
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
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  dragHandle: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
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

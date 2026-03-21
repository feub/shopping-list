import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { StockEntry } from '../../types/models';

interface StockItemProps {
  item: StockEntry;
  onDecrement: (stockId: string, currentQuantity: number) => void;
  onEdit: (item: StockEntry) => void;
  onDelete: (stockId: string) => void;
}

export const StockItem: React.FC<StockItemProps> = ({ item, onDecrement, onEdit, onDelete }) => {
  const { theme } = useTheme();
  const isAtZero = item.quantity === 0;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
      <View style={styles.content}>
        <Text style={[styles.name, { color: theme.colors.text, fontSize: theme.fontSizes.body }]}>
          {item.productName}
        </Text>
        <View style={styles.quantityRow}>
          <View style={[styles.quantityBadge, { backgroundColor: isAtZero ? theme.colors.error : theme.colors.primary }]}>
            <Text style={[styles.quantityText, { fontSize: theme.fontSizes.small }]}>
              {item.quantity % 1 === 0 ? item.quantity.toFixed(0) : item.quantity.toString()}
            </Text>
          </View>
          {item.unit ? (
            <Text style={[styles.unit, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.small }]}>
              {item.unit}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.decrementButton,
            { backgroundColor: isAtZero ? theme.colors.border : theme.colors.error },
          ]}
          onPress={() => onDecrement(item.id, item.quantity)}
          disabled={isAtZero}
        >
          <Text style={[styles.decrementText, { color: isAtZero ? theme.colors.textTertiary : '#FFFFFF' }]}>
            −
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => onEdit(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.iconText, { color: theme.colors.textSecondary }]}>✏️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => onDelete(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.iconText, { color: theme.colors.textTertiary }]}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontWeight: '600',
    marginBottom: 4,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quantityBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: 'center',
  },
  quantityText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  unit: {
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  decrementButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decrementText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  iconButton: {
    padding: 4,
  },
  iconText: {
    fontSize: 16,
  },
});

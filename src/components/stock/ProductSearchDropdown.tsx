import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { ProductsService } from '../../services/supabase';
import { useTheme } from '../../hooks/useTheme';
import type { Product } from '../../types/models';

interface ProductSearchDropdownProps {
  query: string;
  style: ViewStyle;
  onSelect: (product: Product | { id: ''; name: string }) => void;
  onDismiss: () => void;
}

export const ProductSearchDropdown: React.FC<ProductSearchDropdownProps> = ({
  query,
  style,
  onSelect,
  onDismiss,
}) => {
  const { theme } = useTheme();
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setSearching(true);
      const { data } = await ProductsService.searchProducts(query.trim(), 8);
      setResults(
        (data ?? []).map(row => ({
          id: row.id,
          name: row.name,
          createdBy: row.created_by,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }))
      );
      setSearching(false);
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  const showAddNew = !searching && !results.some(
    r => r.name.toLowerCase() === query.trim().toLowerCase()
  );

  return (
    <View
      style={[
        styles.dropdown,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        style,
      ]}
    >
      {searching ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll}>
          {results.map(product => (
            <TouchableOpacity
              key={product.id}
              style={[styles.resultRow, { borderBottomColor: theme.colors.border }]}
              onPress={() => onSelect(product)}
            >
              <Text style={[styles.resultText, { color: theme.colors.text, fontSize: theme.fontSizes.body }]}>
                {product.name}
              </Text>
            </TouchableOpacity>
          ))}
          {showAddNew && (
            <TouchableOpacity
              style={styles.resultRow}
              onPress={() => onSelect({ id: '', name: query.trim() })}
            >
              <Text style={[styles.resultText, { color: theme.colors.primary, fontSize: theme.fontSizes.body }]}>
                + Add "{query.trim()}" as new product
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 8,
  },
  scroll: {
    maxHeight: 200,
  },
  loadingRow: {
    padding: 12,
    alignItems: 'center',
  },
  resultRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultText: {
    fontWeight: '500',
  },
});

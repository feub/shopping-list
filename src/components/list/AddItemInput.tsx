import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { Product } from '../../types/models';

interface AddItemInputProps {
  onAdd: (text: string, quantity?: string, isImportant?: boolean, productId?: string) => void;
  disabled?: boolean;
  /** Called when the search query changes so the parent can show/hide the dropdown. Pass null to hide. */
  onDropdownChange?: (query: string | null) => void;
  /** When the parent resolves a product selection, pass it here. Set back to null after consumption. */
  selectedProduct?: Product | { id: ''; name: string } | null;
  onProductConsumed?: () => void;
}

export const AddItemInput: React.FC<AddItemInputProps> = ({
  onAdd,
  disabled,
  onDropdownChange,
  selectedProduct,
  onProductConsumed,
}) => {
  const { theme } = useTheme();
  const quantityRef = useRef<TextInput>(null);
  const [text, setText] = useState('');
  const [quantity, setQuantity] = useState('');
  const [showQuantity, setShowQuantity] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);

  // Receive product selection from parent (ListScreen)
  useEffect(() => {
    if (selectedProduct) {
      setText(selectedProduct.name);
      setSelectedProductId(selectedProduct.id || undefined);
      onProductConsumed?.();
    }
  }, [selectedProduct]);

  const handleAdd = () => {
    if (text.trim()) {
      onAdd(text.trim(), quantity.trim() || undefined, isImportant || undefined, selectedProductId);
      setText('');
      setQuantity('');
      setShowQuantity(false);
      setIsImportant(false);
      setSelectedProductId(undefined);
      onDropdownChange?.(null);
    }
  };

  const handleTextChange = (value: string) => {
    setText(value);
    setSelectedProductId(undefined);
    onDropdownChange?.(value.trim().length >= 2 ? value : null);
  };

  const handleBlur = () => {
    // Small delay so taps on dropdown rows fire before it hides
    setTimeout(() => onDropdownChange?.(null), 150);
  };

  const handleFocus = () => {
    if (text.trim().length >= 2) {
      onDropdownChange?.(text);
    }
  };

  const toggleQuantity = () => {
    if (showQuantity) {
      setQuantity('');
      setShowQuantity(false);
    } else {
      setShowQuantity(true);
      setTimeout(() => quantityRef.current?.focus(), 50);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}
    >
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              borderColor: selectedProductId ? theme.colors.primary : theme.colors.border,
              fontSize: theme.fontSizes.body,
            },
          ]}
          placeholder="Add item..."
          placeholderTextColor={theme.colors.textSecondary}
          value={text}
          onChangeText={handleTextChange}
          onSubmitEditing={handleAdd}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="done"
          editable={!disabled}
        />

        {showQuantity && (
          <TextInput
            ref={quantityRef}
            style={[
              styles.quantityInput,
              {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
                fontSize: theme.fontSizes.body,
              },
            ]}
            placeholder="Qty"
            placeholderTextColor={theme.colors.textSecondary}
            value={quantity}
            onChangeText={setQuantity}
            editable={!disabled}
          />
        )}

        <TouchableOpacity
          style={[
            styles.quantityButton,
            {
              backgroundColor: showQuantity ? theme.colors.primary : theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={toggleQuantity}
          disabled={disabled}
        >
          <Text
            style={[
              styles.quantityButtonText,
              {
                color: showQuantity ? '#FFFFFF' : theme.colors.textSecondary,
                fontSize: theme.fontSizes.small,
              },
            ]}
          >
            Qty
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quantityButton,
            {
              backgroundColor: isImportant ? theme.colors.warning : theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={() => setIsImportant(!isImportant)}
          disabled={disabled}
        >
          <Text
            style={[
              styles.quantityButtonText,
              {
                color: isImportant ? '#FFFFFF' : theme.colors.textSecondary,
                fontSize: theme.fontSizes.body,
              },
            ]}
          >
            !
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.addButton,
            { backgroundColor: theme.colors.primary },
            (disabled || !text.trim()) && styles.addButtonDisabled,
          ]}
          onPress={handleAdd}
          disabled={disabled || !text.trim()}
        >
          <Text style={[styles.addButtonText, { fontSize: theme.fontSizes.body }]}>
            Add
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  quantityInput: {
    width: 60,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontWeight: '600',
  },
  addButton: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface AddItemInputProps {
  onAdd: (text: string, quantity?: string) => void;
  disabled?: boolean;
}

export const AddItemInput: React.FC<AddItemInputProps> = ({ onAdd, disabled }) => {
  const { theme } = useTheme();
  const [text, setText] = useState('');
  const [quantity, setQuantity] = useState('');
  const [showQuantity, setShowQuantity] = useState(false);

  const handleAdd = () => {
    if (text.trim()) {
      onAdd(text.trim(), quantity.trim() || undefined);
      setText('');
      setQuantity('');
      setShowQuantity(false);
    }
  };

  const toggleQuantity = () => {
    setShowQuantity(!showQuantity);
    if (showQuantity) {
      setQuantity('');
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
              borderColor: theme.colors.border,
              fontSize: theme.fontSizes.body,
            },
          ]}
          placeholder="Add item..."
          placeholderTextColor={theme.colors.textSecondary}
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
          editable={!disabled}
        />

        {showQuantity && (
          <TextInput
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

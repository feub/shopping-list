import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { RootStackScreenProps } from '../navigation/types';

export const EditSavedListScreen: React.FC<RootStackScreenProps<'EditSavedList'>> = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.fontSizes.h1 }]}>
        Edit Saved List
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.body }]}>
        Coming soon...
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontWeight: '400',
  },
});

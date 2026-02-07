import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import type { MainTabScreenProps } from '../navigation/types';
import type { ThemeMode, FontSize } from '../theme';

export const SettingsScreen: React.FC<MainTabScreenProps<'Settings'>> = () => {
  const { theme, themeMode, fontSize, setThemeMode, setFontSize } = useTheme();
  const { user, signOut } = useAuth();

  const handleThemeChange = async (mode: ThemeMode) => {
    await setThemeMode(mode);
  };

  const handleFontSizeChange = async (size: FontSize) => {
    await setFontSize(size);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* User Profile Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: theme.fontSizes.h2 }]}>
          Account
        </Text>
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileEmail, { color: theme.colors.text, fontSize: theme.fontSizes.body }]}>
                {user?.email || 'Not signed in'}
              </Text>
              <Text style={[styles.profileSubtext, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.small }]}>
                {user ? 'Signed in' : 'Guest'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Appearance Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: theme.fontSizes.h2 }]}>
          Appearance
        </Text>

        {/* Theme Mode */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.settingLabel, { color: theme.colors.text, fontSize: theme.fontSizes.body }]}>
            Theme
          </Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                {
                  backgroundColor: themeMode === 'light' ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => handleThemeChange('light')}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color: themeMode === 'light' ? '#FFFFFF' : theme.colors.text,
                    fontSize: theme.fontSizes.small,
                  },
                ]}
              >
                ☀️ Light
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                {
                  backgroundColor: themeMode === 'system' ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => handleThemeChange('system')}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color: themeMode === 'system' ? '#FFFFFF' : theme.colors.text,
                    fontSize: theme.fontSizes.small,
                  },
                ]}
              >
                📱 System
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                {
                  backgroundColor: themeMode === 'dark' ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => handleThemeChange('dark')}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color: themeMode === 'dark' ? '#FFFFFF' : theme.colors.text,
                    fontSize: theme.fontSizes.small,
                  },
                ]}
              >
                🌙 Dark
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Font Size */}
        <View style={[styles.card, { backgroundColor: theme.colors.card, marginTop: 12 }]}>
          <Text style={[styles.settingLabel, { color: theme.colors.text, fontSize: theme.fontSizes.body }]}>
            Font Size
          </Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                {
                  backgroundColor: fontSize === 'small' ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => handleFontSizeChange('small')}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color: fontSize === 'small' ? '#FFFFFF' : theme.colors.text,
                    fontSize: 12,
                  },
                ]}
              >
                Small
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                {
                  backgroundColor: fontSize === 'medium' ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => handleFontSizeChange('medium')}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color: fontSize === 'medium' ? '#FFFFFF' : theme.colors.text,
                    fontSize: 14,
                  },
                ]}
              >
                Medium
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                {
                  backgroundColor: fontSize === 'large' ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => handleFontSizeChange('large')}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color: fontSize === 'large' ? '#FFFFFF' : theme.colors.text,
                    fontSize: 16,
                  },
                ]}
              >
                Large
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Actions Section */}
      {user && (
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: theme.colors.error }]}
            onPress={handleLogout}
          >
            <Text style={[styles.logoutButtonText, { fontSize: theme.fontSizes.body }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* App Info */}
      <View style={[styles.footer]}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.small }]}>
          Shopping List App v1.0.0
        </Text>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary, fontSize: theme.fontSizes.small }]}>
          Built with React Native & Supabase
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileEmail: {
    fontWeight: '600',
    marginBottom: 4,
  },
  profileSubtext: {
    fontWeight: '400',
  },
  settingLabel: {
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontWeight: '600',
  },
  logoutButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  footerText: {
    marginVertical: 2,
    textAlign: 'center',
  },
});

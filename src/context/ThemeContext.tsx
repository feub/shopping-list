import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeMode, FontSize, createTheme } from '../theme';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  fontSize: FontSize;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setFontSize: (size: FontSize) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_MODE_KEY = 'theme_mode';
const FONT_SIZE_KEY = 'font_size';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');

  // Determine if current theme is dark
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  // Create theme based on current settings
  const theme = createTheme(isDark ? 'dark' : 'light', fontSize);

  // Load theme preferences on mount
  useEffect(() => {
    loadThemePreferences();
  }, []);

  const loadThemePreferences = async () => {
    try {
      const [savedThemeMode, savedFontSize] = await Promise.all([
        AsyncStorage.getItem(THEME_MODE_KEY),
        AsyncStorage.getItem(FONT_SIZE_KEY),
      ]);

      if (savedThemeMode) {
        setThemeModeState(savedThemeMode as ThemeMode);
      }
      if (savedFontSize) {
        setFontSizeState(savedFontSize as FontSize);
      }
    } catch (error) {
      console.error('Failed to load theme preferences:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_MODE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  };

  const setFontSize = async (size: FontSize) => {
    try {
      await AsyncStorage.setItem(FONT_SIZE_KEY, size);
      setFontSizeState(size);
    } catch (error) {
      console.error('Failed to save font size:', error);
    }
  };

  const value: ThemeContextType = {
    theme,
    themeMode,
    fontSize,
    isDark,
    setThemeMode,
    setFontSize,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

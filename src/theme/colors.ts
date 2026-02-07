export const lightColors = {
  // Primary colors
  primary: '#007AFF',
  primaryLight: '#4DA3FF',
  primaryDark: '#0056B3',

  // Backgrounds
  background: '#F2F2F7',
  backgroundSecondary: '#E5E5EA',
  card: '#FFFFFF',

  // Text
  text: '#000000',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',

  // Status
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#5AC8FA',

  // UI Elements
  border: '#C6C6C8',
  separator: '#E5E5EA',
  shadow: 'rgba(0, 0, 0, 0.1)',

  // Shopping list specific
  checked: '#8E8E93',
  checkedBackground: '#F2F2F7',
  swipeDelete: '#FF3B30',
  swipeBought: '#34C759',
};

export const darkColors = {
  // Primary colors
  primary: '#0A84FF',
  primaryLight: '#409CFF',
  primaryDark: '#006BCE',

  // Backgrounds
  background: '#000000',
  backgroundSecondary: '#1C1C1E',
  card: '#2C2C2E',

  // Text
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#48484A',

  // Status
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
  info: '#64D2FF',

  // UI Elements
  border: '#38383A',
  separator: '#2C2C2E',
  shadow: 'rgba(0, 0, 0, 0.3)',

  // Shopping list specific
  checked: '#8E8E93',
  checkedBackground: '#2C2C2E',
  swipeDelete: '#FF453A',
  swipeBought: '#30D158',
};

export type ColorScheme = typeof lightColors;

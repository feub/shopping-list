export const lightColors = {
  // Primary colors — amber/burnt orange from palette
  primary: '#C07A30',
  primaryLight: '#E5AD5E',
  primaryDark: '#9E6228',

  // Backgrounds — cream from palette
  background: '#FDF6E3',
  backgroundSecondary: '#F5EBCF',
  card: '#FFFDF7',

  // Text — dark forest green from palette
  text: '#2E3D29',
  textSecondary: '#6B7A5E',
  textTertiary: '#A8B098',

  // Status
  success: '#8B8C3C',
  warning: '#E5AD5E',
  error: '#C24B3A',
  info: '#7A9A6E',

  // UI Elements
  border: '#D5CCAF',
  separator: '#E8DFC8',
  shadow: 'rgba(46, 61, 41, 0.1)',

  // Shopping list specific — olive green from palette
  checked: '#8B8C3C',
  checkedBackground: '#F0EBD4',
  swipeDelete: '#C24B3A',
  swipeBought: '#8B8C3C',
};

export const darkColors = {
  // Primary colors — amber brightened for dark backgrounds
  primary: '#D4923E',
  primaryLight: '#E5AD5E',
  primaryDark: '#A87230',

  // Backgrounds — deep forest green from palette
  background: '#1A2418',
  backgroundSecondary: '#232F20',
  card: '#2C3A28',

  // Text — cream/warm whites from palette
  text: '#F0E8D4',
  textSecondary: '#A8B098',
  textTertiary: '#5A6B50',

  // Status
  success: '#A8AA4A',
  warning: '#E5AD5E',
  error: '#D4604E',
  info: '#8EAE80',

  // UI Elements
  border: '#3E4E38',
  separator: '#2C3A28',
  shadow: 'rgba(0, 0, 0, 0.4)',

  // Shopping list specific — olive green brightened
  checked: '#A8AA4A',
  checkedBackground: '#2C3A28',
  swipeDelete: '#D4604E',
  swipeBought: '#A8AA4A',
};

export type ColorScheme = typeof lightColors;

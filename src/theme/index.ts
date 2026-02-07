import { lightColors, darkColors, ColorScheme } from './colors';
import { fontSizeScales, fontWeights, fontFamilies, FontSize } from './typography';
import { spacing, borderRadius, iconSizes } from './spacing';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  colors: ColorScheme;
  fontSizes: typeof fontSizeScales.medium;
  fontWeights: typeof fontWeights;
  fontFamilies: typeof fontFamilies;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  iconSizes: typeof iconSizes;
}

export const createTheme = (mode: 'light' | 'dark', fontSize: FontSize = 'medium'): Theme => ({
  colors: mode === 'light' ? lightColors : darkColors,
  fontSizes: fontSizeScales[fontSize],
  fontWeights,
  fontFamilies,
  spacing,
  borderRadius,
  iconSizes,
});

export { lightColors, darkColors, fontSizeScales, spacing, borderRadius };
export type { FontSize, ColorScheme };

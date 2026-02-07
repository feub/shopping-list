export type FontSize = 'small' | 'medium' | 'large';

interface FontSizeScale {
  tiny: number;
  small: number;
  body: number;
  subtitle: number;
  title: number;
  h3: number;
  h2: number;
  h1: number;
}

export const fontSizeScales: Record<FontSize, FontSizeScale> = {
  small: {
    tiny: 10,
    small: 12,
    body: 14,
    subtitle: 16,
    title: 18,
    h3: 20,
    h2: 24,
    h1: 28,
  },
  medium: {
    tiny: 11,
    small: 13,
    body: 16,
    subtitle: 18,
    title: 20,
    h3: 22,
    h2: 26,
    h1: 32,
  },
  large: {
    tiny: 12,
    small: 15,
    body: 18,
    subtitle: 20,
    title: 24,
    h3: 26,
    h2: 30,
    h1: 36,
  },
};

export const fontWeights = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const fontFamilies = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
};

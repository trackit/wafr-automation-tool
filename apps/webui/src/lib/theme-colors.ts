/**
 * Utility functions for extracting colors from daisyUI theme CSS custom properties
 */

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  info: string;
  success: string;
  warning: string;
  error: string;
  base: string;
  baseContent: string;
}

/**
 * Extract all available daisyUI theme colors from CSS custom properties
 */
export const getThemeColors = (): ThemeColors => {
  if (typeof window === 'undefined') {
    // Fallback colors for SSR
    return {
      primary: '#047aff',
      secondary: '#00C49F',
      accent: '#FFBB28',
      neutral: '#FF8042',
      info: '#0088FE',
      success: '#00C49F',
      warning: '#FFBB28',
      error: '#FF8042',
      base: '#ffffff',
      baseContent: '#000000',
    };
  }

  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);

  return {
    primary:
      computedStyle.getPropertyValue('--color-primary').trim() || '#047aff',
    secondary:
      computedStyle.getPropertyValue('--color-secondary').trim() || '#00C49F',
    accent:
      computedStyle.getPropertyValue('--color-accent').trim() || '#FFBB28',
    neutral:
      computedStyle.getPropertyValue('--color-neutral').trim() || '#FF8042',
    info: computedStyle.getPropertyValue('--color-info').trim() || '#0088FE',
    success:
      computedStyle.getPropertyValue('--color-success').trim() || '#00C49F',
    warning:
      computedStyle.getPropertyValue('--color-warning').trim() || '#FFBB28',
    error: computedStyle.getPropertyValue('--color-error').trim() || '#FF8042',
    base: computedStyle.getPropertyValue('--color-base').trim() || '#ffffff',
    baseContent:
      computedStyle.getPropertyValue('--color-base-content').trim() ||
      '#000000',
  };
};

/**
 * Convert hex color to RGB
 */
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [0, 0, 0];
};

/**
 * Convert RGB to hex
 */
const rgbToHex = (r: number, g: number, b: number): string => {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
};

/**
 * Lighten a color by a percentage
 */
export const lightenColor = (color: string, percent: number): string => {
  const [r, g, b] = hexToRgb(color);
  const factor = 1 + percent / 100;
  return rgbToHex(
    Math.min(255, Math.round(r * factor)),
    Math.min(255, Math.round(g * factor)),
    Math.min(255, Math.round(b * factor))
  );
};

/**
 * Darken a color by a percentage
 */
export const darkenColor = (color: string, percent: number): string => {
  const [r, g, b] = hexToRgb(color);
  const factor = 1 - percent / 100;
  return rgbToHex(
    Math.max(0, Math.round(r * factor)),
    Math.max(0, Math.round(g * factor)),
    Math.max(0, Math.round(b * factor))
  );
};

/**
 * Get multiple variations of primary and secondary colors for charts
 * This ensures charts only use theme-consistent colors
 */
export const getChartColors = (): string[] => {
  const colors = getThemeColors();

  return [
    // Primary variations
    colors.primary,
    lightenColor(colors.primary, 40),
    lightenColor(colors.primary, 80),
    darkenColor(colors.primary, 40),
    darkenColor(colors.primary, 80),
  ];
};

/**
 * Get a chart color by index, cycling through primary and secondary variations
 */
export const getChartColorByIndex = (index: number): string => {
  const chartColors = getChartColors();
  return chartColors[index % chartColors.length];
};

/**
 * Get an array of theme colors for charts and visualizations
 */
export const getThemeColorArray = (): string[] => {
  const colors = getThemeColors();
  return [
    colors.primary,
    colors.secondary,
    colors.accent,
    colors.neutral,
    colors.info,
    colors.success,
    colors.warning,
    colors.error,
  ].filter((color) => color && color !== '');
};

/**
 * Get a specific theme color by name
 */
export const getThemeColor = (colorName: keyof ThemeColors): string => {
  const colors = getThemeColors();
  return colors[colorName] || '#000000';
};

/**
 * Get a random theme color
 */
export const getRandomThemeColor = (): string => {
  const colorArray = getThemeColorArray();
  if (colorArray.length === 0) return '#000000';
  return colorArray[Math.floor(Math.random() * colorArray.length)];
};

/**
 * Get a color by index (useful for charts with multiple data series)
 */
export const getThemeColorByIndex = (index: number): string => {
  const colorArray = getThemeColorArray();
  if (colorArray.length === 0) return '#000000';
  return colorArray[index % colorArray.length];
};

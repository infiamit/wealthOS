/**
 * WealthOS — Premium Dark Indigo Theme
 * 
 * Glassmorphic FinTech design tokens for the entire app.
 * All components must consume colors, spacing, and typography from this file.
 */

import React, { createContext, useContext } from 'react';

// ============================================================
// COLORS — Radial Dark Indigo Theme
// ============================================================
export const ThemeColors = {
  // Background Gradient
  backgroundStart: '#0B0C10',
  backgroundEnd: '#1F2833',

  // Glassmorphic Panels
  frostedPanel: 'rgba(25, 28, 36, 0.75)',
  frostedPanelLight: 'rgba(35, 40, 52, 0.6)',
  frostedPanelDark: 'rgba(15, 17, 22, 0.85)',

  // Neon Accent Colors
  neonGreen: '#39FF14',       // Optimal paths, equity, growth
  neonCyan: '#00FFFF',        // Debt instruments, steady paths
  neonAmber: '#FFA500',       // Warnings, depletion alerts
  goldMetallic: '#FFD700',    // Milestones, achievements, ₹1Cr line

  // Semantic Colors
  equityGreen: '#39FF14',
  debtBlue: '#4FC3F7',
  cashWhite: '#E0E0E0',
  goldYellow: '#FFD700',
  liabilityRed: '#FF5252',

  // Text Colors
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.45)',
  textAccent: '#39FF14',

  // Borders & Dividers
  borderLight: 'rgba(255, 255, 255, 0.1)',
  borderMedium: 'rgba(255, 255, 255, 0.2)',
  borderActive: '#39FF14',

  // Status
  success: '#39FF14',
  warning: '#FFA500',
  error: '#FF5252',
  info: '#00FFFF',
} as const;

// ============================================================
// SPACING — 4px Grid System
// ============================================================
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
} as const;

// ============================================================
// TYPOGRAPHY
// ============================================================
export const Typography = {
  // Font sizes
  size: {
    caption: 11,
    small: 13,
    body: 15,
    bodyLarge: 17,
    subtitle: 19,
    title: 22,
    heading: 28,
    hero: 36,
    display: 48,
  },

  // Font weights
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1.0,
    widest: 2.0,
  },
} as const;

// ============================================================
// BORDER RADIUS
// ============================================================
export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 999,
} as const;

// ============================================================
// SHADOWS (for elevated glassmorphic panels)
// ============================================================
export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  goldGlow: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
} as const;

// ============================================================
// ANIMATION PRESETS (for Moti / Reanimated)
// ============================================================
export const AnimationPresets = {
  springDamped: { damping: 15, stiffness: 150 },
  springBouncy: { damping: 10, stiffness: 200 },
  springGentle: { damping: 20, stiffness: 100 },
  timing: { duration: 300 },
  timingSlow: { duration: 500 },
} as const;

// ============================================================
// THEME CONTEXT — React Context Provider
// ============================================================
export interface Theme {
  colors: typeof ThemeColors;
  spacing: typeof Spacing;
  typography: typeof Typography;
  borderRadius: typeof BorderRadius;
  shadows: typeof Shadows;
  animation: typeof AnimationPresets;
}

export const theme: Theme = {
  colors: ThemeColors,
  spacing: Spacing,
  typography: Typography,
  borderRadius: BorderRadius,
  shadows: Shadows,
  animation: AnimationPresets,
};

const ThemeContext = createContext<Theme>(theme);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): Theme => {
  return useContext(ThemeContext);
};

export default theme;

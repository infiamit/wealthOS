/**
 * WealthOS — GlassPanel Component
 * 
 * Reusable glassmorphic frosted card wrapper.
 * The foundational UI primitive used across all screens.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { ThemeColors, BorderRadius, Spacing, Shadows } from '@/styles/theme';

interface GlassPanelProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'subtle';
  glowColor?: string;
}

export function GlassPanel({
  children,
  style,
  variant = 'default',
  glowColor,
}: GlassPanelProps) {
  const variantStyles = {
    default: styles.default,
    elevated: styles.elevated,
    subtle: styles.subtle,
  };

  return (
    <View
      style={[
        styles.base,
        variantStyles[variant],
        glowColor && {
          shadowColor: glowColor,
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 10,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    padding: Spacing.base,
    ...Shadows.card,
  },
  default: {
    backgroundColor: ThemeColors.frostedPanel,
  },
  elevated: {
    backgroundColor: ThemeColors.frostedPanelDark,
    borderColor: ThemeColors.borderMedium,
  },
  subtle: {
    backgroundColor: ThemeColors.frostedPanelLight,
    borderColor: 'transparent',
  },
});

export default GlassPanel;

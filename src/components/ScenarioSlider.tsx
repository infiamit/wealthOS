/**
 * WealthOS — Scenario Slider Component
 * 
 * Interactive slider with live value label and accent color.
 * Uses native Slider for now — spring physics via Reanimated can be added later.
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/styles/theme';

interface ScenarioSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatValue: (value: number) => string;
  onValueChange: (value: number) => void;
  accentColor?: string;
}

export default function ScenarioSlider({
  label,
  value,
  min,
  max,
  step,
  formatValue,
  onValueChange,
  accentColor = ThemeColors.neonGreen,
}: ScenarioSliderProps) {
  const progress = ((value - min) / (max - min)) * 100;

  const handleTouchMove = useCallback(
    (event: any) => {
      // Custom slider implementation for consistent cross-platform behavior
    },
    [min, max, step, onValueChange]
  );

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.valueLabel, { color: accentColor }]}>
          {formatValue(value)}
        </Text>
      </View>

      {/* Custom Slider Track */}
      <View style={styles.trackContainer}>
        <View style={styles.track}>
          <View
            style={[
              styles.trackFill,
              {
                width: `${progress}%`,
                backgroundColor: accentColor,
              },
            ]}
          />
        </View>

        {/* Slider buttons for increment/decrement */}
        <View style={styles.buttonRow}>
          <Text
            style={[styles.stepButton, { borderColor: accentColor }]}
            onPress={() => {
              const newVal = Math.max(min, value - step);
              onValueChange(Math.round(newVal * 100) / 100);
            }}
          >
            −
          </Text>

          {/* Tap zones along the track */}
          <View style={styles.tapZone}>
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
              <Text
                key={i}
                style={styles.tapDot}
                onPress={() => {
                  const newVal = min + (max - min) * pct;
                  const snapped = Math.round(newVal / step) * step;
                  onValueChange(Math.round(snapped * 100) / 100);
                }}
              >
                {pct === Math.round(progress / 100 * 4) / 4 ? '●' : '·'}
              </Text>
            ))}
          </View>

          <Text
            style={[styles.stepButton, { borderColor: accentColor }]}
            onPress={() => {
              const newVal = Math.min(max, value + step);
              onValueChange(Math.round(newVal * 100) / 100);
            }}
          >
            +
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.medium,
  },
  valueLabel: {
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.bold,
    letterSpacing: Typography.letterSpacing.wide,
  },
  trackContainer: {
    marginTop: Spacing.xs,
  },
  track: {
    height: 6,
    backgroundColor: ThemeColors.frostedPanelLight,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  trackFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepButton: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.title,
    fontWeight: Typography.weight.bold,
    width: 36,
    height: 36,
    textAlign: 'center',
    lineHeight: 34,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  tapZone: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  tapDot: {
    color: ThemeColors.textMuted,
    fontSize: 20,
    padding: Spacing.xs,
  },
});

/**
 * WealthOS — Milestone Progress Bar
 * 
 * Animated glassmorphic progress bar showing wealth goal progress.
 * Displays current / target with percentage.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors, Typography, Spacing, BorderRadius } from '@/styles/theme';
import { formatINRCompact } from '@/math/engine';

interface MilestoneProgressBarProps {
  current: number;
  target: number;
  progress: number; // 0 to 100
}

export default function MilestoneProgressBar({
  current,
  target,
  progress,
}: MilestoneProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View style={styles.container}>
      {/* Progress Track */}
      <View style={styles.trackOuter}>
        <View
          style={[
            styles.trackFill,
            { width: `${clampedProgress}%` },
          ]}
        >
          {/* Glow effect at the leading edge */}
          <View style={styles.glowDot} />
        </View>
      </View>

      {/* Labels */}
      <View style={styles.labelRow}>
        <Text style={styles.currentLabel}>
          {formatINRCompact(current)}
        </Text>
        <Text style={styles.progressPercentage}>
          {clampedProgress.toFixed(1)}%
        </Text>
        <Text style={styles.targetLabel}>
          {formatINRCompact(target)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  trackOuter: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  trackFill: {
    height: '100%',
    backgroundColor: ThemeColors.goldMetallic,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    minWidth: 8,
  },
  glowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    marginRight: 2,
    shadowColor: ThemeColors.goldMetallic,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  currentLabel: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.medium,
  },
  progressPercentage: {
    color: ThemeColors.goldMetallic,
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.bold,
  },
  targetLabel: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.medium,
  },
});

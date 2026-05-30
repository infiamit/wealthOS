/**
 * WealthOS — My Journey Dashboard (Real Journey Ledger)
 * 
 * The main dashboard screen displaying:
 * 1. Net Worth Today (glowing digital ledger)
 * 2. Milestone Progress Bar
 * 3. Real Target Date of Freedom Card
 * 4. Real Journey Projection Chart (climbing towards goal)
 * 5. Real Asset Allocation Breakdown Panel
 * 6. CTA Card navigating to Sandbox Simulator
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-gifted-charts';

import { GlassPanel } from '@/components/GlassPanel';
import MilestoneProgressBar from '@/components/MilestoneProgressBar';
import { ThemeColors, Typography, Spacing, Shadows, BorderRadius } from '@/styles/theme';
import { getAssets, getGoals } from '@/services/storage';
import {
  calculateNetWorth,
  calculateWeightedCagr,
  solveMilestoneTargetDate,
  formatINR,
  formatINRCompact,
} from '@/math/engine';
import { AssetClass, WealthGoal, AssetCategory } from '@/types';

export default function CoreScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  // ============================================================
  // STATE
  // ============================================================
  const [assets, setAssets] = useState<AssetClass[]>([]);
  const [goals, setGoals] = useState<WealthGoal[]>([]);
  const [containerWidth, setContainerWidth] = useState(
    Dimensions.get('window').width - 48
  );

  // ============================================================
  // LOAD DATA ON MOUNT / NAVIGATION FOCUS
  // ============================================================
  const loadData = useCallback(() => {
    const loadedAssets = getAssets();
    const loadedGoals = getGoals();
    setAssets(loadedAssets);
    setGoals(loadedGoals);
  }, []);

  useEffect(() => {
    loadData();
    // Add navigation listener to reload data when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const onContainerLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) {
      setContainerWidth(width);
    }
  };

  // ============================================================
  // DERIVED VALUES
  // ============================================================
  const netWorth = useMemo(() => calculateNetWorth(assets), [assets]);
  const weightedCagr = useMemo(() => calculateWeightedCagr(assets), [assets]);
  const primaryGoal = goals[0];

  const goalProgress = useMemo(() => {
    if (!primaryGoal) return 0;
    return Math.min(100, (netWorth / primaryGoal.targetAmount) * 100);
  }, [netWorth, primaryGoal]);

  const realMonthlyContribution = useMemo(() => {
    return primaryGoal ? primaryGoal.monthlyContribution : 30000;
  }, [primaryGoal]);

  // Solve real target date based on actual saved numbers
  const targetDate = useMemo(() => {
    if (!primaryGoal) return '—';
    return solveMilestoneTargetDate({
      targetAmount: primaryGoal.targetAmount,
      currentNetWorth: netWorth,
      monthlyContribution: realMonthlyContribution,
      expectedAnnualReturn: (weightedCagr > 0 ? weightedCagr : 12) / 100,
    });
  }, [primaryGoal, netWorth, realMonthlyContribution, weightedCagr]);

  // ============================================================
  // ASSET ALLOCATION BREAKDOWN CALCULATIONS
  // ============================================================
  const allocationStats = useMemo(() => {
    const categories: Record<AssetCategory, number> = {
      EQUITY: 0,
      DEBT: 0,
      CASH: 0,
      GOLD: 0,
      LIABILITY: 0,
    };

    assets.forEach((a) => {
      categories[a.category] += Math.max(0, a.value);
    });

    const totalPositiveAssets =
      categories.EQUITY + categories.DEBT + categories.CASH + categories.GOLD;

    const stats = [
      {
        key: 'EQUITY',
        label: 'Equity',
        emoji: '🟢',
        value: categories.EQUITY,
        color: ThemeColors.equityGreen,
        percentage: totalPositiveAssets > 0 ? (categories.EQUITY / totalPositiveAssets) * 100 : 0,
      },
      {
        key: 'DEBT',
        label: 'Debt / FDs',
        emoji: '🔵',
        value: categories.DEBT,
        color: ThemeColors.debtBlue,
        percentage: totalPositiveAssets > 0 ? (categories.DEBT / totalPositiveAssets) * 100 : 0,
      },
      {
        key: 'GOLD',
        label: 'Gold ETF',
        emoji: '🟡',
        value: categories.GOLD,
        color: ThemeColors.goldYellow,
        percentage: totalPositiveAssets > 0 ? (categories.GOLD / totalPositiveAssets) * 100 : 0,
      },
      {
        key: 'CASH',
        label: 'Liquid Cash',
        emoji: '⚪',
        value: categories.CASH,
        color: ThemeColors.cashWhite,
        percentage: totalPositiveAssets > 0 ? (categories.CASH / totalPositiveAssets) * 100 : 0,
      },
    ];

    return {
      stats,
      liabilities: categories.LIABILITY,
    };
  }, [assets]);

  // ============================================================
  // REAL PROJECTION TIMELINE (Deterministic compounding path)
  // ============================================================
  const chartData = useMemo(() => {
    if (netWorth <= 0) return [];
    
    const timeline = [];
    let currentNW = netWorth;
    const annualHike = 0.08; // 8% standard annual hike
    const cagr = (weightedCagr > 0 ? weightedCagr : 12) / 100;
    let sip = realMonthlyContribution;
    const currentYear = new Date().getFullYear();

    timeline.push({
      value: currentNW,
      year: currentYear,
      labelComponent: () => (
        <View style={styles.xAxisLabelContainer}>
          <Text style={styles.xAxisLabelText}>{currentYear}</Text>
        </View>
      ),
    });

    // Project over 15 years
    for (let year = 1; year <= 15; year++) {
      // 1. Compounding existing portfolio value
      currentNW = currentNW * (1 + cagr);

      // 2. Compounding monthly contributions
      const monthlyRate = Math.pow(1 + cagr, 1 / 12) - 1;
      for (let month = 1; month <= 12; month++) {
        currentNW = currentNW * (1 + monthlyRate);
        currentNW += sip;
      }

      timeline.push({
        value: Math.round(currentNW),
        year: currentYear + year,
        labelComponent:
          year % 3 === 0
            ? () => (
                <View style={styles.xAxisLabelContainer}>
                  <Text style={styles.xAxisLabelText}>{currentYear + year}</Text>
                </View>
              )
            : undefined,
      });

      // Increment SIP annually
      sip = sip * (1 + annualHike);
    }
    return timeline;
  }, [netWorth, weightedCagr, realMonthlyContribution]);

  const yAxisLabelWidth = 55;
  const rightShift = 10;
  const chartWidth = Math.max(100, containerWidth - yAxisLabelWidth - rightShift - 10);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.screenTitle}>My Journey</Text>
        <Text style={styles.screenSubtitle}>WealthOS Dashboard</Text>

        {/* Net Worth Card */}
        <GlassPanel glowColor={ThemeColors.neonGreen} style={styles.netWorthCard}>
          <Text style={styles.netWorthLabel}>YOUR NET WORTH TODAY</Text>
          <Text style={styles.netWorthValue}>{formatINR(netWorth)}</Text>
          <Text style={styles.netWorthCagr}>
            compounding at ~{weightedCagr > 0 ? weightedCagr : '12.0'}% weighted CAGR
          </Text>
        </GlassPanel>

        {/* Milestone Progress */}
        {primaryGoal && (
          <GlassPanel style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>MILESTONE PROGRESS</Text>
            <Text style={styles.goalName}>{primaryGoal.name}</Text>
            <MilestoneProgressBar
              current={netWorth}
              target={primaryGoal.targetAmount}
              progress={goalProgress}
            />
          </GlassPanel>
        )}

        {/* Target Date Card */}
        <GlassPanel glowColor={ThemeColors.goldMetallic} style={styles.targetDateCard}>
          <Text style={styles.targetDateLabel}>ESTIMATED DATE OF FREEDOM</Text>
          <Text style={styles.targetDateIcon}>📅</Text>
          <Text style={styles.targetDateValue}>{targetDate}</Text>
          <Text style={styles.targetDateSubtitle}>
            with ₹{formatINRCompact(realMonthlyContribution)}/mo real SIP & {weightedCagr > 0 ? weightedCagr : '12.0'}% CAGR
          </Text>
        </GlassPanel>

        {/* Real Projection Chart */}
        {chartData.length > 0 && (
          <GlassPanel style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>REAL PROJECTION TIMELINE (15 Years)</Text>
            <Text style={styles.chartSubtitle}>
              Deterministic path based on actual assets & saved SIP
            </Text>
            
            <View onLayout={onContainerLayout} style={styles.chartWrapper}>
              <LineChart
                data={chartData}
                height={200}
                width={chartWidth}
                spacing={chartWidth / (chartData.length - 1 || 1)}
                color={ThemeColors.neonGreen}
                thickness={2.5}
                hideDataPoints
                curved
                curvature={0.25}
                xAxisColor={ThemeColors.borderLight}
                yAxisColor={ThemeColors.borderLight}
                yAxisTextStyle={styles.yAxisLabel}
                backgroundColor="transparent"
                rulesColor={ThemeColors.borderLight}
                rulesType="dashed"
                noOfSections={4}
                yAxisLabelWidth={yAxisLabelWidth}
                formatYLabel={(val: string) => formatINRCompact(Number(val))}
                xAxisLabelsVerticalShift={5}
                areaChart
                startFillColor="rgba(57, 255, 20, 0.15)"
                endFillColor="rgba(57, 255, 20, 0.01)"
                isAnimated
                animationDuration={850}
                pointerConfig={{
                  pointerStripUptoDataPoint: false,
                  pointerStripColor: 'rgba(255, 255, 255, 0.25)',
                  pointerStripWidth: 1.5,
                  strokeDashArray: [4, 4],
                  pointerColor: ThemeColors.neonGreen,
                  pointerLabelWidth: 120,
                  pointerLabelHeight: 50,
                  pointerVanishDelay: 2500,
                  pointerLabelComponent: (items: any[]) => {
                    if (!items || items.length === 0) return null;
                    const year = items[0]?.year || '';
                    const val = items[0]?.value || 0;
                    return (
                      <View style={styles.tooltipContainer}>
                        <Text style={styles.tooltipYear}>{year}</Text>
                        <Text style={styles.tooltipValue}>
                          {formatINRCompact(val)}
                        </Text>
                      </View>
                    );
                  },
                }}
              />
            </View>
          </GlassPanel>
        )}

        {/* Asset Allocation Breakdown */}
        <GlassPanel style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>ASSET ALLOCATION BREAKDOWN</Text>
          <Text style={styles.chartSubtitle}>
            How your portfolio is distributed across buckets
          </Text>

          <View style={styles.allocationList}>
            {allocationStats.stats.map((item) => (
              <View key={item.key} style={styles.allocationRow}>
                <View style={styles.allocationLabelRow}>
                  <Text style={styles.allocationText}>
                    {item.emoji} {item.label}
                  </Text>
                  <Text style={styles.allocationPercentText}>
                    {formatINR(item.value)} ({Math.round(item.percentage)}%)
                  </Text>
                </View>
                {/* Horizontal Progress Bar */}
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${item.percentage}%`, backgroundColor: item.color },
                    ]}
                  />
                </View>
              </View>
            ))}

            {/* Liabilities separate entry */}
            {allocationStats.liabilities > 0 && (
              <View style={styles.allocationRow}>
                <View style={styles.allocationLabelRow}>
                  <Text style={[styles.allocationText, { color: ThemeColors.liabilityRed }]}>
                    🔴 Total Liabilities
                  </Text>
                  <Text style={[styles.allocationPercentText, { color: ThemeColors.liabilityRed }]}>
                    -{formatINR(allocationStats.liabilities)}
                  </Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: '100%', backgroundColor: ThemeColors.liabilityRed },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>
        </GlassPanel>

        {/* Compounding Sandbox Simulator CTA Card */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Simulator')}
          activeOpacity={0.8}
        >
          <GlassPanel glowColor={ThemeColors.neonCyan} style={styles.ctaCard}>
            <View style={styles.ctaRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ctaTitle}>🎛️ Sandbox & Simulator Mode</Text>
                <Text style={styles.ctaDesc}>
                  Play in a What-If sandbox with compounding sliders or simulate historical Indian market events turn-by-turn!
                </Text>
              </View>
              <Text style={styles.ctaArrow}>➔</Text>
            </View>
          </GlassPanel>
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.backgroundStart,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
  },
  screenTitle: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.heading,
    fontWeight: Typography.weight.heavy,
    letterSpacing: Typography.letterSpacing.wide,
    marginBottom: 2,
  },
  screenSubtitle: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.small,
    letterSpacing: Typography.letterSpacing.wider,
    textTransform: 'uppercase',
    marginBottom: Spacing.lg,
  },

  // Net Worth Card
  netWorthCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.base,
  },
  netWorthLabel: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.caption,
    letterSpacing: Typography.letterSpacing.widest,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  netWorthValue: {
    color: ThemeColors.neonGreen,
    fontSize: Typography.size.hero,
    fontWeight: Typography.weight.heavy,
    letterSpacing: Typography.letterSpacing.wide,
    marginBottom: Spacing.xs,
    ...Shadows.glow,
  },
  netWorthCagr: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
  },

  // Section Cards
  sectionCard: {
    marginBottom: Spacing.base,
    padding: Spacing.lg,
  },
  sectionLabel: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.caption,
    letterSpacing: Typography.letterSpacing.widest,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    fontWeight: Typography.weight.bold,
  },
  goalName: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.md,
  },
  chartSubtitle: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.caption,
    marginBottom: Spacing.md,
  },

  // Target Date
  targetDateCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.base,
  },
  targetDateLabel: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.caption,
    letterSpacing: Typography.letterSpacing.widest,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  targetDateIcon: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  targetDateValue: {
    color: ThemeColors.goldMetallic,
    fontSize: Typography.size.title,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
    ...Shadows.goldGlow,
  },
  targetDateSubtitle: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.caption,
    textAlign: 'center',
  },

  // Chart Wrapper
  chartWrapper: {
    width: '100%',
    overflow: 'visible',
    marginTop: Spacing.sm,
  },
  xAxisLabelContainer: {
    width: 40,
    marginLeft: -15,
    alignItems: 'center',
  },
  xAxisLabelText: {
    color: ThemeColors.textMuted,
    fontSize: 8,
    fontWeight: Typography.weight.semibold,
  },
  yAxisLabel: {
    color: ThemeColors.textMuted,
    fontSize: 8,
    fontWeight: Typography.weight.semibold,
    textAlign: 'right',
  },
  tooltipContainer: {
    padding: 6,
    backgroundColor: 'rgba(15, 17, 22, 0.95)',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    width: 80,
    top: -35,
    left: -40,
  },
  tooltipYear: {
    color: ThemeColors.textMuted,
    fontSize: 8,
    fontWeight: Typography.weight.semibold,
    marginBottom: 2,
  },
  tooltipValue: {
    color: ThemeColors.neonGreen,
    fontSize: 9,
    fontWeight: Typography.weight.bold,
  },

  // Asset allocation list
  allocationList: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  allocationRow: {
    gap: Spacing.xs,
  },
  allocationLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allocationText: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.medium,
  },
  allocationPercentText: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },

  // CTA Card
  ctaCard: {
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  ctaTitle: {
    color: ThemeColors.neonCyan,
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.bold,
    marginBottom: 4,
  },
  ctaDesc: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
    lineHeight: 18,
  },
  ctaArrow: {
    color: ThemeColors.neonCyan,
    fontSize: 24,
    fontWeight: Typography.weight.bold,
  },
});

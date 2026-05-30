/**
 * WealthOS — Simulator & Playground Screen
 * 
 * A two-tab segmented interface housing:
 * 1. 🎛️ Sandbox Playground: An interactive What-If compounding sandbox with Monte Carlo chart
 * 2. 🎮 Historical Indian Wealth Game: A turn-based career & market simulator (Ages 22-62)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Layout,
} from 'react-native-reanimated';

import { GlassPanel } from '@/components/GlassPanel';
import ScenarioSlider from '@/components/ScenarioSlider';
import ForecastChart from '@/components/ForecastChart';
import { ThemeColors, Typography, Spacing, BorderRadius, Shadows } from '@/styles/theme';
import { HISTORICAL_TURNS } from '@/data/historicalEvents';
import {
  runMonteCarloSimulation,
  formatINR,
  formatINRCompact,
  solveMilestoneTargetDate,
} from '@/math/engine';
import { HistoricalGameTurn, HistoricalChoice, MonteCarloResult } from '@/types';

type ActiveSegment = 'SANDBOX' | 'GAME';
type AllocationPreset = 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';

export default function SimulatorScreen() {
  const insets = useSafeAreaInsets();
  const [activeSegment, setActiveSegment] = useState<ActiveSegment>('SANDBOX');

  // ============================================================
  // TAB A: SANDBOX STATE
  // ============================================================
  const [startingCapital, setStartingCapital] = useState(500000);
  const [monthlySip, setMonthlySip] = useState(30000);
  const [targetMilestone, setTargetMilestone] = useState(10000000); // 1 Crore default
  const [preset, setPreset] = useState<AllocationPreset>('BALANCED');
  const [inflationRate, setInflationRate] = useState(5.5);
  const [forecast, setForecast] = useState<MonteCarloResult | null>(null);

  // Derive Return (CAGR) and Volatility based on selected simulated Asset Allocation Preset
  const presetConfig = useMemo(() => {
    switch (preset) {
      case 'CONSERVATIVE':
        return { cagr: 8.0, volatility: 0.06, label: '30% Equity / 70% Debt' };
      case 'BALANCED':
        return { cagr: 11.0, volatility: 0.12, label: '60% Equity / 40% Debt' };
      case 'AGGRESSIVE':
        return { cagr: 14.0, volatility: 0.18, label: '85% Equity / 15% Debt' };
    }
  }, [preset]);

  // Recalculate Monte Carlo for Sandbox Playground
  useEffect(() => {
    const timer = setTimeout(() => {
      const result = runMonteCarloSimulation({
        initialPortfolio: startingCapital,
        monthlySip: monthlySip,
        expectedReturn: presetConfig.cagr / 100,
        volatility: presetConfig.volatility,
        years: 20,
        simulations: 150,
      });
      setForecast(result);
    }, 100);

    return () => clearTimeout(timer);
  }, [startingCapital, monthlySip, presetConfig]);

  // Solve target date of freedom in sandbox
  const sandboxTargetDate = useMemo(() => {
    return solveMilestoneTargetDate({
      targetAmount: targetMilestone,
      currentNetWorth: startingCapital,
      monthlyContribution: monthlySip,
      expectedAnnualReturn: presetConfig.cagr / 100,
    });
  }, [targetMilestone, startingCapital, monthlySip, presetConfig]);

  const handleSliderChange = useCallback((setter: (v: number) => void) => (value: number) => {
    setter(value);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }, []);

  // ============================================================
  // TAB B: HISTORICAL GAME STATE
  // ============================================================
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [cashBalance, setCashBalance] = useState(25000);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [salary, setSalary] = useState(25000);
  const [sip, setSip] = useState(5000);
  const [equityAlloc, setEquityAlloc] = useState(0.8);
  const [debtAlloc, setDebtAlloc] = useState(0.2);
  const [selectedChoice, setSelectedChoice] = useState<HistoricalChoice | null>(null);
  const [optimalChoicesCount, setOptimalChoicesCount] = useState(0);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [isGameEnded, setIsGameEnded] = useState(false);
  
  const shakeAnimValue = useSharedValue(0);

  const startNewGame = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsPlaying(true);
    setCurrentTurnIdx(0);
    setCashBalance(25000);
    setPortfolioValue(0);
    setSalary(25000);
    setSip(5000);
    setEquityAlloc(0.8);
    setDebtAlloc(0.2);
    setSelectedChoice(null);
    setOptimalChoicesCount(0);
    setGameHistory([]);
    setIsGameEnded(false);
  };

  const handleChoiceSelect = (choice: HistoricalChoice) => {
    if (selectedChoice) return;
    
    setSelectedChoice(choice);
    if (choice.isOptimal) {
      setOptimalChoicesCount((prev) => prev + 1);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      shakeAnimValue.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  };

  const proceedToNextTurn = () => {
    if (!selectedChoice) return;
    
    const turn = HISTORICAL_TURNS[currentTurnIdx];

    // Under-the-hood compounding calculations
    let newPortfolioValue = portfolioValue;
    
    // Apply choice modifiers (like panic selling which liquidates or shrinks current investments)
    if (selectedChoice.portfolioModifier !== undefined) {
      newPortfolioValue = newPortfolioValue * selectedChoice.portfolioModifier;
    }

    // Allocate current portfolio assets
    let equityPart = newPortfolioValue * equityAlloc;
    let debtPart = newPortfolioValue * debtAlloc;

    // Compound by annual returns
    equityPart = equityPart * (1 + turn.niftyReturn);
    debtPart = debtPart * (1 + turn.fixedReturn);

    // Save cash savings
    let newCashBalance = cashBalance;

    // Compound monthly SIP contribution over the year
    const equitySipAmount = selectedChoice.monthlySip * selectedChoice.equityAllocation * 12;
    const debtSipAmount = selectedChoice.monthlySip * selectedChoice.debtAllocation * 12;
    
    equityPart += equitySipAmount;
    debtPart += debtSipAmount;

    // Calculate leftover salary surplus that goes directly to cash reserves
    const expenses = salary * 0.4 * (1 + turn.inflation); // 40% mandatory expenses
    const annualSurplus = (salary - selectedChoice.monthlySip - (expenses / 12)) * 12;
    newCashBalance += Math.max(0, annualSurplus);

    newPortfolioValue = Math.round(equityPart + debtPart);

    // Record turn details in history
    setGameHistory((prev) => [
      ...prev,
      {
        year: turn.year,
        age: turn.age,
        netWorth: newPortfolioValue + newCashBalance,
        choiceLabel: selectedChoice.label,
        wasOptimal: selectedChoice.isOptimal,
      },
    ]);

    // Apply allocations for next round
    setEquityAlloc(selectedChoice.equityAllocation);
    setDebtAlloc(selectedChoice.debtAllocation);
    setSip(selectedChoice.monthlySip);
    setPortfolioValue(newPortfolioValue);
    setCashBalance(Math.round(newCashBalance));

    // Salary increment
    setSalary((prev) => Math.round(prev * (1 + turn.salaryHikeRate)));

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Check game termination conditions
    const finalNetWorth = newPortfolioValue + newCashBalance;
    if (currentTurnIdx >= HISTORICAL_TURNS.length - 1 || finalNetWorth >= 10000000) {
      setIsGameEnded(true);
    } else {
      setCurrentTurnIdx((prev) => prev + 1);
      setSelectedChoice(null);
    }
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnimValue.value }],
  }));

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Screen Title */}
      <View style={styles.header}>
        <Text style={styles.screenSubtitle}>Simulator</Text>
        <Text style={styles.screenTitle}>Playground & Game</Text>
      </View>

      {/* Segment Selector Pills */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'SANDBOX' && styles.segmentBtnActive]}
          onPress={() => {
            setActiveSegment('SANDBOX');
            if (Platform.OS !== 'web') Haptics.selectionAsync();
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.segmentText, activeSegment === 'SANDBOX' && styles.segmentTextActive]}>
            🎛️ Sandbox Playground
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'GAME' && styles.segmentBtnActive]}
          onPress={() => {
            setActiveSegment('GAME');
            if (Platform.OS !== 'web') Haptics.selectionAsync();
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.segmentText, activeSegment === 'GAME' && styles.segmentTextActive]}>
            🎮 Market Game
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeSegment === 'SANDBOX' ? (
          // ============================================================
          // TAB A: COMPOUNDING SANDBOX PLAYGROUND
          // ============================================================
          <View style={{ gap: Spacing.base }}>
            {/* Target Freedom Card */}
            <GlassPanel glowColor={ThemeColors.goldMetallic} style={styles.targetCard}>
              <Text style={styles.targetLabel}>SANDBOX FREEDOM TARGET</Text>
              <Text style={styles.targetValue}>{sandboxTargetDate}</Text>
              <Text style={styles.targetSubtitle}>
                Target: {formatINRCompact(targetMilestone)} • return: {presetConfig.cagr}%
              </Text>
            </GlassPanel>

            {/* Monte Carlo Fan Chart */}
            {forecast && (
              <GlassPanel style={styles.cardSection}>
                <Text style={styles.sectionTitle}>SANDBOX FORECAST FAN CHART (20 Years)</Text>
                <Text style={styles.sectionSubtitle}>
                  Adjust variables below to morph projection ranges in real time
                </Text>
                <ForecastChart data={forecast} />
              </GlassPanel>
            )}

            {/* Allocation Presets Selector */}
            <GlassPanel style={styles.cardSection}>
              <Text style={styles.sectionTitle}>🎭 SIMULATED ASSET ALLOCATION</Text>
              <Text style={styles.sectionSubtitle}>
                Asset allocation controls your compound CAGR and Monte Carlo volatility
              </Text>

              <View style={styles.presetPills}>
                {(['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'] as AllocationPreset[]).map((p) => {
                  const isActive = preset === p;
                  let color: string = ThemeColors.neonCyan;
                  if (p === 'BALANCED') color = ThemeColors.goldYellow;
                  if (p === 'AGGRESSIVE') color = ThemeColors.neonGreen;

                  return (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.presetPill,
                        isActive && { borderColor: color, backgroundColor: 'rgba(255,255,255,0.06)' },
                      ]}
                      onPress={() => {
                        setPreset(p);
                        if (Platform.OS !== 'web') Haptics.selectionAsync();
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.presetText, isActive && { color, fontWeight: '700' }]}>
                        {p.charAt(0) + p.slice(1).toLowerCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.presetLabelText}>Preset Config: {presetConfig.label}</Text>
            </GlassPanel>

            {/* Sliders Block */}
            <GlassPanel style={styles.cardSection}>
              <Text style={styles.sectionTitle}>🎛️ SANDBOX PLAYGROUND SLIDERS</Text>

              <ScenarioSlider
                label="Starting Capital"
                value={startingCapital}
                min={50000}
                max={2000000}
                step={50000}
                formatValue={(v) => formatINRCompact(v)}
                onValueChange={handleSliderChange(setStartingCapital)}
                accentColor={ThemeColors.neonCyan}
              />

              <ScenarioSlider
                label="Monthly SIP contribution"
                value={monthlySip}
                min={5000}
                max={200000}
                step={5000}
                formatValue={(v) => formatINRCompact(v)}
                onValueChange={handleSliderChange(setMonthlySip)}
                accentColor={ThemeColors.neonGreen}
              />

              <ScenarioSlider
                label="Target Milestone Corpus"
                value={targetMilestone}
                min={1000000}
                max={50000000}
                step={1000000}
                formatValue={(v) => formatINRCompact(v)}
                onValueChange={handleSliderChange(setTargetMilestone)}
                accentColor={ThemeColors.goldMetallic}
              />

              <ScenarioSlider
                label="Simulated Inflation Rate"
                value={inflationRate}
                min={3.0}
                max={10.0}
                step={0.5}
                formatValue={(v) => `${v}%`}
                onValueChange={handleSliderChange(setInflationRate)}
                accentColor={ThemeColors.neonAmber}
              />
            </GlassPanel>
          </View>
        ) : (
          // ============================================================
          // TAB B: HISTORICAL INDIAN WEALTH GAME
          // ============================================================
          <View style={{ gap: Spacing.base }}>
            {!isPlaying ? (
              // Game Landing Screen
              <GlassPanel glowColor={ThemeColors.neonCyan} style={styles.landingCard}>
                <Text style={styles.landingIcon}>🎮</Text>
                <Text style={styles.landingTitle}>Historical Indian Wealth Game</Text>
                <Text style={styles.landingDesc}>
                  Step into a year-by-year micro-simulation starting in the **year 2000**.
                  {"\n\n"}
                  Start as a fresh graduate earning **₹25,000/month**. Experience historical market panics, economic V-shaped recovery sprints, demonetization, and pandemic cascades.
                  {"\n\n"}
                  Make active career, asset allocation, and spending choices. **Can you hit ₹1 Crore before Age 60?**
                </Text>

                <TouchableOpacity style={styles.startGameBtn} onPress={startNewGame} activeOpacity={0.8}>
                  <Text style={styles.startGameText}>🚀 Start Journey Game</Text>
                </TouchableOpacity>
              </GlassPanel>
            ) : isGameEnded ? (
              // Victory / Ending Certificate Summary Card
              <GlassPanel glowColor={ThemeColors.goldMetallic} style={styles.victoryCard}>
                <Text style={styles.victoryEmoji}>🏆</Text>
                <Text style={styles.victoryTitle}>Simulation Finished!</Text>
                
                <View style={styles.certificateBox}>
                  <Text style={styles.certLabel}>WEALTHOS LAUREATE</Text>
                  <Text style={styles.certSublabel}>Financial Literacy Certificate</Text>
                  
                  <View style={styles.certDivider} />
                  
                  <View style={styles.certRow}>
                    <Text style={styles.certTextLeft}>Ending Net Worth:</Text>
                    <Text style={styles.certTextRight}>{formatINR(cashBalance + portfolioValue)}</Text>
                  </View>
                  <View style={styles.certRow}>
                    <Text style={styles.certTextLeft}>Finished at Age:</Text>
                    <Text style={styles.certTextRight}>{HISTORICAL_TURNS[currentTurnIdx]?.age || 50}</Text>
                  </View>
                  <View style={styles.certRow}>
                    <Text style={styles.certTextLeft}>Optimal Choices Made:</Text>
                    <Text style={[styles.certTextRight, { color: ThemeColors.neonGreen }]}>
                      {optimalChoicesCount} / {HISTORICAL_TURNS.length}
                    </Text>
                  </View>
                  
                  <Text style={styles.certFooter}>Certified Offline-First Compounder</Text>
                </View>

                {/* Score Commentary */}
                <Text style={styles.commentaryText}>
                  {optimalChoicesCount >= 6
                    ? `Master class! Your stellar discipline during market crashes like 2008 and 2020 has secured a massive early freedom nest egg.`
                    : `Good effort! However, panic selling or low-yield endowment plans acted as a massive return drag. Try again to maximize index compounding!`}
                </Text>

                <TouchableOpacity style={styles.restartBtn} onPress={startNewGame} activeOpacity={0.8}>
                  <Text style={styles.restartBtnText}>🔄 Reset and Replay</Text>
                </TouchableOpacity>
              </GlassPanel>
            ) : (
              // Active Year Screen
              <Animated.View style={[shakeStyle, { gap: Spacing.base }]}>
                {/* Stats Dashboard */}
                <GlassPanel style={styles.gameStatsCard}>
                  <View style={styles.statsGrid}>
                    <View style={styles.statCell}>
                      <Text style={styles.statLabel}>YEAR</Text>
                      <Text style={styles.statValue}>{HISTORICAL_TURNS[currentTurnIdx].year}</Text>
                    </View>
                    <View style={styles.statCell}>
                      <Text style={styles.statLabel}>AGE</Text>
                      <Text style={styles.statValue}>{HISTORICAL_TURNS[currentTurnIdx].age}</Text>
                    </View>
                    <View style={styles.statCell}>
                      <Text style={styles.statLabel}>MONTHLY SALARY</Text>
                      <Text style={styles.statValue}>{formatINRCompact(salary)}</Text>
                    </View>
                  </View>

                  <View style={styles.netWorthRow}>
                    <Text style={styles.nwLabel}>CURRENT NET WORTH</Text>
                    <Text style={styles.nwValue}>{formatINR(cashBalance + portfolioValue)}</Text>
                    <Text style={styles.nwSub}>
                      Portfolio: {formatINRCompact(portfolioValue)} • Reserves: {formatINRCompact(cashBalance)}
                    </Text>
                  </View>
                </GlassPanel>

                {/* Economic Event Card */}
                <GlassPanel glowColor={ThemeColors.neonCyan} style={styles.eventCard}>
                  <View style={styles.eventBadge}>
                    <Text style={styles.eventBadgeText}>ECONOMY FLASH</Text>
                  </View>
                  <Text style={styles.eventTitle}>{HISTORICAL_TURNS[currentTurnIdx].eventTitle}</Text>
                  <Text style={styles.eventDescription}>
                    {HISTORICAL_TURNS[currentTurnIdx].eventDescription}
                  </Text>
                </GlassPanel>

                {/* Choice Dilemma */}
                <GlassPanel style={styles.dilemmaCard}>
                  <Text style={styles.choiceQuestion}>{HISTORICAL_TURNS[currentTurnIdx].choiceQuestion}</Text>

                  <View style={styles.choicesList}>
                    {(['A', 'B', 'C'] as const).map((key) => {
                      const choice = HISTORICAL_TURNS[currentTurnIdx].choices[key];
                      if (!choice) return null;

                      const isSelected = selectedChoice?.label === choice.label;
                      let btnStyle = {};
                      let textStyle = {};

                      if (selectedChoice) {
                        if (choice.isOptimal) {
                          btnStyle = styles.choiceBtnCorrect;
                          textStyle = styles.choiceTextCorrect;
                        } else if (isSelected) {
                          btnStyle = styles.choiceBtnWrong;
                          textStyle = styles.choiceTextWrong;
                        } else {
                          btnStyle = styles.choiceBtnDisabled;
                        }
                      }

                      return (
                        <TouchableOpacity
                          key={key}
                          style={[styles.choiceBtn, btnStyle]}
                          onPress={() => handleChoiceSelect(choice)}
                          disabled={selectedChoice !== null}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.choiceLabelText, textStyle]}>
                            {choice.label}
                          </Text>
                          <Text style={styles.choiceDescText}>{choice.description}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Outcome Reveal Section */}
                  {selectedChoice && (
                    <View style={styles.outcomeContainer}>
                      <Text style={styles.outcomeTitle}>
                        {selectedChoice.isOptimal ? '✅ EXCELLENT CHOICE!' : '⚠️ COMPROMISED RETURN'}
                      </Text>
                      <Text style={styles.outcomeImpactText}>{selectedChoice.impactText}</Text>
                      
                      <View style={styles.lessonBox}>
                        <Text style={styles.lessonTitle}>📚 Wealth Note Lesson</Text>
                        <Text style={styles.lessonText}>{HISTORICAL_TURNS[currentTurnIdx].lesson}</Text>
                      </View>

                      <TouchableOpacity style={styles.nextTurnBtn} onPress={proceedToNextTurn} activeOpacity={0.8}>
                        <Text style={styles.nextTurnText}>
                          {currentTurnIdx >= HISTORICAL_TURNS.length - 1 ? 'Finish Simulation ➔' : `Proceed to Year ${HISTORICAL_TURNS[currentTurnIdx + 1].year} ➔`}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </GlassPanel>
              </Animated.View>
            )}
          </View>
        )}

        <View style={{ height: 120 }} />
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
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  screenTitle: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.heading,
    fontWeight: Typography.weight.heavy,
    letterSpacing: Typography.letterSpacing.wide,
  },
  screenSubtitle: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.small,
    letterSpacing: Typography.letterSpacing.wider,
    textTransform: 'uppercase',
    marginBottom: 2,
  },

  // Segment Selector
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: ThemeColors.frostedPanelLight,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadows.glow,
    shadowColor: ThemeColors.neonCyan,
    shadowOpacity: 0.1,
  },
  segmentText: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.medium,
  },
  segmentTextActive: {
    color: ThemeColors.textPrimary,
    fontWeight: Typography.weight.bold,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },

  // Target Card
  targetCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  targetLabel: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.caption,
    letterSpacing: Typography.letterSpacing.widest,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  targetValue: {
    color: ThemeColors.goldMetallic,
    fontSize: Typography.size.title,
    fontWeight: Typography.weight.bold,
    ...Shadows.goldGlow,
  },
  targetSubtitle: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.caption,
    marginTop: 4,
  },

  // Sandbox section cards
  cardSection: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.caption,
    letterSpacing: Typography.letterSpacing.widest,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
    fontWeight: Typography.weight.bold,
  },
  sectionSubtitle: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.caption,
    marginBottom: Spacing.md,
  },

  // Presets selector
  presetPills: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  presetPill: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  presetText: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
  },
  presetLabelText: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.caption,
  },

  // Game landing card
  landingCard: {
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  landingIcon: {
    fontSize: 54,
  },
  landingTitle: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.title,
    fontWeight: Typography.weight.bold,
    textAlign: 'center',
  },
  landingDesc: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.body,
    lineHeight: 22,
    textAlign: 'center',
  },
  startGameBtn: {
    backgroundColor: ThemeColors.frostedPanelLight,
    borderWidth: 1,
    borderColor: ThemeColors.neonCyan,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    alignItems: 'center',
    marginTop: Spacing.base,
    ...Shadows.glow,
    shadowColor: ThemeColors.neonCyan,
  },
  startGameText: {
    color: ThemeColors.neonCyan,
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.bold,
  },

  // Game active stats card
  gameStatsCard: {
    padding: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCell: {
    alignItems: 'center',
  },
  statLabel: {
    color: ThemeColors.textMuted,
    fontSize: 9,
    fontWeight: Typography.weight.bold,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    color: ThemeColors.textPrimary,
    fontSize: 16,
    fontWeight: Typography.weight.bold,
  },
  netWorthRow: {
    alignItems: 'center',
  },
  nwLabel: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.caption,
    fontWeight: Typography.weight.semibold,
    letterSpacing: Typography.letterSpacing.widest,
    marginBottom: 4,
  },
  nwValue: {
    color: ThemeColors.neonGreen,
    fontSize: Typography.size.title,
    fontWeight: Typography.weight.heavy,
    ...Shadows.glow,
  },
  nwSub: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.caption,
    marginTop: 2,
  },

  // Economy event card
  eventCard: {
    padding: Spacing.lg,
  },
  eventBadge: {
    backgroundColor: 'rgba(0, 255, 255, 0.12)',
    borderColor: ThemeColors.neonCyan,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingVertical: 2,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  eventBadgeText: {
    color: ThemeColors.neonCyan,
    fontSize: 9,
    fontWeight: Typography.weight.bold,
  },
  eventTitle: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
  },
  eventDescription: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.body,
    lineHeight: 20,
  },

  // Choice Dilemma Card
  dilemmaCard: {
    padding: Spacing.lg,
  },
  choiceQuestion: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.semibold,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  choicesList: {
    gap: Spacing.md,
  },
  choiceBtn: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  choiceBtnCorrect: {
    borderColor: ThemeColors.neonGreen,
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
  },
  choiceBtnWrong: {
    borderColor: ThemeColors.liabilityRed,
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
  },
  choiceBtnDisabled: {
    opacity: 0.5,
  },
  choiceLabelText: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.bold,
    marginBottom: 2,
  },
  choiceTextCorrect: {
    color: ThemeColors.neonGreen,
  },
  choiceTextWrong: {
    color: ThemeColors.liabilityRed,
  },
  choiceDescText: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
    lineHeight: 16,
  },

  // Outcome Reveal
  outcomeContainer: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    gap: Spacing.md,
  },
  outcomeTitle: {
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.bold,
    color: ThemeColors.textPrimary,
  },
  outcomeImpactText: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.body,
    lineHeight: 20,
  },
  lessonBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderLeftWidth: 4,
    borderLeftColor: ThemeColors.neonCyan,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  lessonTitle: {
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.bold,
    color: ThemeColors.neonCyan,
    marginBottom: 4,
  },
  lessonText: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
    lineHeight: 18,
  },
  nextTurnBtn: {
    backgroundColor: ThemeColors.frostedPanelLight,
    borderWidth: 1,
    borderColor: ThemeColors.neonGreen,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
    ...Shadows.glow,
  },
  nextTurnText: {
    color: ThemeColors.neonGreen,
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.bold,
  },

  // Victory / Ending Card
  victoryCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  victoryEmoji: {
    fontSize: 54,
  },
  victoryTitle: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.title,
    fontWeight: Typography.weight.bold,
    textAlign: 'center',
  },
  certificateBox: {
    width: '100%',
    backgroundColor: 'rgba(25, 20, 15, 0.9)',
    borderColor: ThemeColors.goldMetallic,
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginVertical: Spacing.md,
    ...Shadows.goldGlow,
  },
  certLabel: {
    color: ThemeColors.goldMetallic,
    fontSize: Typography.size.caption,
    fontWeight: Typography.weight.bold,
    letterSpacing: Typography.letterSpacing.widest,
    marginBottom: 2,
  },
  certSublabel: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.md,
  },
  certDivider: {
    width: '60%',
    height: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    marginBottom: Spacing.md,
  },
  certRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 4,
  },
  certTextLeft: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.small,
  },
  certTextRight: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.bold,
  },
  certFooter: {
    color: ThemeColors.textMuted,
    fontSize: 9,
    fontWeight: Typography.weight.semibold,
    letterSpacing: 1.0,
    marginTop: Spacing.lg,
    textTransform: 'uppercase',
  },
  commentaryText: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.body,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
  },
  restartBtn: {
    backgroundColor: ThemeColors.frostedPanelLight,
    borderWidth: 1,
    borderColor: ThemeColors.goldMetallic,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadows.goldGlow,
  },
  restartBtnText: {
    color: ThemeColors.goldMetallic,
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.bold,
  },
});

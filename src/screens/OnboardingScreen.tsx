/**
 * WealthOS — Onboarding Screen
 * 
 * 4-step premium onboarding flow:
 * 1. Privacy Pledge & Welcome
 * 2. Choose Freedom Milestone
 * 3. Quick Capital Sliders
 * 4. Emotional Reveal (Target Date)
 * 
 * Eliminates cold ₹0 empty-state by bootstrapping MMKV with user inputs.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { GlassPanel } from '@/components/GlassPanel';
import { ThemeColors, Typography, Spacing, BorderRadius, Shadows } from '@/styles/theme';
import { bootstrapInitialProfile } from '@/services/storage';
import { solveMilestoneTargetDate, formatINR, formatINRCompact } from '@/math/engine';
import { MilestoneType } from '@/types';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================
// MILESTONE OPTIONS
// ============================================================
const MILESTONES: {
  type: MilestoneType;
  emoji: string;
  title: string;
  subtitle: string;
  target: number;
  color: string;
}[] = [
  {
    type: 'ONE_CRORE',
    emoji: '💰',
    title: '₹1 Crore Club',
    subtitle: 'The classic Indian wealth milestone',
    target: 10000000,
    color: ThemeColors.goldMetallic,
  },
  {
    type: 'FIRE',
    emoji: '🏖️',
    title: 'Full FIRE',
    subtitle: 'Complete financial independence, no job needed',
    target: 25000000,
    color: ThemeColors.neonGreen,
  },
  {
    type: 'BARISTA',
    emoji: '☕',
    title: 'BaristaFIRE',
    subtitle: 'Quit corporate stress, work your passion',
    target: 12000000,
    color: ThemeColors.neonCyan,
  },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);

  // User selections
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneType | null>(null);

  const [customTargets, setCustomTargets] = useState<Record<MilestoneType, number>>({
    ONE_CRORE: 10000000,
    FIRE: 25000000,
    BARISTA: 12000000,
  });
  const [customTargetText, setCustomTargetText] = useState('');

  const [lumpSum, setLumpSum] = useState(200000); // ₹2L default
  const [lumpSumText, setLumpSumText] = useState('200000');

  const [monthlySip, setMonthlySip] = useState(20000); // ₹20K default
  const [monthlySipText, setMonthlySipText] = useState('20000');

  const [expectedCagr, setExpectedCagr] = useState(12); // 12% default
  const [expectedCagrText, setExpectedCagrText] = useState('12');

  // Computed target date
  const milestoneConfig = MILESTONES.find((m) => m.type === selectedMilestone);
  const targetAmountValue = selectedMilestone ? customTargets[selectedMilestone] : 10000000;

  const targetDate = selectedMilestone
    ? solveMilestoneTargetDate({
        targetAmount: targetAmountValue,
        currentNetWorth: lumpSum,
        monthlyContribution: monthlySip,
        expectedAnnualReturn: expectedCagr / 100,
      })
    : '';

  const progress = selectedMilestone
    ? Math.min(100, (lumpSum / targetAmountValue) * 100)
    : 0;

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleNext = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setStep((s) => s + 1);
  }, []);

  const handleMilestoneSelect = useCallback((type: MilestoneType) => {
    setSelectedMilestone(type);
    setCustomTargetText(customTargets[type].toString());
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [customTargets]);

  const handleFinish = useCallback(() => {
    if (!selectedMilestone) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const finalTarget = customTargets[selectedMilestone];

    // Bootstrap MMKV with user's custom inputs
    bootstrapInitialProfile(selectedMilestone, lumpSum, monthlySip, expectedCagr, finalTarget);

    // Transition to main app
    onComplete();
  }, [selectedMilestone, lumpSum, monthlySip, expectedCagr, customTargets, onComplete]);

  const adjustLumpSum = useCallback(
    (delta: number) => {
      const nextVal = Math.min(50000000, Math.max(0, lumpSum + delta));
      setLumpSum(nextVal);
      setLumpSumText(nextVal.toString());
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
    },
    [lumpSum]
  );

  const adjustMonthlySip = useCallback(
    (delta: number) => {
      const nextVal = Math.min(500000, Math.max(0, monthlySip + delta));
      setMonthlySip(nextVal);
      setMonthlySipText(nextVal.toString());
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
    },
    [monthlySip]
  );

  const adjustExpectedCagr = useCallback(
    (delta: number) => {
      const nextVal = Math.min(30, Math.max(1, expectedCagr + delta));
      const rounded = Math.round(nextVal * 10) / 10;
      setExpectedCagr(rounded);
      setExpectedCagrText(rounded.toString());
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
    },
    [expectedCagr]
  );

  // ============================================================
  // STEP RENDERS
  // ============================================================
  const renderStep = () => {
    switch (step) {
      case 0:
        return renderPrivacyPledge();
      case 1:
        return renderMilestoneChoice();
      case 2:
        return renderCapitalSliders();
      case 3:
        return renderReveal();
      default:
        return null;
    }
  };

  // Step 1: Privacy Pledge
  const renderPrivacyPledge = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.welcomeLogo}>WealthOS</Text>
      <Text style={styles.welcomeTagline}>Your Money. Strictly Private.</Text>

      <GlassPanel style={styles.pledgeCard} glowColor={ThemeColors.neonGreen}>
        <Text style={styles.pledgeIcon}>🔒</Text>
        <Text style={styles.pledgeTitle}>Zero Databases</Text>
        <Text style={styles.pledgeText}>
          We have zero databases. No accounts. No SMS trackers.{'\n\n'}
          Your financial records are locked locally inside your device.{'\n\n'}
          Not even our developers can see your net worth.
        </Text>
      </GlassPanel>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleNext}
        activeOpacity={0.7}
      >
        <Text style={styles.primaryButtonText}>I Accept & Value Privacy</Text>
      </TouchableOpacity>
    </View>
  );

  // Step 2: Milestone Choice
  const renderMilestoneChoice = () => {
    const selectedColor = milestoneConfig?.color ?? ThemeColors.goldMetallic;
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Choose Your Freedom</Text>
        <Text style={styles.stepSubtitle}>
          What's your primary wealth goal?
        </Text>

        <View style={styles.milestoneGrid}>
          {MILESTONES.map((milestone) => (
            <TouchableOpacity
              key={milestone.type}
              onPress={() => handleMilestoneSelect(milestone.type)}
              activeOpacity={0.7}
            >
              <GlassPanel
                style={[
                  styles.milestoneCard,
                  selectedMilestone === milestone.type && {
                    borderColor: milestone.color,
                    borderWidth: 2,
                  },
                ]}
                glowColor={
                  selectedMilestone === milestone.type ? milestone.color : undefined
                }
              >
                <Text style={styles.milestoneEmoji}>{milestone.emoji}</Text>
                <Text style={[styles.milestoneTitle, { color: milestone.color }]}>
                  {milestone.title}
                </Text>
                <Text style={styles.milestoneSubtitle}>{milestone.subtitle}</Text>
                <Text style={[styles.milestoneTarget, { color: milestone.color }]}>
                  {formatINRCompact(customTargets[milestone.type])}
                </Text>
              </GlassPanel>
            </TouchableOpacity>
          ))}
        </View>

        {selectedMilestone && (
          <GlassPanel style={styles.customTargetCard} glowColor={selectedColor}>
            <Text style={styles.sliderLabel}>Customize Milestone Target Amount</Text>
            <View style={styles.inputContainer}>
              <Text style={[styles.currencyPrefix, { color: selectedColor }]}>₹</Text>
              <TextInput
                style={[styles.numericInput, { color: selectedColor }]}
                value={customTargetText}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '');
                  setCustomTargetText(cleaned);
                  const val = parseInt(cleaned, 10);
                  if (!isNaN(val)) {
                    setCustomTargets((prev) => ({
                      ...prev,
                      [selectedMilestone]: val,
                    }));
                  }
                }}
                keyboardType="number-pad"
                placeholder="1,00,00,000"
                placeholderTextColor="rgba(255,255,255,0.2)"
                selectTextOnFocus
              />
            </View>
            <Text style={styles.formattedSmall}>
              {formatINR(customTargets[selectedMilestone])}
            </Text>
          </GlassPanel>
        )}

        {selectedMilestone && (
          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: Spacing.xl }]}
            onPress={handleNext}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryButtonText}>Next: Capital Setup ➔</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Step 3: Capital Sliders
  const renderCapitalSliders = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Quick Capital Setup</Text>
      <Text style={styles.stepSubtitle}>
        Takes 10 seconds. No bank linking required.
      </Text>

      {/* Lump Sum */}
      <GlassPanel style={styles.sliderCard}>
        <Text style={styles.sliderLabel}>My Current Savings (Lump Sum)</Text>
        <View style={styles.inputContainer}>
          <Text style={[styles.currencyPrefix, { color: ThemeColors.neonGreen }]}>₹</Text>
          <TextInput
            style={[styles.numericInput, { color: ThemeColors.neonGreen }]}
            value={lumpSumText}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9]/g, '');
              setLumpSumText(cleaned);
              const val = parseInt(cleaned, 10);
              setLumpSum(isNaN(val) ? 0 : val);
            }}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="rgba(255,255,255,0.2)"
            selectTextOnFocus
          />
        </View>
        <Text style={styles.formattedSmall}>
          {formatINR(lumpSum)}
        </Text>
        <View style={styles.sliderButtons}>
          <TouchableOpacity
            style={styles.sliderBtn}
            onPress={() => adjustLumpSum(-50000)}
          >
            <Text style={styles.sliderBtnText}>−₹50K</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sliderBtn}
            onPress={() => adjustLumpSum(50000)}
          >
            <Text style={styles.sliderBtnText}>+₹50K</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sliderBtn}
            onPress={() => adjustLumpSum(500000)}
          >
            <Text style={styles.sliderBtnText}>+₹5L</Text>
          </TouchableOpacity>
        </View>
      </GlassPanel>

      {/* Monthly SIP */}
      <GlassPanel style={styles.sliderCard}>
        <Text style={styles.sliderLabel}>My Monthly Additions (SIP)</Text>
        <View style={styles.inputContainer}>
          <Text style={[styles.currencyPrefix, { color: ThemeColors.neonCyan }]}>₹</Text>
          <TextInput
            style={[styles.numericInput, { color: ThemeColors.neonCyan }]}
            value={monthlySipText}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9]/g, '');
              setMonthlySipText(cleaned);
              const val = parseInt(cleaned, 10);
              setMonthlySip(isNaN(val) ? 0 : val);
            }}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="rgba(255,255,255,0.2)"
            selectTextOnFocus
          />
          <Text style={styles.inputSuffix}>/mo</Text>
        </View>
        <Text style={styles.formattedSmall}>
          {formatINR(monthlySip)}/month
        </Text>
        <View style={styles.sliderButtons}>
          <TouchableOpacity
            style={styles.sliderBtn}
            onPress={() => adjustMonthlySip(-2000)}
          >
            <Text style={styles.sliderBtnText}>−₹2K</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sliderBtn}
            onPress={() => adjustMonthlySip(5000)}
          >
            <Text style={styles.sliderBtnText}>+₹5K</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sliderBtn}
            onPress={() => adjustMonthlySip(10000)}
          >
            <Text style={styles.sliderBtnText}>+₹10K</Text>
          </TouchableOpacity>
        </View>
      </GlassPanel>

      {/* Expected Return (CAGR) */}
      <GlassPanel style={styles.sliderCard}>
        <Text style={styles.sliderLabel}>Expected Return (CAGR)</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.numericInput, { color: ThemeColors.goldMetallic }]}
            value={expectedCagrText}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9.]/g, '');
              const parts = cleaned.split('.');
              const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
              setExpectedCagrText(formatted);
              const val = parseFloat(formatted);
              if (!isNaN(val)) {
                setExpectedCagr(val);
              }
            }}
            keyboardType="decimal-pad"
            placeholder="12"
            placeholderTextColor="rgba(255,255,255,0.2)"
            selectTextOnFocus
          />
          <Text style={[styles.inputSuffix, { color: ThemeColors.goldMetallic }]}>%</Text>
        </View>
        <Text style={styles.formattedSmall}>
          Annual compounding rate
        </Text>
        <View style={styles.sliderButtons}>
          <TouchableOpacity
            style={styles.sliderBtn}
            onPress={() => adjustExpectedCagr(-0.5)}
          >
            <Text style={styles.sliderBtnText}>−0.5%</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sliderBtn}
            onPress={() => adjustExpectedCagr(0.5)}
          >
            <Text style={styles.sliderBtnText}>+0.5%</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sliderBtn}
            onPress={() => adjustExpectedCagr(1.0)}
          >
            <Text style={styles.sliderBtnText}>+1.0%</Text>
          </TouchableOpacity>
        </View>
      </GlassPanel>

      <TouchableOpacity
        style={[styles.primaryButton, { marginTop: Spacing.md }]}
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          }
          setStep(3);
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.primaryButtonText}>Solve My Timeline</Text>
      </TouchableOpacity>
    </View>
  );

  // Step 4: The Emotional Reveal
  const renderReveal = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.revealSubtext}>Your estimated target date</Text>

      <GlassPanel glowColor={ThemeColors.goldMetallic} style={styles.revealCard}>
        <Text style={styles.revealIcon}>📅</Text>
        <Text style={styles.revealDate}>{targetDate}</Text>
        <Text style={styles.revealGoal}>
          {milestoneConfig?.title ?? 'Your Goal'}
        </Text>
      </GlassPanel>

      {/* Progress */}
      <GlassPanel style={styles.progressCard} variant="subtle">
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {formatINRCompact(lumpSum)} / {formatINRCompact(targetAmountValue)}{' '}
          ({progress.toFixed(1)}% completed)
        </Text>
      </GlassPanel>

      <Text style={styles.revealEncouragement}>
        With {formatINRCompact(monthlySip)}/month at {expectedCagr}% CAGR, your wealth will
        compound exponentially. The real magic happens after year 10.
      </Text>

      <TouchableOpacity
        style={[styles.primaryButton, styles.enterButton]}
        onPress={handleFinish}
        activeOpacity={0.7}
      >
        <Text style={styles.primaryButtonText}>Enter My Dashboard 🚀</Text>
      </TouchableOpacity>
    </View>
  );

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                i === step && styles.stepDotActive,
                i < step && styles.stepDotCompleted,
              ]}
            />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: Spacing.xxl,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ThemeColors.frostedPanel,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  stepDotActive: {
    backgroundColor: ThemeColors.neonGreen,
    borderColor: ThemeColors.neonGreen,
    width: 24,
    ...Shadows.glow,
  },
  stepDotCompleted: {
    backgroundColor: ThemeColors.textMuted,
    borderColor: ThemeColors.textMuted,
  },

  stepContainer: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },

  // Step 1 — Privacy
  welcomeLogo: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.display,
    fontWeight: Typography.weight.heavy,
    letterSpacing: Typography.letterSpacing.wider,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  welcomeTagline: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.bodyLarge,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    fontStyle: 'italic',
  },
  pledgeCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  pledgeIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  pledgeTitle: {
    color: ThemeColors.neonGreen,
    fontSize: Typography.size.title,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.md,
  },
  pledgeText: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.body,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Step 2 — Milestones
  stepTitle: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.heading,
    fontWeight: Typography.weight.bold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  stepSubtitle: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  milestoneGrid: {
    gap: Spacing.md,
  },
  milestoneCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.base,
  },
  milestoneEmoji: {
    fontSize: 36,
    marginBottom: Spacing.sm,
  },
  milestoneTitle: {
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
  },
  milestoneSubtitle: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  milestoneTarget: {
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.semibold,
  },

  // Step 3 — Sliders & Editable Inputs
  sliderCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  sliderLabel: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.small,
    letterSpacing: Typography.letterSpacing.wide,
    marginBottom: Spacing.sm,
  },
  sliderButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  sliderBtn: {
    flex: 1,
    backgroundColor: ThemeColors.frostedPanelLight,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  sliderBtnText: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.medium,
  },

  // Custom Editable Field Additions
  customTargetCard: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : 0,
    marginBottom: Spacing.xs,
  },
  currencyPrefix: {
    fontSize: Typography.size.title,
    fontWeight: Typography.weight.bold,
    marginRight: Spacing.xs,
  },
  inputSuffix: {
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.semibold,
    color: ThemeColors.textMuted,
    marginLeft: Spacing.xs,
  },
  numericInput: {
    flex: 1,
    fontSize: Typography.size.title,
    fontWeight: Typography.weight.bold,
    paddingVertical: Spacing.sm,
  },
  formattedSmall: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },

  // Step 4 — Reveal
  revealSubtext: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.body,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.widest,
    marginBottom: Spacing.xl,
  },
  revealCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  revealIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  revealDate: {
    color: ThemeColors.goldMetallic,
    fontSize: Typography.size.hero,
    fontWeight: Typography.weight.heavy,
    marginBottom: Spacing.sm,
    ...Shadows.goldGlow,
  },
  revealGoal: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.body,
  },
  progressCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: ThemeColors.goldMetallic,
    borderRadius: BorderRadius.full,
    minWidth: 4,
  },
  progressText: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
    textAlign: 'center',
  },
  revealEncouragement: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.small,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },

  // Buttons
  primaryButton: {
    backgroundColor: ThemeColors.frostedPanel,
    borderWidth: 1,
    borderColor: ThemeColors.goldMetallic,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  enterButton: {
    borderColor: ThemeColors.neonGreen,
    backgroundColor: 'rgba(57, 255, 20, 0.08)',
  },
  primaryButtonText: {
    color: ThemeColors.goldMetallic,
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.semibold,
  },
});

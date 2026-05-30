import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { GlassPanel } from '@/components/GlassPanel';
import ScenarioSlider from '@/components/ScenarioSlider';
import { ThemeColors, Typography, Spacing, BorderRadius, Shadows } from '@/styles/theme';
import { BASELINE_NOTES, BASELINE_QUIZ } from '@/data/wealthNotes';
import {
  getBookmarkedNotes,
  toggleBookmarkNote,
  isProUser,
  setProUser,
  storage,
} from '@/services/storage';
import { calculateSwp, formatINR, formatINRCompact } from '@/math/engine';
import { WealthNote, QuizQuestion } from '@/types';

// Category color mappings
const CATEGORY_COLORS: Record<string, string> = {
  basics: ThemeColors.neonCyan,
  strategy: ThemeColors.neonGreen,
  trap: ThemeColors.liabilityRed,
  tax: ThemeColors.goldMetallic,
};

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'basics', label: 'Basics' },
  { key: 'strategy', label: 'Strategies' },
  { key: 'trap', label: 'Traps' },
  { key: 'tax', label: 'Tax' },
  { key: 'bookmarked', label: '⭐️ Saved' },
];

type MainSegment = 'WISDOM' | 'CALCULATORS';
type CalculatorType = 'SIP' | 'CAGR' | 'SWP' | 'FIRE' | null;

export default function LearnScreen() {
  const insets = useSafeAreaInsets();

  // Segment Navigation
  const [activeSegment, setActiveSegment] = useState<MainSegment>('WISDOM');
  const [activeCalc, setActiveCalc] = useState<CalculatorType>(null);

  // Pro status state (simulated freemium toggle)
  const [isPremium, setIsPremium] = useState(false);

  // ============================================================
  // WISDOM HUB STATE
  // ============================================================
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [quizQuestion, setQuizQuestion] = useState<QuizQuestion | null>(null);
  const [selectedQuizIdx, setSelectedQuizIdx] = useState<number | null>(null);
  const [isQuizAnswered, setIsQuizAnswered] = useState(false);
  const quizShakeOffset = useSharedValue(0);

  // ============================================================
  // CALCULATORS STATE
  // ============================================================
  // 1. SIP Step-Up Calculator
  const [sipLumpSum, setSipLumpSum] = useState('200000');
  const [sipMonthly, setSipMonthly] = useState('15000');
  const [sipCagr, setSipCagr] = useState('12.0');
  const [sipYears, setSipYears] = useState('15');
  const [sipStepUp, setSipStepUp] = useState('10'); // 10% annual increase

  // 2. CAGR Solver
  const [cagrInitial, setCagrInitial] = useState('100000');
  const [cagrFinal, setCagrFinal] = useState('300000');
  const [cagrYears, setCagrYears] = useState('5');

  // 3. SWP Retirement Survival Calculator
  const [swpCorpus, setSwpCorpus] = useState('5000000'); // ₹50 Lakhs
  const [swpWithdrawal, setSwpWithdrawal] = useState('30000'); // ₹30k/mo
  const [swpReturn, setSwpReturn] = useState('8.0'); // 8% expected conservative return
  const [swpYears, setSwpYears] = useState('20');
  const [swpInflation, setSwpInflation] = useState(true);

  // 4. BaristaFIRE Mental Retirement Calculator
  const [fireExpenses, setFireExpenses] = useState('50000'); // ₹50k/mo expenses
  const [fireSideIncome, setFireSideIncome] = useState('20000'); // ₹20k/mo part time side income
  const [fireInvestments, setFireInvestments] = useState('1500000'); // ₹15 Lakhs current nest egg
  const [fireAge, setFireAge] = useState('30');
  const [fireRetireAge, setFireRetireAge] = useState('55');
  const [fireSWR, setFireSWR] = useState('4.0'); // 4% SWR default

  // Load MMKV storage states
  useEffect(() => {
    setBookmarks(getBookmarkedNotes());
    setIsPremium(isProUser());

    // Select daily quiz question based on today's calendar day
    const day = new Date().getDate();
    const idx = day % BASELINE_QUIZ.length;
    setQuizQuestion(BASELINE_QUIZ[idx] || null);

    // Setup live JSI listener to react instantly to Pro upgrades
    const listener = storage.addOnValueChangedListener((key) => {
      if (key === 'user.isProUser') {
        const updated = storage.getBoolean('user.isProUser') ?? false;
        setIsPremium(updated);
      }
    });

    return () => listener.remove();
  }, []);

  const handleToggleBookmark = useCallback((noteId: string) => {
    toggleBookmarkNote(noteId);
    setBookmarks(getBookmarkedNotes());
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }, []);

  const triggerGoProUpgrade = () => {
    setProUser(true);
    setIsPremium(true);
    if (Platform.OS !== 'web') {
      // Premium purchase simulated haptic success sound/clink trigger
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const triggerResetPro = () => {
    setProUser(false);
    setIsPremium(false);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return BASELINE_NOTES.filter((note) => {
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'bookmarked') return bookmarks.includes(note.id);
      return note.category === selectedCategory;
    });
  }, [selectedCategory, bookmarks]);

  // Quiz Shake Animation style
  const shakeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: quizShakeOffset.value }],
  }));

  const handleQuizAnswer = (idx: number) => {
    if (isQuizAnswered || !quizQuestion) return;

    setSelectedQuizIdx(idx);
    setIsQuizAnswered(true);

    if (idx === quizQuestion.correctIndex) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      quizShakeOffset.value = withSequence(
        withTiming(-12, { duration: 50 }),
        withTiming(12, { duration: 50 }),
        withTiming(-12, { duration: 50 }),
        withTiming(12, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  };

  const toggleExpandNote = (noteId: string) => {
    setExpandedNoteId(expandedNoteId === noteId ? null : noteId);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
      case 'basics': return '📐';
      case 'strategy': return '🏖️';
      case 'trap': return '⚠️';
      case 'tax': return '💰';
      default: return '📖';
    }
  };

  // ============================================================
  // CALCULATORS SOLVER ENGINES
  // ============================================================

  // 1. SIP Step-Up Math Solver
  const sipComputed = useMemo(() => {
    const lump = parseFloat(sipLumpSum) || 0;
    let monthly = parseFloat(sipMonthly) || 0;
    const cagr = (parseFloat(sipCagr) || 0) / 100;
    const years = parseInt(sipYears) || 0;
    const stepUp = (parseFloat(sipStepUp) || 0) / 100;
    const inflation = 0.055; // 5.5% Indian standard cpi

    let totalInvested = lump;
    let fvNominal = lump;
    let fvReal = lump;

    for (let yr = 1; yr <= years; yr++) {
      fvNominal = fvNominal * (1 + cagr);
      fvReal = fvReal * (1 + ((1 + cagr) / (1 + inflation) - 1));

      const monthlyRate = Math.pow(1 + cagr, 1 / 12) - 1;
      const monthlyRateReal = Math.pow(1 + ((1 + cagr) / (1 + inflation) - 1), 1 / 12) - 1;

      for (let m = 1; m <= 12; m++) {
        fvNominal = fvNominal * (1 + monthlyRate) + monthly;
        fvReal = fvReal * (1 + monthlyRateReal) + monthly;
        totalInvested += monthly;
      }

      // Step up monthly SIP for next year
      monthly = monthly * (1 + stepUp);
    }

    return {
      totalInvested: Math.round(totalInvested),
      futureValueNominal: Math.round(fvNominal),
      futureValueReal: Math.round(fvReal),
    };
  }, [sipLumpSum, sipMonthly, sipCagr, sipYears, sipStepUp]);

  // 2. CAGR Solver
  const cagrComputed = useMemo(() => {
    const initial = parseFloat(cagrInitial) || 0;
    const final = parseFloat(cagrFinal) || 0;
    const years = parseFloat(cagrYears) || 0;

    if (initial <= 0 || final <= 0 || years <= 0) return 0;
    const cagrValue = Math.pow(final / initial, 1 / years) - 1;
    return Math.round(cagrValue * 1000) / 10;
  }, [cagrInitial, cagrFinal, cagrYears]);

  // 3. SWP Retirement Survival Solver
  const swpComputed = useMemo(() => {
    const initialCorpus = parseFloat(swpCorpus) || 0;
    const monthlyWithdrawal = parseFloat(swpWithdrawal) || 0;
    const expectedAnnualReturn = (parseFloat(swpReturn) || 0) / 100;
    const years = parseInt(swpYears) || 0;
    const adjustForInflation = swpInflation;
    
    return calculateSwp({
      initialCorpus,
      monthlyWithdrawal,
      expectedAnnualReturn,
      years,
      adjustForInflation,
      annualInflationRate: 0.055, // 5.5% Indian standard
    });
  }, [swpCorpus, swpWithdrawal, swpReturn, swpYears, swpInflation]);

  const swpRate = useMemo(() => {
    const corpus = parseFloat(swpCorpus) || 1;
    const withdrawal = parseFloat(swpWithdrawal) || 0;
    return Math.round(((withdrawal * 12) / corpus) * 1000) / 10;
  }, [swpCorpus, swpWithdrawal]);

  // 4. FIRE & BaristaFIRE Solver
  const fireComputed = useMemo(() => {
    const age = parseInt(fireAge) || 30;
    const retireAge = parseInt(fireRetireAge) || 55;
    const monthlyExpenses = parseFloat(fireExpenses) || 0;
    const monthlySide = parseFloat(fireSideIncome) || 0;
    const currentNestEgg = parseFloat(fireInvestments) || 0;
    const customSWR = (parseFloat(fireSWR) || 4.0) / 100;

    const yearsToRetire = retireAge - age;
    const annualExpenses = monthlyExpenses * 12;
    const annualSide = monthlySide * 12;

    const fireNumberStandard = annualExpenses / customSWR;
    const baristaFireNumber = Math.max(0, annualExpenses - annualSide) / customSWR;

    const realRate = ((1 + 0.12) / (1 + 0.055)) - 1; // 12% CAGR discounted by 5.5% inflation
    const coastFireThreshold = fireNumberStandard / Math.pow(1 + realRate, Math.max(0, yearsToRetire));
    const coastBaristaThreshold = baristaFireNumber / Math.pow(1 + realRate, Math.max(0, yearsToRetire));

    const targetRatio = fireNumberStandard > 0 ? (baristaFireNumber / fireNumberStandard) : 1;
    const yearsSaved = Math.max(0, Math.round(yearsToRetire * (1 - targetRatio) * 10) / 10);

    return {
      fireNumberStandard,
      baristaFireNumber,
      coastFireThreshold,
      coastBaristaThreshold,
      yearsSaved,
      isAlreadyCoastFire: currentNestEgg >= coastFireThreshold,
      isAlreadyCoastBarista: currentNestEgg >= coastBaristaThreshold,
    };
  }, [fireAge, fireRetireAge, fireExpenses, fireSideIncome, fireInvestments, fireSWR]);

  const handleSliderStringChange = useCallback((setter: (v: string) => void) => (val: number) => {
    setter(val.toString());
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }, []);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenSubtitle}>Financial Wisdom Hub</Text>
        <Text style={styles.screenTitle}>Learn</Text>
      </View>

      {/* Main Screen Tab Pills Selector */}
      <View style={styles.tabControl}>
        <TouchableOpacity
          style={[styles.tabBtn, activeSegment === 'WISDOM' && styles.tabBtnActive]}
          onPress={() => {
            setActiveSegment('WISDOM');
            if (Platform.OS !== 'web') Haptics.selectionAsync();
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabBtnText, activeSegment === 'WISDOM' && styles.tabBtnTextActive]}>
            📚 Wisdom Feed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeSegment === 'CALCULATORS' && styles.tabBtnActive]}
          onPress={() => {
            setActiveSegment('CALCULATORS');
            if (Platform.OS !== 'web') Haptics.selectionAsync();
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabBtnText, activeSegment === 'CALCULATORS' && styles.tabBtnTextActive]}>
            🧮 FinTech Tools
          </Text>
        </TouchableOpacity>
      </View>

      {/* Segment Rendering */}
      {activeSegment === 'WISDOM' ? (
        // ============================================================
        // SEGMENT 1: WISDOM FEED
        // ============================================================
        <View style={{ flex: 1 }}>
          {/* Category Pills (Horizontal scroll) */}
          <View style={styles.filterSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillContainer}
            >
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.pill, isActive && styles.pillActive]}
                    onPress={() => setSelectedCategory(cat.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Daily Interactive Quiz Section */}
            {selectedCategory === 'all' && quizQuestion && (
              <Animated.View style={shakeAnimatedStyle}>
                <GlassPanel style={styles.quizCard} glowColor={ThemeColors.neonCyan}>
                  <Text style={styles.quizLabel}>DAILY MINI-QUIZ</Text>
                  <Text style={styles.quizQuestionText}>{quizQuestion.question}</Text>

                  <View style={styles.quizOptions}>
                    {quizQuestion.options.map((opt, i) => {
                      const isSelected = selectedQuizIdx === i;
                      const isCorrect = i === quizQuestion.correctIndex;
                      
                      let optionStyle = {};
                      let textStyle = {};

                      if (isQuizAnswered) {
                        if (isCorrect) {
                          optionStyle = styles.optionCorrect;
                          textStyle = styles.optionTextCorrect;
                        } else if (isSelected) {
                          optionStyle = styles.optionWrong;
                          textStyle = styles.optionTextWrong;
                        } else {
                          optionStyle = styles.optionDisabled;
                        }
                      }

                      return (
                        <TouchableOpacity
                          key={i}
                          style={[styles.optionBtn, optionStyle]}
                          onPress={() => handleQuizAnswer(i)}
                          disabled={isQuizAnswered}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.optionText, textStyle]}>
                            {isQuizAnswered && isCorrect ? '● ' : '○ '}
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Quiz Answer Explanation */}
                  {isQuizAnswered && (
                    <View style={styles.explanationBox}>
                      <Text style={styles.explanationTitle}>
                        {selectedQuizIdx === quizQuestion.correctIndex ? '✅ Correct!' : '❌ Incorrect'}
                      </Text>
                      <Text style={styles.explanationText}>{quizQuestion.explanation}</Text>
                      
                      {/* Jump Link to Note */}
                      <TouchableOpacity
                        style={styles.learnMoreBtn}
                        onPress={() => toggleExpandNote(quizQuestion.relatedNoteId)}
                      >
                        <Text style={styles.learnMoreText}>Read Related Note ➔</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </GlassPanel>
              </Animated.View>
            )}

            {/* Wealth Notes List */}
            <Text style={styles.sectionTitle}>📖 WEALTH NOTES</Text>

            {filteredNotes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No saved wisdom found here.</Text>
                <Text style={styles.emptySubtitle}>Bookmark articles in the feed to save them offline.</Text>
              </View>
            ) : (
              filteredNotes.map((note) => {
                const isExpanded = expandedNoteId === note.id;
                const isBookmarked = bookmarks.includes(note.id);
                const accentColor = CATEGORY_COLORS[note.category] || ThemeColors.neonCyan;

                return (
                  <GlassPanel
                    key={note.id}
                    style={[
                      styles.noteCard,
                      isExpanded && { borderColor: accentColor, borderWidth: 1 },
                    ]}
                    variant={isExpanded ? 'subtle' : 'default'}
                  >
                    {/* Note Header (Always visible) */}
                    <TouchableOpacity
                      onPress={() => toggleExpandNote(note.id)}
                      activeOpacity={0.8}
                      style={styles.notePressableHeader}
                    >
                      <View style={styles.noteTitleArea}>
                        <Text style={styles.noteEmoji}>{getCategoryEmoji(note.category)}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.noteTitle, { color: accentColor }]}>
                            {note.title}
                          </Text>
                          <Text style={styles.noteCategoryLabel}>{note.category.toUpperCase()}</Text>
                        </View>
                      </View>

                      {/* Bookmark & Arrow controls */}
                      <View style={styles.noteControls}>
                        <TouchableOpacity
                          onPress={() => handleToggleBookmark(note.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Text style={[styles.bookmarkStar, isBookmarked && styles.bookmarkedStarActive]}>
                            {isBookmarked ? '★' : '☆'}
                          </Text>
                        </TouchableOpacity>
                        <Text style={[styles.arrowIndicator, isExpanded && styles.arrowExpanded]}>
                          ▼
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Expanded Details Body */}
                    {isExpanded ? (
                      <View style={styles.noteContentArea}>
                        <Text style={styles.noteFullContent}>{note.content}</Text>

                        {/* Centered Formula Block */}
                        {note.formula && (
                          <View style={styles.formulaBox}>
                            <Text style={styles.formulaLabel}>FORMULA</Text>
                            <Text style={styles.formulaText}>{note.formula}</Text>
                          </View>
                        )}

                        {/* Actionable Tip Box */}
                        <View style={[styles.tipBox, { borderColor: accentColor }]}>
                          <Text style={[styles.tipTitle, { color: accentColor }]}>💡 Actionable Wealth Tip</Text>
                          <Text style={styles.tipText}>{note.actionableTip}</Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.noteSummary} numberOfLines={2}>
                        {note.summary}
                      </Text>
                    )}
                  </GlassPanel>
                );
              })
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        </View>
      ) : (
        // ============================================================
        // SEGMENT 2: FINTECH STANDALONE CALCULATORS
        // ============================================================
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Go Premium Simulated Card (Module 01) */}
          <GlassPanel
            glowColor={isPremium ? ThemeColors.goldMetallic : ThemeColors.neonCyan}
            style={styles.premiumCard}
          >
            {isPremium ? (
              <View style={styles.proActiveLayout}>
                <Text style={styles.proTitleText}>🏆 WealthOS Premium Active</Text>
                <Text style={styles.proDescText}>
                  All frosted ad banner placeholders removed successfully. Simulating ad-free SEBI compliant environment!
                </Text>
                <TouchableOpacity onPress={triggerResetPro} activeOpacity={0.7} style={styles.proActionBtn}>
                  <Text style={styles.proActionText}>Simulate Ad Re-activation</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.proInactiveLayout}>
                <Text style={[styles.proTitleText, { color: ThemeColors.neonCyan }]}>
                  ⭐ Go Pro & Support Local Privacy
                </Text>
                <Text style={styles.proDescText}>
                  Remove bottom banner placeholders, unlock ultra-clean calculations playground, and protect 100% offline-first local data.
                </Text>
                <TouchableOpacity onPress={triggerGoProUpgrade} activeOpacity={0.7} style={[styles.proActionBtn, { borderColor: ThemeColors.neonCyan }]}>
                  <Text style={[styles.proActionText, { color: ThemeColors.neonCyan }]}>
                    Unlock Premium (Free simulation)
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </GlassPanel>

          {activeCalc === null ? (
            // Calculators Launcher Grid
            <View style={styles.calcGrid}>
              {/* 1. Combined SIP */}
              <TouchableOpacity
                style={styles.calcGridCard}
                onPress={() => {
                  setActiveCalc('SIP');
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.8}
              >
                <GlassPanel style={styles.calcInnerCard} glowColor={ThemeColors.neonGreen}>
                  <Text style={styles.calcEmoji}>📈</Text>
                  <Text style={styles.calcTitle}>SIP & Step-Up</Text>
                  <Text style={styles.calcDesc}>Compounding future values with step-up CAGR</Text>
                </GlassPanel>
              </TouchableOpacity>

              {/* 2. CAGR Solver */}
              <TouchableOpacity
                style={styles.calcGridCard}
                onPress={() => {
                  setActiveCalc('CAGR');
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.8}
              >
                <GlassPanel style={styles.calcInnerCard} glowColor={ThemeColors.neonCyan}>
                  <Text style={styles.calcEmoji}>📊</Text>
                  <Text style={styles.calcTitle}>CAGR Solver</Text>
                  <Text style={styles.calcDesc}>Solves compound growth rate of positive investments</Text>
                </GlassPanel>
              </TouchableOpacity>

              {/* 3. SWP Calculator */}
              <TouchableOpacity
                style={styles.calcGridCard}
                onPress={() => {
                  setActiveCalc('SWP');
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.8}
              >
                <GlassPanel style={styles.calcInnerCard} glowColor={ThemeColors.neonAmber}>
                  <Text style={styles.calcEmoji}>📉</Text>
                  <Text style={styles.calcTitle}>SWP Survival</Text>
                  <Text style={styles.calcDesc}>Models corpus systematic retirement withdrawal depletion</Text>
                </GlassPanel>
              </TouchableOpacity>

              {/* 4. FIRE & Barista Calculator */}
              <TouchableOpacity
                style={styles.calcGridCard}
                onPress={() => {
                  setActiveCalc('FIRE');
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.8}
              >
                <GlassPanel style={styles.calcInnerCard} glowColor={ThemeColors.goldMetallic}>
                  <Text style={styles.calcEmoji}>🏖️</Text>
                  <Text style={styles.calcTitle}>BaristaFIRE</Text>
                  <Text style={styles.calcDesc}>Mental retirement targets & dual freedom rings</Text>
                </GlassPanel>
              </TouchableOpacity>
            </View>
          ) : (
            // Expanded Calculator Sheets
            <View style={{ gap: Spacing.base }}>
              {/* Back / Close button */}
              <TouchableOpacity
                style={styles.closeCalcBtn}
                onPress={() => {
                  setActiveCalc(null);
                  if (Platform.OS !== 'web') Haptics.selectionAsync();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.closeCalcText}>◀️ Back to Tools Directory</Text>
              </TouchableOpacity>

              {/* ============================================================
                  1. EXPANDED SIP STEP-UP PANEL
                  ============================================================ */}
              {activeCalc === 'SIP' && (
                <GlassPanel style={styles.calcExpandedCard} glowColor={ThemeColors.neonGreen}>
                  <Text style={styles.expandedLabel}>📈 SIP STEP-UP CALCULATOR</Text>
                  
                  {/* Real-time Math Output Cards */}
                  <View style={styles.outputGrid}>
                    <View style={styles.outputCell}>
                      <Text style={styles.outputLabel}>TOTAL PRINCIPAL INVESTED</Text>
                      <Text style={styles.outputValue}>{formatINR(sipComputed.totalInvested)}</Text>
                    </View>
                    <View style={styles.outputCell}>
                      <Text style={styles.outputLabel}>FUTURE VALUE (NOMINAL)</Text>
                      <Text style={[styles.outputValue, { color: ThemeColors.neonGreen }]}>
                        {formatINR(sipComputed.futureValueNominal)}
                      </Text>
                    </View>
                    <View style={styles.outputCell}>
                      <Text style={styles.outputLabel}>INFLATION-ADJUSTED (REAL WORTH)</Text>
                      <Text style={[styles.outputValue, { color: ThemeColors.neonCyan }]}>
                        {formatINR(sipComputed.futureValueReal)}
                      </Text>
                    </View>
                  </View>

                  {/* Sliders and Keyboard inputs */}
                  <View style={styles.inputArea}>
                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Initial Lump Sum (₹)</Text>
                      <TextInput
                        style={styles.keyboardInput}
                        value={sipLumpSum}
                        onChangeText={setSipLumpSum}
                        keyboardType="numeric"
                      />
                    </View>
                    <ScenarioSlider
                      label=""
                      value={parseFloat(sipLumpSum) || 0}
                      min={0}
                      max={2000000}
                      step={25000}
                      formatValue={(v) => formatINRCompact(v)}
                      onValueChange={handleSliderStringChange(setSipLumpSum)}
                      accentColor={ThemeColors.neonCyan}
                    />

                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Monthly Investment (₹)</Text>
                      <TextInput
                        style={styles.keyboardInput}
                        value={sipMonthly}
                        onChangeText={setSipMonthly}
                        keyboardType="numeric"
                      />
                    </View>
                    <ScenarioSlider
                      label=""
                      value={parseFloat(sipMonthly) || 0}
                      min={1000}
                      max={200000}
                      step={2500}
                      formatValue={(v) => formatINRCompact(v)}
                      onValueChange={handleSliderStringChange(setSipMonthly)}
                      accentColor={ThemeColors.neonGreen}
                    />

                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Expected CAGR Return (%)</Text>
                      <TextInput
                        style={styles.keyboardInput}
                        value={sipCagr}
                        onChangeText={setSipCagr}
                        keyboardType="numeric"
                      />
                    </View>
                    <ScenarioSlider
                      label=""
                      value={parseFloat(sipCagr) || 0}
                      min={4.0}
                      max={20.0}
                      step={0.5}
                      formatValue={(v) => `${v}%`}
                      onValueChange={handleSliderStringChange(setSipCagr)}
                      accentColor={ThemeColors.goldMetallic}
                    />

                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Annual SIP Step-Up Hike (%)</Text>
                      <TextInput
                        style={styles.keyboardInput}
                        value={sipStepUp}
                        onChangeText={setSipStepUp}
                        keyboardType="numeric"
                      />
                    </View>
                    <ScenarioSlider
                      label=""
                      value={parseFloat(sipStepUp) || 0}
                      min={0}
                      max={25}
                      step={1}
                      formatValue={(v) => `${v}% Hike`}
                      onValueChange={handleSliderStringChange(setSipStepUp)}
                      accentColor={ThemeColors.neonAmber}
                    />

                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Compounding Horizon (Years)</Text>
                      <TextInput
                        style={styles.keyboardInput}
                        value={sipYears}
                        onChangeText={setSipYears}
                        keyboardType="numeric"
                      />
                    </View>
                    <ScenarioSlider
                      label=""
                      value={parseInt(sipYears) || 0}
                      min={1}
                      max={40}
                      step={1}
                      formatValue={(v) => `${v} Yrs`}
                      onValueChange={handleSliderStringChange(setSipYears)}
                      accentColor={ThemeColors.neonCyan}
                    />
                  </View>
                </GlassPanel>
              )}

              {/* ============================================================
                  2. EXPANDED CAGR SOLVER PANEL
                  ============================================================ */}
              {activeCalc === 'CAGR' && (
                <GlassPanel style={styles.calcExpandedCard} glowColor={ThemeColors.neonCyan}>
                  <Text style={styles.expandedLabel}>📊 CAGR CALCULATOR</Text>

                  {/* Real-time Math Output Cards */}
                  <View style={styles.cagrOutputCell}>
                    <Text style={styles.outputLabel}>CALCULATED GROWTH RATE</Text>
                    <Text style={[styles.outputValue, { color: ThemeColors.neonCyan, fontSize: 32 }]}>
                      {cagrComputed}% CAGR
                    </Text>
                    <Text style={styles.cagrOutputDesc}>
                      Your portfolio compounded by ~{cagrComputed}% annually over {cagrYears} years.
                    </Text>
                  </View>

                  <View style={styles.inputArea}>
                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Initial Purchase Value (₹)</Text>
                      <TextInput
                        style={styles.keyboardInput}
                        value={cagrInitial}
                        onChangeText={setCagrInitial}
                        keyboardType="numeric"
                      />
                    </View>
                    <ScenarioSlider
                      label=""
                      value={parseFloat(cagrInitial) || 0}
                      min={10000}
                      max={1000000}
                      step={10000}
                      formatValue={(v) => formatINRCompact(v)}
                      onValueChange={handleSliderStringChange(setCagrInitial)}
                      accentColor={ThemeColors.neonCyan}
                    />

                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Final Value (₹)</Text>
                      <TextInput
                        style={styles.keyboardInput}
                        value={cagrFinal}
                        onChangeText={setCagrFinal}
                        keyboardType="numeric"
                      />
                    </View>
                    <ScenarioSlider
                      label=""
                      value={parseFloat(cagrFinal) || 0}
                      min={20000}
                      max={5000000}
                      step={25000}
                      formatValue={(v) => formatINRCompact(v)}
                      onValueChange={handleSliderStringChange(setCagrFinal)}
                      accentColor={ThemeColors.neonGreen}
                    />

                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Horizon Duration (Years)</Text>
                      <TextInput
                        style={styles.keyboardInput}
                        value={cagrYears}
                        onChangeText={setCagrYears}
                        keyboardType="numeric"
                      />
                    </View>
                    <ScenarioSlider
                      label=""
                      value={parseInt(cagrYears) || 0}
                      min={1}
                      max={25}
                      step={1}
                      formatValue={(v) => `${v} Years`}
                      onValueChange={handleSliderStringChange(setCagrYears)}
                      accentColor={ThemeColors.goldMetallic}
                    />
                  </View>
                </GlassPanel>
              )}

              {/* ============================================================
                  3. EXPANDED SWP SURVIVAL PANEL
                  ============================================================ */}
              {activeCalc === 'SWP' && (
                <GlassPanel style={styles.calcExpandedCard} glowColor={ThemeColors.neonAmber}>
                  <Text style={styles.expandedLabel}>📉 SWP SYSTEMATIC DEBENTURE PAYOUTS</Text>

                  {/* Safety Zone Indicator Badges */}
                  <View style={styles.swpHeaderRow}>
                    <View style={styles.swpRateBadge}>
                      <Text style={styles.swpRateBadgeText}>SWR: {swpRate}%</Text>
                    </View>
                    {swpRate <= 4.0 ? (
                      <View style={[styles.swpSafetyBadge, { backgroundColor: 'rgba(57, 255, 20, 0.12)', borderColor: ThemeColors.neonGreen }]}>
                        <Text style={[styles.swpSafetyText, { color: ThemeColors.neonGreen }]}>🛡️ Safe Zone SWR ({"<4%"})</Text>
                      </View>
                    ) : (
                      <View style={[styles.swpSafetyBadge, { backgroundColor: 'rgba(255, 165, 0, 0.12)', borderColor: ThemeColors.neonAmber }]}>
                        <Text style={[styles.swpSafetyText, { color: ThemeColors.neonAmber }]}>⚠️ Elevated depletion risk</Text>
                      </View>
                    )}
                  </View>

                  {/* Real-time Math Output Cards */}
                  <View style={styles.outputGrid}>
                    <View style={styles.outputCell}>
                      <Text style={styles.outputLabel}>TOTAL SYSTEMATIC WITHDRAWALS</Text>
                      <Text style={styles.outputValue}>{formatINR(swpComputed.totalWithdrawn)}</Text>
                    </View>
                    <View style={styles.outputCell}>
                      <Text style={styles.outputLabel}>ENDING BALANCE</Text>
                      <Text style={[styles.outputValue, { color: swpComputed.isDepleted ? ThemeColors.liabilityRed : ThemeColors.neonGreen }]}>
                        {formatINR(swpComputed.endingBalance)}
                      </Text>
                    </View>
                    <View style={styles.outputCell}>
                      <Text style={styles.outputLabel}>TIMELINE STATE</Text>
                      <Text style={[styles.outputValue, { color: swpComputed.isDepleted ? ThemeColors.neonAmber : ThemeColors.neonCyan }]}>
                        {swpComputed.isDepleted
                          ? `Depleted at Yr ${Math.floor(swpComputed.monthsSurvived / 12)}, Mo ${swpComputed.monthsSurvived % 12}`
                          : `Corpus survived ${swpYears} Years!`}
                      </Text>
                    </View>
                  </View>

                  {/* Depletion warning alert cards */}
                  {swpComputed.isDepleted && (
                    <View style={styles.depletedAlertCard}>
                      <Text style={styles.depletedAlertEmoji}>🚨</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.depletedAlertTitle}>Capital Depletion Squeeze</Text>
                        <Text style={styles.depletedAlertDesc}>
                          Your systematic withdrawals outpaced compounding, emptying the nest egg in {Math.floor(swpComputed.monthsSurvived / 12)} years. Lower monthly payouts or increase returns.
                        </Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.inputArea}>
                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Initial Corpus size (₹)</Text>
                      <TextInput
                        style={styles.keyboardInput}
                        value={swpCorpus}
                        onChangeText={setSwpCorpus}
                        keyboardType="numeric"
                      />
                    </View>
                    <ScenarioSlider
                      label=""
                      value={parseFloat(swpCorpus) || 0}
                      min={500000}
                      max={20000000}
                      step={100000}
                      formatValue={(v) => formatINRCompact(v)}
                      onValueChange={handleSliderStringChange(setSwpCorpus)}
                      accentColor={ThemeColors.neonCyan}
                    />

                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Monthly Payout Target (₹)</Text>
                      <TextInput
                        style={styles.keyboardInput}
                        value={swpWithdrawal}
                        onChangeText={setSwpWithdrawal}
                        keyboardType="numeric"
                      />
                    </View>
                    <ScenarioSlider
                      label=""
                      value={parseFloat(swpWithdrawal) || 0}
                      min={5000}
                      max={200000}
                      step={5000}
                      formatValue={(v) => formatINRCompact(v)}
                      onValueChange={handleSliderStringChange(setSwpWithdrawal)}
                      accentColor={ThemeColors.neonAmber}
                    />

                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Expected return rate (%)</Text>
                      <TextInput
                        style={styles.keyboardInput}
                        value={swpReturn}
                        onChangeText={setSwpReturn}
                        keyboardType="numeric"
                      />
                    </View>
                    <ScenarioSlider
                      label=""
                      value={parseFloat(swpReturn) || 0}
                      min={4.0}
                      max={15.0}
                      step={0.5}
                      formatValue={(v) => `${v}% Return`}
                      onValueChange={handleSliderStringChange(setSwpReturn)}
                      accentColor={ThemeColors.neonGreen}
                    />

                    {/* Inflation adjustments toggles */}
                    <TouchableOpacity
                      style={styles.inflationToggleRow}
                      onPress={() => setSwpInflation((prev) => !prev)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.inflationToggleText}>Adjust monthly payout for 5.5% annual inflation</Text>
                      <View style={[styles.toggleBox, swpInflation && styles.toggleBoxActive]}>
                        <Text style={styles.toggleIndicator}>{swpInflation ? '✔️' : ''}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </GlassPanel>
              )}

              {/* ============================================================
                  4. EXPANDED BARISTAFIRE PANEL
                  ============================================================ */}
              {activeCalc === 'FIRE' && (
                <GlassPanel style={styles.calcExpandedCard} glowColor={ThemeColors.goldMetallic}>
                  <Text style={styles.expandedLabel}>🏖️ MENTAL RETIREMENT TARGETS</Text>

                  {/* Real-time Math Output Cards */}
                  <View style={styles.outputGrid}>
                    <View style={styles.outputCell}>
                      <Text style={styles.outputLabel}>STANDARD FIRE CORPUS</Text>
                      <Text style={styles.outputValue}>{formatINR(fireComputed.fireNumberStandard)}</Text>
                    </View>
                    <View style={styles.outputCell}>
                      <Text style={styles.outputLabel}>BARISTA FIRE TARGET</Text>
                      <Text style={[styles.outputValue, { color: ThemeColors.goldYellow }]}>
                        {formatINR(fireComputed.baristaFireNumber)}
                      </Text>
                    </View>
                    <View style={styles.outputCell}>
                      <Text style={styles.outputLabel}>COASTING TARGET TODAY</Text>
                      <Text style={[styles.outputValue, { color: ThemeColors.neonCyan }]}>
                        {formatINR(fireComputed.coastBaristaThreshold)}
                      </Text>
                    </View>
                  </View>

                  {/* Freedom year gauge */}
                  <View style={styles.freedomGauge}>
                    <Text style={styles.freedomGaugeTitle}>
                      🎉 Mental Freedom Achieved {fireComputed.yearsSaved} Years Early!
                    </Text>
                    <Text style={styles.freedomGaugeDesc}>
                      By covering ₹{formatINRCompact(parseFloat(fireSideIncome) || 0)}/mo through passion freelancing, your required savings corpus splits, letting you quit corporate stress early!
                    </Text>
                  </View>

                  <View style={styles.inputArea}>
                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Current Monthly Expenses Today (₹)</Text>
                      <TextInput
                        style={styles.keyboardInput}
                        value={fireExpenses}
                        onChangeText={setFireExpenses}
                        keyboardType="numeric"
                      />
                    </View>
                    <ScenarioSlider
                      label=""
                      value={parseFloat(fireExpenses) || 0}
                      min={10000}
                      max={300000}
                      step={5000}
                      formatValue={(v) => formatINRCompact(v)}
                      onValueChange={handleSliderStringChange(setFireExpenses)}
                      accentColor={ThemeColors.neonAmber}
                    />

                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Expected Side-Hustle Income (₹)</Text>
                      <TextInput
                        style={styles.keyboardInput}
                        value={fireSideIncome}
                        onChangeText={setFireSideIncome}
                        keyboardType="numeric"
                      />
                    </View>
                    <ScenarioSlider
                      label=""
                      value={parseFloat(fireSideIncome) || 0}
                      min={0}
                      max={200000}
                      step={5000}
                      formatValue={(v) => formatINRCompact(v)}
                      onValueChange={handleSliderStringChange(setFireSideIncome)}
                      accentColor={ThemeColors.neonCyan}
                    />

                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Current Investments Net Worth (₹)</Text>
                      <TextInput
                        style={styles.keyboardInput}
                        value={fireInvestments}
                        onChangeText={setFireInvestments}
                        keyboardType="numeric"
                      />
                    </View>
                    <ScenarioSlider
                      label=""
                      value={parseFloat(fireInvestments) || 0}
                      min={100000}
                      max={15000000}
                      step={100000}
                      formatValue={(v) => formatINRCompact(v)}
                      onValueChange={handleSliderStringChange(setFireInvestments)}
                      accentColor={ThemeColors.neonGreen}
                    />

                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Current Age</Text>
                      <TextInput
                        style={styles.keyboardInput}
                        value={fireAge}
                        onChangeText={setFireAge}
                        keyboardType="numeric"
                      />
                    </View>
                    <ScenarioSlider
                      label=""
                      value={parseInt(fireAge) || 30}
                      min={18}
                      max={60}
                      step={1}
                      formatValue={(v) => `${v} Yrs Old`}
                      onValueChange={handleSliderStringChange(setFireAge)}
                      accentColor={ThemeColors.neonCyan}
                    />

                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Target Retirement Age</Text>
                      <TextInput
                        style={styles.keyboardInput}
                        value={fireRetireAge}
                        onChangeText={setFireRetireAge}
                        keyboardType="numeric"
                      />
                    </View>
                    <ScenarioSlider
                      label=""
                      value={parseInt(fireRetireAge) || 55}
                      min={35}
                      max={75}
                      step={1}
                      formatValue={(v) => `Retire at ${v}`}
                      onValueChange={handleSliderStringChange(setFireRetireAge)}
                      accentColor={ThemeColors.goldMetallic}
                    />
                  </View>
                </GlassPanel>
              )}

              {/* SEBI Compliance Educational Footer */}
              <Text style={styles.sebiFooter}>
                ⚠️ All models are for educational gamification purposes and do not represent active financial advice. Returns are based on historical index and fixed interest averages in India.
              </Text>
            </View>
          )}
          <View style={{ height: 120 }} />
        </ScrollView>
      )}
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
    paddingBottom: Spacing.sm,
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

  // Segment Tab Control
  tabControl: {
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
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: ThemeColors.frostedPanelLight,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadows.glow,
    shadowColor: ThemeColors.neonGreen,
    shadowOpacity: 0.1,
  },
  tabBtnText: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.medium,
  },
  tabBtnTextActive: {
    color: ThemeColors.textPrimary,
    fontWeight: Typography.weight.bold,
  },

  filterSection: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  pillContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    alignItems: 'center',
    height: 40,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: ThemeColors.neonGreen,
    borderColor: ThemeColors.neonGreen,
    ...Shadows.glow,
  },
  pillText: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.medium,
  },
  pillTextActive: {
    color: ThemeColors.backgroundStart,
    fontWeight: Typography.weight.bold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },

  // Daily Quiz Styling
  quizCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.xl,
  },
  quizLabel: {
    color: ThemeColors.neonCyan,
    fontSize: Typography.size.caption,
    fontWeight: Typography.weight.bold,
    letterSpacing: Typography.letterSpacing.widest,
    marginBottom: Spacing.md,
  },
  quizQuestionText: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.semibold,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  quizOptions: {
    gap: Spacing.md,
  },
  optionBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  optionText: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.body,
  },
  optionCorrect: {
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    borderColor: ThemeColors.neonGreen,
  },
  optionTextCorrect: {
    color: ThemeColors.neonGreen,
    fontWeight: Typography.weight.bold,
  },
  optionWrong: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    borderColor: ThemeColors.liabilityRed,
  },
  optionTextWrong: {
    color: ThemeColors.liabilityRed,
    fontWeight: Typography.weight.bold,
  },
  optionDisabled: {
    opacity: 0.6,
  },
  explanationBox: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  explanationTitle: {
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.bold,
    color: ThemeColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  explanationText: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  learnMoreBtn: {
    alignSelf: 'flex-start',
  },
  learnMoreText: {
    color: ThemeColors.neonCyan,
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.semibold,
  },

  // Notes Section
  sectionTitle: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.caption,
    letterSpacing: Typography.letterSpacing.widest,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
    fontWeight: Typography.weight.bold,
  },
  noteCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  notePressableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noteTitleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  noteEmoji: {
    fontSize: 22,
  },
  noteTitle: {
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.bold,
  },
  noteCategoryLabel: {
    color: ThemeColors.textMuted,
    fontSize: 9,
    fontWeight: Typography.weight.bold,
    letterSpacing: Typography.letterSpacing.wider,
    marginTop: 2,
  },
  noteControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginLeft: Spacing.sm,
  },
  bookmarkStar: {
    fontSize: 24,
    color: ThemeColors.textMuted,
  },
  bookmarkedStarActive: {
    color: ThemeColors.goldMetallic,
    ...Shadows.goldGlow,
  },
  arrowIndicator: {
    fontSize: 10,
    color: ThemeColors.textMuted,
  },
  arrowExpanded: {
    transform: [{ rotate: '180deg' }],
    color: ThemeColors.textPrimary,
  },
  noteSummary: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
    lineHeight: 20,
    marginTop: Spacing.sm,
    paddingLeft: 34,
  },

  // Expanded Content Styles
  noteContentArea: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  noteFullContent: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.body,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  formulaBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  formulaLabel: {
    color: ThemeColors.textMuted,
    fontSize: 9,
    fontWeight: Typography.weight.bold,
    letterSpacing: Typography.letterSpacing.widest,
    marginBottom: Spacing.xs,
  },
  formulaText: {
    color: ThemeColors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.bold,
  },
  tipBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
  },
  tipTitle: {
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
  },
  tipText: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
    lineHeight: 18,
  },

  // Empty bookmarked state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.huge,
    gap: Spacing.sm,
  },
  emptyText: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.bold,
  },
  emptySubtitle: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.small,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.xl,
  },

  // ============================================================
  // SEGMENT 2: STANDALONE CALCULATORS STYLES
  // ============================================================
  
  // Simulated Pro upgrade card
  premiumCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  proActiveLayout: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  proInactiveLayout: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  proTitleText: {
    color: ThemeColors.goldMetallic,
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.bold,
    textAlign: 'center',
  },
  proDescText: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
    lineHeight: 18,
    textAlign: 'center',
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  proActionBtn: {
    borderWidth: 1,
    borderColor: ThemeColors.goldMetallic,
    borderRadius: BorderRadius.full,
    paddingVertical: 8,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  proActionText: {
    color: ThemeColors.goldMetallic,
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.semibold,
  },

  // Calculators Grid launcher
  calcGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  calcGridCard: {
    width: '47.5%',
    aspectRatio: 0.95,
  },
  calcInnerCard: {
    flex: 1,
    padding: Spacing.base,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  calcEmoji: {
    fontSize: 28,
    marginBottom: 2,
  },
  calcTitle: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.bold,
    textAlign: 'center',
  },
  calcDesc: {
    color: ThemeColors.textMuted,
    fontSize: 9,
    lineHeight: 12,
    textAlign: 'center',
  },

  // Close back button
  closeCalcBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    marginBottom: Spacing.xs,
  },
  closeCalcText: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.semibold,
  },

  // Expanded panel
  calcExpandedCard: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  expandedLabel: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.bold,
    letterSpacing: 0.5,
  },

  // Math calculations outputs grid
  outputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  outputCell: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    padding: Spacing.md,
  },
  outputLabel: {
    color: ThemeColors.textMuted,
    fontSize: 8,
    fontWeight: Typography.weight.bold,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  outputValue: {
    color: ThemeColors.textPrimary,
    fontSize: 16,
    fontWeight: Typography.weight.bold,
  },

  // CAGR cell styling
  cagrOutputCell: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cagrOutputDesc: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
    textAlign: 'center',
  },

  // Input Slider Area
  inputArea: {
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: Spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: -Spacing.sm, // Cushion standard scenario slider spacing
  },
  inputLabel: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.semibold,
  },
  keyboardInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    borderRadius: BorderRadius.sm,
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.small,
    fontWeight: '700',
    paddingVertical: 3,
    paddingHorizontal: 8,
    textAlign: 'right',
    minWidth: 80,
  },

  // SWP specific header row
  swpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  swpRateBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    borderRadius: BorderRadius.full,
    paddingVertical: 2,
    paddingHorizontal: Spacing.md,
  },
  swpRateBadgeText: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.caption,
    fontWeight: Typography.weight.bold,
  },
  swpSafetyBadge: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingVertical: 2,
    paddingHorizontal: Spacing.md,
  },
  swpSafetyText: {
    fontSize: Typography.size.caption,
    fontWeight: Typography.weight.bold,
  },

  // SWP depletion warnings
  depletedAlertCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: 'rgba(255, 82, 82, 0.08)',
    borderColor: ThemeColors.liabilityRed,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  depletedAlertEmoji: {
    fontSize: 28,
  },
  depletedAlertTitle: {
    color: ThemeColors.liabilityRed,
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.bold,
    marginBottom: 2,
  },
  depletedAlertDesc: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.caption,
    lineHeight: 15,
  },

  // SWP Inflation Toggle
  inflationToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  inflationToggleText: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.caption,
    flex: 1,
  },
  toggleBox: {
    width: 24,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBoxActive: {
    borderColor: ThemeColors.neonGreen,
    backgroundColor: 'rgba(57, 255, 20, 0.08)',
  },
  toggleIndicator: {
    fontSize: 10,
  },

  // FIRE Specific freedom gauge
  freedomGauge: {
    backgroundColor: 'rgba(255, 215, 0, 0.06)',
    borderColor: ThemeColors.goldMetallic,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  freedomGaugeTitle: {
    color: ThemeColors.goldMetallic,
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.bold,
    marginBottom: 4,
  },
  freedomGaugeDesc: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.caption,
    lineHeight: 16,
  },

  // SEBI Footnotes
  sebiFooter: {
    color: ThemeColors.textMuted,
    fontSize: 9,
    lineHeight: 14,
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.base,
  },
});

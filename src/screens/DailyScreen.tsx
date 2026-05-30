import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { GlassPanel } from '@/components/GlassPanel';
import { ThemeColors, Typography, Spacing, BorderRadius, Shadows } from '@/styles/theme';
import { BASELINE_STORIES } from '@/data/stories';
import StoryCard from '@/components/StoryCard';
import {
  getStreak,
  getCompletedStories,
  saveCompletedStory,
  logStreak,
  hasCompletedStoryToday,
} from '@/services/storage';
import { scheduleStreakReminder } from '@/services/notifications';
import { CompletedStory, DailyStory } from '@/types';

export default function DailyScreen() {
  const insets = useSafeAreaInsets();

  // Streak & Completion States
  const [streak, setStreak] = useState(getStreak());
  const [completions, setCompletions] = useState<CompletedStory[]>([]);
  const [doneToday, setDoneToday] = useState(false);
  const [currentStory, setCurrentStory] = useState<DailyStory | null>(null);

  // Reload streak and completions state
  const loadDailyData = useCallback(() => {
    const activeStreak = getStreak();
    const completedList = getCompletedStories();
    const completedToday = hasCompletedStoryToday();

    setStreak(activeStreak);
    setCompletions(completedList);
    setDoneToday(completedToday);

    // Pick next story
    const nextIdx = completedList.length % BASELINE_STORIES.length;
    setCurrentStory(BASELINE_STORIES[nextIdx] || null);
  }, []);

  useEffect(() => {
    loadDailyData();
  }, [loadDailyData]);

  // Handle choice submission
  const handleVoteSubmit = (option: 'A' | 'B' | 'C') => {
    if (!currentStory) return;

    const choice = currentStory.choices[option];
    const isOptimal = choice ? choice.isOptimal : false;

    // 1. Log completion
    const newCompletion: CompletedStory = {
      storyId: currentStory.storyId,
      votedOption: option,
      votedTimestamp: Date.now(),
      wasOptimalChoice: isOptimal,
    };

    saveCompletedStory(newCompletion);

    // 2. Increment streak & schedule next notification
    const updatedStreak = logStreak();
    scheduleStreakReminder(updatedStreak.currentStreak);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // 3. Update states
    setTimeout(() => {
      loadDailyData();
    }, 1500); // 1.5s delay to let user see card flip outcome
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenSubtitle}>Daily Sandbox</Text>
          <Text style={styles.screenTitle}>Wealth Stories</Text>
        </View>

        {/* Streak Flame Widget */}
        <View style={[styles.streakBadge, streak.currentStreak > 0 && styles.streakActive]}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakCount}>{streak.currentStreak}</Text>
          {streak.currentStreak > 0 && <Text style={styles.streakLabel}>day streak</Text>}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {doneToday ? (
          /* Daily Compounded Completed State */
          <View style={styles.completedContainer}>
            <GlassPanel style={styles.successCard} glowColor={ThemeColors.neonGreen}>
              <Text style={styles.successIcon}>🎉</Text>
              <Text style={styles.successTitle}>Daily Compounding Complete!</Text>
              <Text style={styles.successText}>
                You faced today's financial dilemma and made your choice. Your daily streak has updated!
              </Text>

              <View style={styles.streakStatsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{streak.currentStreak}d</Text>
                  <Text style={styles.statLabel}>Current Streak</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{streak.bestStreak}d</Text>
                  <Text style={styles.statLabel}>All-time Best</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{completions.length}</Text>
                  <Text style={styles.statLabel}>Total Solved</Text>
                </View>
              </View>
            </GlassPanel>

            {/* Time Machine Token Reward Card */}
            <GlassPanel style={styles.rewardCard} variant="subtle">
              <Text style={styles.rewardIcon}>⏳</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rewardTitle}>Time Machine Token Awarded</Text>
                <Text style={styles.rewardText}>
                  Streak maintained! You earned an extra token to reverse outcomes in the future.
                </Text>
              </View>
            </GlassPanel>

            <Text style={styles.completionSubtitle}>
              Return tomorrow for your next gamified dilemma. Disciplined compounding beats active market speculation.
            </Text>
          </View>
        ) : (
          /* Active Dilemma Swiper Stack */
          currentStory && (
            <View style={styles.swiperSection}>
              <Text style={styles.storyProgressLabel}>
                Dilemma {completions.length + 1} of {BASELINE_STORIES.length}
              </Text>
              <StoryCard story={currentStory} onVote={handleVoteSubmit} />
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.backgroundStart,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
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
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.frostedPanelLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    gap: Spacing.xs,
  },
  streakActive: {
    borderColor: ThemeColors.neonAmber,
    backgroundColor: 'rgba(255, 165, 0, 0.08)',
    ...Shadows.glow,
    shadowColor: '#FFA500',
  },
  streakEmoji: {
    fontSize: 18,
  },
  streakCount: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.bold,
  },
  streakLabel: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.caption,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  swiperSection: {
    flex: 1,
    justifyContent: 'center',
  },
  storyProgressLabel: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.small,
    letterSpacing: Typography.letterSpacing.wide,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },

  // Completed State UI
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  successCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  successIcon: {
    fontSize: 54,
    marginBottom: Spacing.md,
  },
  successTitle: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.title,
    fontWeight: Typography.weight.bold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  successText: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  streakStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: Spacing.xl,
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    color: ThemeColors.neonGreen,
    fontSize: Typography.size.title,
    fontWeight: Typography.weight.bold,
  },
  statLabel: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.caption,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  rewardIcon: {
    fontSize: 32,
  },
  rewardTitle: {
    color: ThemeColors.goldMetallic,
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.bold,
    marginBottom: 2,
  },
  rewardText: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
    lineHeight: 18,
  },
  completionSubtitle: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.small,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: Spacing.md,
  },
});

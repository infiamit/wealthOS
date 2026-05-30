import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, TouchableOpacity } from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { GlassPanel } from '@/components/GlassPanel';
import { ThemeColors, Typography, Spacing, BorderRadius, Shadows } from '@/styles/theme';
import { DailyStory, StoryChoice } from '@/types';
import { formatINRCompact } from '@/math/engine';

interface StoryCardProps {
  story: DailyStory;
  onVote: (option: 'A' | 'B' | 'C') => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.4;

export default function StoryCard({ story, onVote }: StoryCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [votedOption, setVotedOption] = useState<'A' | 'B' | 'C' | null>(null);

  // Swipe gesture animations
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // 3D Card flip animation
  const flipRotation = useSharedValue(0);

  const resetCard = () => {
    translateX.value = 0;
    translateY.value = 0;
  };

  const handleVote = (option: 'A' | 'B' | 'C') => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setVotedOption(option);
    
    // Flip card to reveal math outcomes
    flipRotation.value = withTiming(180, { duration: 600 }, () => {
      runOnJS(onVote)(option);
      runOnJS(setFlipped)(true);
    });
  };

  const panGesture = Gesture.Pan()
    .enabled(!flipped)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const x = translateX.value;
      const y = translateY.value;

      if (x > SWIPE_THRESHOLD) {
        // Swipe Right -> Option B
        translateX.value = withSpring(SCREEN_WIDTH * 1.5);
        runOnJS(handleVote)('B');
      } else if (x < -SWIPE_THRESHOLD) {
        // Swipe Left -> Option A
        translateX.value = withSpring(-SCREEN_WIDTH * 1.5);
        runOnJS(handleVote)('A');
      } else if (y < -SWIPE_THRESHOLD && story.choices.C) {
        // Swipe Up -> Option C
        translateY.value = withSpring(-SCREEN_WIDTH * 1.5);
        runOnJS(handleVote)('C');
      } else {
        // Snap back
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        if (Platform.OS !== 'web') {
          runOnJS(Haptics.selectionAsync)();
        }
      }
    });

  // Animated styles for card movement
  const animatedCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-15, 0, 15],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
        { rotateY: `${flipRotation.value}deg` },
      ],
    };
  });

  // Badge Opacities for choices
  const optionAStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const optionBStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const optionCStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  // Backside styles
  const backCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateY: '180deg' }],
      opacity: flipRotation.value > 90 ? 1 : 0,
    };
  });

  const frontCardStyle = useAnimatedStyle(() => {
    return {
      opacity: flipRotation.value > 90 ? 0 : 1,
    };
  });

  const renderOutcomeBar = (optionKey: 'A' | 'B' | 'C', choice: StoryChoice) => {
    const maxVal = Math.max(
      story.choices.A.projectedOutcome,
      story.choices.B.projectedOutcome,
      story.choices.C?.projectedOutcome ?? 0
    );
    const percentage = Math.max(10, (choice.projectedOutcome / maxVal) * 100);
    const isChosen = votedOption === optionKey;

    let barColor: string = ThemeColors.neonAmber;
    if (choice.isOptimal) barColor = ThemeColors.neonGreen;
    if (optionKey === 'B' && !choice.isOptimal) barColor = ThemeColors.neonCyan;

    return (
      <View style={styles.outcomeRow} key={optionKey}>
        <View style={styles.outcomeMeta}>
          <Text style={[styles.outcomeLabel, isChosen && styles.votedText]}>
            {optionKey}: {choice.label} {isChosen && '👤'}
          </Text>
          <Text style={[styles.outcomeValue, { color: barColor }]}>
            {formatINRCompact(choice.projectedOutcome)}
          </Text>
        </View>
        <View style={styles.barTrack}>
          <Animated.View
            style={[
              styles.barFill,
              {
                width: `${percentage}%`,
                backgroundColor: barColor,
              },
            ]}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.cardContainer}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.swipeCard, animatedCardStyle]}>
          {/* Card Front */}
          <Animated.View style={[StyleSheet.absoluteFill, frontCardStyle]}>
            <GlassPanel style={styles.cardGlass} glowColor={ThemeColors.neonCyan}>
              <View style={styles.characterHeader}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarEmoji}>👤</Text>
                </View>
                <View>
                  <Text style={styles.charName}>{story.characterName}</Text>
                  <Text style={styles.charDetails}>
                    Age {story.age} • {story.income}
                  </Text>
                </View>
              </View>

              <Text style={styles.introText}>{story.intro}</Text>

              <View style={styles.interactiveGuide}>
                <Text style={styles.guideText}>Swipe Left/Right to Vote ⚡</Text>
              </View>

              {/* Choices Badges overlay during drag */}
              <Animated.View style={[styles.dragBadge, styles.badgeLeft, optionAStyle]}>
                <Text style={styles.badgeTextA}>OPTION A</Text>
              </Animated.View>

              <Animated.View style={[styles.dragBadge, styles.badgeRight, optionBStyle]}>
                <Text style={styles.badgeTextB}>OPTION B</Text>
              </Animated.View>

              {story.choices.C && (
                <Animated.View style={[styles.dragBadge, styles.badgeTop, optionCStyle]}>
                  <Text style={styles.badgeTextC}>OPTION C</Text>
                </Animated.View>
              )}
            </GlassPanel>
          </Animated.View>

          {/* Card Back */}
          <Animated.View style={[StyleSheet.absoluteFill, backCardStyle]}>
            <GlassPanel style={styles.cardGlass} glowColor={ThemeColors.goldMetallic}>
              <Text style={styles.backTitle}>📊 10-15 Year Math Outcomes</Text>
              
              <View style={styles.outcomesContainer}>
                {renderOutcomeBar('A', story.choices.A)}
                {renderOutcomeBar('B', story.choices.B)}
                {story.choices.C && renderOutcomeBar('C', story.choices.C)}
              </View>

              <View style={styles.lessonBox}>
                <Text style={styles.lessonTitle}>💡 Wealth Lesson</Text>
                <Text style={styles.lessonText}>{story.lesson}</Text>
              </View>
            </GlassPanel>
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {/* Manual Choice Buttons below card (hybrid accessibility) */}
      {!flipped && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.btnA]}
            onPress={() => handleVote('A')}
          >
            <Text style={styles.btnTextA}>A: {story.choices.A.label}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.btnB]}
            onPress={() => handleVote('B')}
          >
            <Text style={styles.btnTextB}>B: {story.choices.B.label}</Text>
          </TouchableOpacity>

          {story.choices.C && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.btnC]}
              onPress={() => handleVote('C')}
            >
              <Text style={styles.btnTextC}>C: {story.choices.C.label}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: Spacing.md,
  },
  swipeCard: {
    width: SCREEN_WIDTH - 48,
    height: 380,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
  },
  cardGlass: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'space-between',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  characterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ThemeColors.frostedPanelLight,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  charName: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.title,
    fontWeight: Typography.weight.bold,
  },
  charDetails: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.small,
    letterSpacing: Typography.letterSpacing.normal,
  },
  introText: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.bodyLarge,
    lineHeight: 24,
    marginVertical: Spacing.lg,
  },
  interactiveGuide: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: Spacing.md,
  },
  guideText: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.caption,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wide,
  },
  dragBadge: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    zIndex: 10,
  },
  badgeLeft: {
    top: 50,
    right: 30,
    borderColor: ThemeColors.neonAmber,
    transform: [{ rotate: '15deg' }],
  },
  badgeRight: {
    top: 50,
    left: 30,
    borderColor: ThemeColors.neonGreen,
    transform: [{ rotate: '-15deg' }],
  },
  badgeTop: {
    bottom: 50,
    alignSelf: 'center',
    borderColor: ThemeColors.neonCyan,
  },
  badgeTextA: {
    color: ThemeColors.neonAmber,
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.bold,
  },
  badgeTextB: {
    color: ThemeColors.neonGreen,
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.bold,
  },
  badgeTextC: {
    color: ThemeColors.neonCyan,
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.bold,
  },

  // Backside Outlay
  backTitle: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.md,
  },
  outcomesContainer: {
    gap: Spacing.sm,
  },
  outcomeRow: {
    marginVertical: 2,
  },
  outcomeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  outcomeLabel: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.caption,
    flex: 1,
  },
  votedText: {
    fontWeight: Typography.weight.semibold,
    color: ThemeColors.textPrimary,
  },
  outcomeValue: {
    fontSize: Typography.size.caption,
    fontWeight: Typography.weight.bold,
  },
  barTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  lessonBox: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  lessonTitle: {
    color: ThemeColors.goldMetallic,
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.bold,
    marginBottom: 4,
  },
  lessonText: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.small,
    lineHeight: 18,
  },

  // Accessibility Option Buttons
  actionButtons: {
    width: '100%',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  actionBtn: {
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: ThemeColors.frostedPanel,
  },
  btnA: {
    borderColor: 'rgba(255, 165, 0, 0.25)',
  },
  btnB: {
    borderColor: 'rgba(57, 255, 20, 0.25)',
  },
  btnC: {
    borderColor: 'rgba(0, 255, 255, 0.25)',
  },
  btnTextA: {
    color: ThemeColors.neonAmber,
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.semibold,
  },
  btnTextB: {
    color: ThemeColors.neonGreen,
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.semibold,
  },
  btnTextC: {
    color: ThemeColors.neonCyan,
    fontSize: Typography.size.small,
    fontWeight: Typography.weight.semibold,
  },
});

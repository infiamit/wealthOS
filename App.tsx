/**
 * WealthOS — App Entry Point
 * 
 * Root component wrapping the entire app in:
 * 1. AppErrorBoundary (crash protection)
 * 2. ThemeProvider (design tokens)
 * 3. Biometric gate (security lock)
 * 4. Navigation (tab navigator)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, ThemeColors, Typography, Spacing } from '@/styles/theme';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { authenticateUser } from '@/services/biometricAuth';
import { isBootstrapped, storage } from '@/services/storage';
import TabNavigator from '@/navigation/TabNavigator';
import OnboardingScreen from '@/screens/OnboardingScreen';
import OfflineBanner from '@/components/OfflineBanner';

type AppState = 'loading' | 'locked' | 'onboarding' | 'ready';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    // Read initial premium state
    const pro = storage.getBoolean('user.isProUser') ?? false;
    setIsPremium(pro);

    // Setup JSI C++ MMKV listener
    const listener = storage.addOnValueChangedListener((key) => {
      if (key === 'user.isProUser') {
        const updated = storage.getBoolean('user.isProUser') ?? false;
        setIsPremium(updated);
      }
    });

    return () => listener.remove();
  }, []);

  const initializeApp = useCallback(async () => {
    try {
      // Step 1: Biometric authentication
      const authResult = await authenticateUser();

      if (!authResult.success) {
        setAppState('locked');
        return;
      }

      // Step 2: Check if onboarding is completed
      const bootstrapped = isBootstrapped();
      if (!bootstrapped) {
        setAppState('onboarding');
        return;
      }

      // Step 3: Ready to show dashboard
      setAppState('ready');
    } catch (error) {
      console.error('App initialization error:', error);
      setAppState('ready'); // Fallback: show app even on error
    }
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  const handleOnboardingComplete = useCallback(() => {
    setAppState('ready');
  }, []);

  const handleRetryAuth = useCallback(() => {
    setAppState('loading');
    initializeApp();
  }, [initializeApp]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppErrorBoundary>
          <ThemeProvider>
            <StatusBar barStyle="light-content" backgroundColor={ThemeColors.backgroundStart} />
            <OfflineBanner />
            {appState === 'loading' && <LoadingScreen />}
            {appState === 'locked' && <LockedScreen onRetry={handleRetryAuth} />}
            {appState === 'onboarding' && (
              <OnboardingScreen onComplete={handleOnboardingComplete} />
            )}
            {appState === 'ready' && <TabNavigator />}
            {appState === 'ready' && !isPremium && (
              <View style={styles.adBanner}>
                <Text style={styles.adBannerText}>
                  📢 Frosted Ad Placeholder — Go Pro in the Learn tab to remove ads
                </Text>
              </View>
            )}
          </ThemeProvider>
        </AppErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ============================================================
// LOADING SCREEN — Shown during biometric check
// ============================================================
function LoadingScreen() {
  return (
    <View style={styles.centeredContainer}>
      <Text style={styles.logoText}>WealthOS</Text>
      <Text style={styles.tagline}>Track, Plan & Simulate Wealth</Text>
      <ActivityIndicator
        size="large"
        color={ThemeColors.neonGreen}
        style={styles.spinner}
      />
      <Text style={styles.loadingText}>Authenticating...</Text>
    </View>
  );
}

// ============================================================
// LOCKED SCREEN — Shown when biometric fails
// ============================================================
function LockedScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.centeredContainer}>
      <Text style={styles.lockIcon}>🔒</Text>
      <Text style={styles.lockedTitle}>WealthOS Locked</Text>
      <Text style={styles.lockedSubtitle}>
        Authentication required to access your wealth dashboard.
      </Text>
      <Text
        style={styles.retryButton}
        onPress={onRetry}
      >
        Tap to Retry
      </Text>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ThemeColors.backgroundStart,
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: ThemeColors.backgroundStart,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  logoText: {
    color: ThemeColors.textPrimary,
    fontSize: Typography.size.display,
    fontWeight: Typography.weight.heavy,
    letterSpacing: Typography.letterSpacing.wider,
    marginBottom: Spacing.sm,
  },
  tagline: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.body,
    letterSpacing: Typography.letterSpacing.wide,
    marginBottom: Spacing.xxxl,
  },
  spinner: {
    marginBottom: Spacing.base,
  },
  loadingText: {
    color: ThemeColors.textMuted,
    fontSize: Typography.size.small,
  },
  lockIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  lockedTitle: {
    color: ThemeColors.neonAmber,
    fontSize: Typography.size.heading,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.md,
  },
  lockedSubtitle: {
    color: ThemeColors.textSecondary,
    fontSize: Typography.size.body,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  retryButton: {
    color: ThemeColors.neonGreen,
    fontSize: Typography.size.bodyLarge,
    fontWeight: Typography.weight.semibold,
    padding: Spacing.base,
  },
  adBanner: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 92 : 72, // Positioned precisely right above bottom tab bar!
    left: Spacing.base,
    right: Spacing.base,
    backgroundColor: 'rgba(25, 28, 36, 0.95)',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    borderRadius: Spacing.xs,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  adBannerText: {
    color: ThemeColors.textSecondary,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

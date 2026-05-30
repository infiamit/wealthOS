/**
 * WealthOS — MMKV Offline Storage Service
 * 
 * Ultra-fast local-only data persistence using react-native-mmkv.
 * C++ JSI bridge — 30x faster than AsyncStorage.
 * 
 * PRIVACY: Zero data leaves the device. No cloud sync, no backend.
 * "Not even our developers can see your net worth."
 */

import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import {
  AssetClass,
  WealthGoal,
  StreakState,
  CompletedStory,
  UserProfileState,
  DashboardConfig,
  MilestoneType,
} from '@/types';

// ============================================================
// MMKV Instance
// ============================================================
export const storage: MMKV = createMMKV({
  id: 'wealthos-storage',
});

// ============================================================
// STORAGE KEYS — Single source of truth for all key names
// ============================================================
const KEYS = {
  IS_BOOTSTRAPPED: 'user.isBootstrapped',
  IS_PRO_USER: 'user.isProUser',
  IS_BIOMETRIC_LOCKED: 'user.isBiometricLocked',
  TIME_MACHINE_TOKENS: 'user.timeMachineTokens',
  ASSETS: 'user.assets',
  GOALS: 'user.goals',
  STREAK: 'user.streak',
  COMPLETED_STORIES: 'user.completedStories',
  DASHBOARD_CONFIG: 'user.dashboardConfig',
  BOOKMARKS: 'user.bookmarks',
} as const;

// ============================================================
// TYPE-SAFE GETTER HELPERS
// ============================================================
const getJSON = <T>(key: string, fallback: T): T => {
  try {
    const raw = storage.getString(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const setJSON = <T>(key: string, value: T): void => {
  storage.set(key, JSON.stringify(value));
};

// ============================================================
// BOOTSTRAPPING — First-Run Setup
// ============================================================

/**
 * Check if the app has been bootstrapped (onboarding completed)
 */
export const isBootstrapped = (): boolean => {
  return storage.getBoolean(KEYS.IS_BOOTSTRAPPED) ?? false;
};

/**
 * Bootstrap initial user profile after onboarding.
 * Ensures the app NEVER launches with empty ₹0 data.
 * 
 * @param milestoneType - Which goal the user chose during onboarding
 * @param startingNetWorth - Initial lump sum from onboarding slider
 * @param monthlySip - Monthly SIP from onboarding slider
 */
export const bootstrapInitialProfile = (
  milestoneType: MilestoneType,
  startingNetWorth: number,
  monthlySip: number,
  equityCagr?: number,
  customTargetAmount?: number
): void => {
  // 1. Setup asset buckets using standard Indian benchmarks
  const initialAssets: AssetClass[] = [
    {
      id: 'eq_mf',
      name: 'Equity Mutual Funds',
      value: Math.round(startingNetWorth * 0.70),
      customExpectedCagr: equityCagr ?? 12.0,
      category: 'EQUITY',
    },
    {
      id: 'debt_fd',
      name: 'Fixed Deposits / EPF',
      value: Math.round(startingNetWorth * 0.20),
      customExpectedCagr: 7.0,
      category: 'DEBT',
    },
    {
      id: 'cash_bank',
      name: 'Bank Balance',
      value: Math.round(startingNetWorth * 0.10),
      customExpectedCagr: 4.0,
      category: 'CASH',
    },
  ];

  // 2. Setup chosen goal
  const goalConfig: Record<MilestoneType, { name: string; target: number }> = {
    ONE_CRORE: { name: '₹1 Crore Club', target: 10000000 },
    FIRE: { name: 'Full Financial Independence', target: 25000000 },
    BARISTA: { name: 'BaristaFIRE (Mental Freedom)', target: 12000000 },
  };

  const goal = goalConfig[milestoneType];
  const initialGoals: WealthGoal[] = [
    {
      id: 'main_milestone',
      name: goal.name,
      targetAmount: customTargetAmount ?? goal.target,
      monthlyContribution: monthlySip,
    },
  ];

  // 3. Initialize streak
  const initialStreak: StreakState = {
    currentStreak: 0,
    lastLoggedTimestamp: 0,
    bestStreak: 0,
  };

  // 4. Default dashboard config
  const defaultConfig: DashboardConfig = {
    showMilestones: true,
    showForecastChart: true,
    showScenarioSliders: true,
    activeAssetCategories: ['EQUITY', 'DEBT', 'CASH', 'GOLD'],
  };

  // 5. Write everything to MMKV
  storage.set(KEYS.IS_PRO_USER, false);
  storage.set(KEYS.IS_BIOMETRIC_LOCKED, true);
  storage.set(KEYS.TIME_MACHINE_TOKENS, 2); // Gift 2 starting tokens
  setJSON(KEYS.ASSETS, initialAssets);
  setJSON(KEYS.GOALS, initialGoals);
  setJSON(KEYS.STREAK, initialStreak);
  setJSON(KEYS.COMPLETED_STORIES, []);
  setJSON(KEYS.DASHBOARD_CONFIG, defaultConfig);
  storage.set(KEYS.IS_BOOTSTRAPPED, true);
};

// ============================================================
// ASSET OPERATIONS
// ============================================================

export const getAssets = (): AssetClass[] => {
  return getJSON<AssetClass[]>(KEYS.ASSETS, []);
};

export const saveAssets = (assets: AssetClass[]): void => {
  setJSON(KEYS.ASSETS, assets);
};

export const updateAssetValue = (assetId: string, newValue: number): void => {
  const assets = getAssets();
  const updated = assets.map((a) =>
    a.id === assetId ? { ...a, value: newValue } : a
  );
  saveAssets(updated);
};

export const updateAssetCagr = (assetId: string, newCagr: number): void => {
  const assets = getAssets();
  const updated = assets.map((a) =>
    a.id === assetId ? { ...a, customExpectedCagr: newCagr } : a
  );
  saveAssets(updated);
};

export const addAsset = (asset: AssetClass): void => {
  const assets = getAssets();
  assets.push(asset);
  saveAssets(assets);
};

export const removeAsset = (assetId: string): void => {
  const assets = getAssets().filter((a) => a.id !== assetId);
  saveAssets(assets);
};

// ============================================================
// GOAL OPERATIONS
// ============================================================

export const getGoals = (): WealthGoal[] => {
  return getJSON<WealthGoal[]>(KEYS.GOALS, []);
};

export const saveGoals = (goals: WealthGoal[]): void => {
  setJSON(KEYS.GOALS, goals);
};

export const updateGoal = (goalId: string, updates: Partial<WealthGoal>): void => {
  const goals = getGoals();
  const updated = goals.map((g) =>
    g.id === goalId ? { ...g, ...updates } : g
  );
  saveGoals(updated);
};

// ============================================================
// STREAK OPERATIONS
// ============================================================

const STREAK_GRACE_MS = 36 * 60 * 60 * 1000; // 36-hour grace window

export const getStreak = (): StreakState => {
  return getJSON<StreakState>(KEYS.STREAK, {
    currentStreak: 0,
    lastLoggedTimestamp: 0,
    bestStreak: 0,
  });
};

/**
 * Log a streak event. Returns the updated streak state.
 * - If within 36-hour grace window → increment streak
 * - If outside grace window → reset to 1
 */
export const logStreak = (): StreakState => {
  const now = Date.now();
  const streak = getStreak();

  const timeSinceLastLog = now - streak.lastLoggedTimestamp;

  let newStreak: StreakState;

  if (streak.lastLoggedTimestamp === 0) {
    // First ever log
    newStreak = {
      currentStreak: 1,
      lastLoggedTimestamp: now,
      bestStreak: 1,
    };
  } else if (timeSinceLastLog <= STREAK_GRACE_MS) {
    // Within grace window — increment
    const newCount = streak.currentStreak + 1;
    newStreak = {
      currentStreak: newCount,
      lastLoggedTimestamp: now,
      bestStreak: Math.max(streak.bestStreak, newCount),
    };
  } else {
    // Streak broken — reset
    newStreak = {
      currentStreak: 1,
      lastLoggedTimestamp: now,
      bestStreak: streak.bestStreak,
    };
  }

  setJSON(KEYS.STREAK, newStreak);
  return newStreak;
};

// ============================================================
// STORY OPERATIONS
// ============================================================

export const getCompletedStories = (): CompletedStory[] => {
  return getJSON<CompletedStory[]>(KEYS.COMPLETED_STORIES, []);
};

export const saveCompletedStory = (story: CompletedStory): void => {
  const stories = getCompletedStories();
  stories.push(story);
  setJSON(KEYS.COMPLETED_STORIES, stories);
};

export const isStoryCompleted = (storyId: string): boolean => {
  const stories = getCompletedStories();
  return stories.some((s) => s.storyId === storyId);
};

export const hasCompletedStoryToday = (): boolean => {
  const stories = getCompletedStories();
  if (stories.length === 0) return false;
  const today = new Date().toDateString();
  return stories.some((s) => new Date(s.votedTimestamp).toDateString() === today);
};

// ============================================================
// BOOKMARK OPERATIONS — Offline notes saving
// ============================================================

export const getBookmarkedNotes = (): string[] => {
  return getJSON<string[]>(KEYS.BOOKMARKS, []);
};

export const toggleBookmarkNote = (noteId: string): void => {
  const bookmarks = getBookmarkedNotes();
  const index = bookmarks.indexOf(noteId);
  if (index > -1) {
    bookmarks.splice(index, 1);
  } else {
    bookmarks.push(noteId);
  }
  setJSON(KEYS.BOOKMARKS, bookmarks);
};

export const isNoteBookmarked = (noteId: string): boolean => {
  const bookmarks = getBookmarkedNotes();
  return bookmarks.includes(noteId);
};

// ============================================================
// DASHBOARD CONFIG OPERATIONS
// ============================================================

export const getDashboardConfig = (): DashboardConfig => {
  return getJSON<DashboardConfig>(KEYS.DASHBOARD_CONFIG, {
    showMilestones: true,
    showForecastChart: true,
    showScenarioSliders: true,
    activeAssetCategories: ['EQUITY', 'DEBT', 'CASH', 'GOLD'],
  });
};

export const saveDashboardConfig = (config: DashboardConfig): void => {
  setJSON(KEYS.DASHBOARD_CONFIG, config);
};

// ============================================================
// PRO / PREMIUM STATUS
// ============================================================

export const isProUser = (): boolean => {
  return storage.getBoolean(KEYS.IS_PRO_USER) ?? false;
};

export const setProUser = (isPro: boolean): void => {
  storage.set(KEYS.IS_PRO_USER, isPro);
};

// ============================================================
// BIOMETRIC LOCK PREFERENCE
// ============================================================

export const isBiometricLocked = (): boolean => {
  return storage.getBoolean(KEYS.IS_BIOMETRIC_LOCKED) ?? true;
};

export const setBiometricLocked = (locked: boolean): void => {
  storage.set(KEYS.IS_BIOMETRIC_LOCKED, locked);
};

// ============================================================
// FULL PROFILE READ (for debugging / export)
// ============================================================

export const getFullProfile = (): UserProfileState => {
  return {
    isBiometricLocked: isBiometricLocked(),
    isProUser: isProUser(),
    timeMachineTokens: storage.getNumber(KEYS.TIME_MACHINE_TOKENS) ?? 0,
    assets: getAssets(),
    goals: getGoals(),
    streak: getStreak(),
    completedStories: getCompletedStories(),
    dashboardConfig: getDashboardConfig(),
  };
};

/**
 * DANGER: Wipes all local data. Used only for full reset.
 */
export const resetAllData = (): void => {
  storage.clearAll();
};

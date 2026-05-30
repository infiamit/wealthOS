# React Native Developer Specification (Modular Research Compendium)

This document serves as the absolute technical blueprint and developer specification for the **Personal Wealth App & Indian Wealth Simulator** targeting **Expo SDK 56**. It aggregates our mathematical engines, offline state structures, biometric security protocols, and UI system guidelines to enable flawless, pure client-side mobile execution.

---

## 🏗️ 1. Platform Architecture

To maintain the highest performance, absolute offline security, and zero server maintenance costs, the app is structured strictly as a single client-side mobile project developed in **React Native (Expo SDK 56)**. All calculations, streaks, and user ledger profiles remain local-only.

---

## 💾 2. Offline-First MMKV Database Schemas

All local persistence is isolated strictly on the client using **React Native MMKV** (the fastest local storage engine for React Native, yielding near-instant key reads/writes directly in-memory).

```typescript
// 1. Manual Ledger Asset Schema
export interface AssetClass {
  id: string; // unique UUID
  name: string; // e.g., "Equity Mutual Funds"
  value: number; // INR ₹
  customExpectedCagr: number; // e.g., 0.12 (12%)
  category: 'EQUITY' | 'DEBT' | 'CASH' | 'GOLD' | 'LIABILITY';
}

// 2. Goal & Milestone Schema
export interface WealthGoal {
  id: string;
  name: string; // e.g., "₹1 Crore Dream"
  targetAmount: number;
  monthlyContribution: number;
}

// 3. User Daily Streak Tracker
export interface StreakState {
  currentStreak: number;
  lastLoggedTimestamp: number; // Unix Epoch Milliseconds
  bestStreak: number;
}

// 4. Daily Story Performance Tracker
export interface CompletedStory {
  storyId: string;
  votedOption: 'A' | 'B' | 'C';
  votedTimestamp: number;
  wasOptimalChoice: boolean;
}

// 5. Consolidated Offline User Profile
export interface UserProfileState {
  isBiometricLocked: boolean; // Local Security Boolean
  timeMachineTokens: number; // Consumable game items
  assets: AssetClass[];
  goals: WealthGoal[];
  streak: StreakState;
  completedStories: CompletedStory[];
}
```

---

## 📐 3. Mathematical Solvers & Engines (`src/math/`)

This clean copy-paste library contains the core TS solvers built during our research.

```typescript
// ==========================================
// A. Combined Lump Sum + SIP Formula
// ==========================================
export interface SipInputs {
  lumpSum: number;
  monthlyInvestment: number;
  expectedAnnualReturn: number;
  years: number;
  annualInflationRate: number;
}

export const calculateCombinedSip = (inputs: SipInputs) => {
  const totalInvested = inputs.lumpSum + (inputs.monthlyInvestment * inputs.years * 12);
  const totalMonths = inputs.years * 12;
  const iNominal = inputs.expectedAnnualReturn / 12;

  // Nominal Compounding
  const fvNominal = (inputs.lumpSum * Math.pow(1 + iNominal, totalMonths)) +
    inputs.monthlyInvestment * ((Math.pow(1 + iNominal, totalMonths) - 1) / iNominal) * (1 + iNominal);

  // Real Inflation-Adjusted Compounding
  const realAnnualRate = ((1 + inputs.expectedAnnualReturn) / (1 + inputs.annualInflationRate)) - 1;
  const iReal = realAnnualRate / 12;
  const fvReal = (inputs.lumpSum * Math.pow(1 + iReal, totalMonths)) +
    inputs.monthlyInvestment * ((Math.pow(1 + iReal, totalMonths) - 1) / iReal) * (1 + iReal);

  return {
    totalInvested: Math.round(totalInvested),
    futureValueNominal: Math.round(fvNominal),
    futureValueReal: Math.round(fvReal),
    wealthGained: Math.round(Math.max(0, fvNominal - totalInvested))
  };
};

// ==========================================
// B. BaristaFIRE Partial Retirement Formula
// ==========================================
export interface FireInputs {
  monthlyExpensesToday: number;
  monthlySideIncome: number;
  customSWR: number; // e.g. 0.04 (4% Safe Withdrawal)
}

export const calculateBaristaFire = (inputs: FireInputs) => {
  const annualExpenses = inputs.monthlyExpensesToday * 12;
  const annualSideIncome = inputs.monthlySideIncome * 12;
  const netAnnualExpenses = Math.max(0, annualExpenses - annualSideIncome);

  const standardFireCorpus = annualExpenses / inputs.customSWR;
  const baristaFireCorpus = netAnnualExpenses / inputs.customSWR;

  return {
    standardFireCorpus: Math.round(standardFireCorpus),
    baristaFireCorpus: Math.round(baristaFireCorpus),
    capitalSaved: Math.round(Math.max(0, standardFireCorpus - baristaFireCorpus))
  };
};

// ==========================================
// C. Logarithmic Milestone Target Date Solver
// ==========================================
export interface GoalInputs {
  targetAmount: number;
  currentNetWorth: number;
  monthlyContribution: number;
  expectedAnnualReturn: number;
}

export const solveMilestoneTargetDate = (inputs: GoalInputs): string => {
  const { targetAmount, currentNetWorth, monthlyContribution, expectedAnnualReturn } = inputs;
  
  if (currentNetWorth >= targetAmount) return "Achieved!";

  let monthsRemaining = 0;
  if (expectedAnnualReturn <= 0) {
    monthsRemaining = Math.ceil((targetAmount - currentNetWorth) / monthlyContribution);
  } else {
    const i = expectedAnnualReturn / 12;
    const factor = monthlyContribution * ((1 + i) / i);
    monthsRemaining = Math.ceil(Math.log((targetAmount + factor) / (currentNetWorth + factor)) / Math.log(1 + i));
  }

  const today = new Date();
  today.setMonth(today.getMonth() + monthsRemaining);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[today.getMonth()]} ${today.getFullYear()}`;
};
```

---

## 🎨 4. Premium FinTech Design Tokens & Interaction Rules

Developers must strictly adhere to these visual specs to establish the premium visual style:

### Theme Colors (Radial Dark Indigo Theme)
```typescript
export const ThemeColors = {
  backgroundStart: '#0B0C10',
  backgroundEnd: '#1F2833',
  frostedPanel: 'rgba(25, 28, 36, 0.75)',
  neonGreen: '#39FF14',    // Highly volatile stocks / optimal path
  neonCyan: '#00FFFF',     // Debt instruments / steady path
  neonAmber: '#FFA500',    // Warnings / depletion alerts
  goldMetallic: '#FFD700', // Milestones / ₹1 Crore line
  borderLight: 'rgba(255, 255, 255, 0.1)',
};
```

### Micro-Animations
* **Sliders**: Sliders must employ spring physics via **Moti** or **React Native Reanimated** (`withSpring(value, { damping: 15 })`), avoiding linear transitions. Dragging sliders must instantly morph compound line points.
* **Toggles**: Switching state (e.g. from Buy to Rent, or standard SWR to BaristaFIRE) triggers a subtle Expo Haptics Selection click:
  ```typescript
  import * as Haptics from 'expo-haptics';
  const handleToggle = () => {
    Haptics.selectionAsync();
    setMode(prev => !prev);
  };
  ```
* **Daily Streak Sparkler**: Hitting a daily log streak renders a brief localized dynamic canvas particle burst over the Flame icon, rewarding the user's brain for a job well done.

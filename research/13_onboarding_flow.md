# Module 13: Premium Onboarding Flow & First-Run Data Bootstrap

This document details the visual layouts, user psychology, and database bootstrapping rules for the **Onboarding Flow** to eliminate cold "empty-state" screens and capture immediate emotional engagement.

---

## 🧭 Executive Summary
Entering an empty tracker showing a net worth of **₹0** kills financial motivation and drives user churn. To ensure a highly stimulating first-run experience, we design a frictionless **4-Step Onboarding Flow**. This flow establishes our privacy value proposition, prompts the user to choose an emotional milestone, bootstraps their initial manual ledger via simple sliders, and launches the Core dashboard pre-populated with compounding charts and concrete target dates.

---

## 📱 Tab-by-Tab Onboarding Wireframes & User Journey

The onboarding runs inside a full-screen, horizontal swiper card layout with spring animations.

```
       Step 1                 Step 2                 Step 3                 Step 4
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  🔒 PRIVACY POCT │   │  🎯 THE TARGET   │   │  📈 QUICK LOGS   │   │  📅 FREEDOM DATE │
│ "Zero databases. │   │ Choose Milestone:│   │ Sliders:         │   │ "August 2031"    |
│  Your data stays │   │ [ ] ₹1 Crore Club│   │ [Lump sum: 2L]   │   │ Progress: 10%    |
│  strictly local" │   │ [x] Barista FIRE │   │ [Monthly SIP: 20k│   │ [Enter Core App] │
└──────────────────┘   └──────────────────┘   └──────────────────┘   └──────────────────┘
```

### 🔒 Step 1: The Privacy Pledge & Welcome
* **The Psychology**: Address data security fears immediately to differentiate from Groww/INDmoney.
* **UI/UX Layout**: A frosted, glassmorphic card set against a deep navy radial glow. Text reads:
  > **VIBE WEALTH**
  > *Your Money. Strictly Private.*
  > 
  > We have zero databases. No accounts. No SMS trackers. Your financial records are locked locally inside your device. Not even our developers can see your net worth.
* **Interaction**: A prominent golden button reading *"I Accept & Value Privacy"* slides to Step 2.

---

### 🎯 Step 2: Choose Your Freedom Milestone
* **The Psychology**: Force the user to visualize *why* they are saving, hooking their emotional focus.
* **UI/UX Layout**: Three premium cards with linear gradients representing our standard milestones:
  1. **₹1 Crore Club (The Capitalist)**: Standard wealth metric card.
  2. **Financial Independence (Full FIRE)**: Complete job escape card.
  3. **Mental Freedom (BaristaFIRE)**: Retiring early from corporate stress via passion side-hustles.
* **Interaction**: Selecting a card triggers an active border glow (`#39FF14`) and automatically advances to Step 3.

---

### 📈 Step 3: Quick Capital Sliders
* **The Psychology**: Fast, manual inputs that take under 15 seconds. Bypasses the friction of database API bank-linking.
* **UI/UX Layout**: Simple, highly tactile slider controls:
  * **Slider A: My Current Savings (Lump Sum)**: Starts at ₹1,00,000 (Increments of ₹50,000).
  * **Slider B: My Monthly Additions (SIP)**: Starts at ₹10,000 (Increments of ₹2,000).
  * **Slider C: Expected CAGR Return**: Defaults to 12% (Equity average).
* **Interaction**: Clicking *"Solve My Timeline"* triggers a satisfying deep haptic vibration, calculates the timeline, and advances to Step 4.

---

### 📅 Step 4: The Emotional Reveal
* **The Psychology**: Translate dry numbers into a concrete timeline. August 2031 is a specific, memorable age-marker.
* **UI/UX Layout**:
  * Displays the target date inside a glowing gold card:
    > "Estimated Target Date: **August 2031**"
  * Progress Bar: Renders a linear timeline displaying:
    > `₹2,00,000 / ₹1,00,00,000  [2% Completed]`
* **Interaction**: Clicking *"Enter My Dashboard"* triggers a coin-clink sound effect, saves the inputs directly to the local MMKV database, and launches the **Core Tab** pre-loaded with these variables. The dashboard is instantly alive with line charts, fans, and indicators!

---

## 💾 MMKV First-Run Bootstrapping Database Routine

Upon clicking "Enter My Dashboard" in Step 4, the app runs a C++ JSI MMKV script to write the initial state, ensuring the app never launches with null values.

```typescript
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

export const bootstrapInitialProfile = (
  milestoneType: 'ONE_CRORE' | 'FIRE' | 'BARISTA',
  startingNetWorth: number,
  monthlySip: number
) => {
  // 1. Setup asset buckets using standard Indian benchmarks
  const initialAssets = [
    { id: 'eq_mf', name: 'Equity Mutual Funds', value: startingNetWorth * 0.70, customExpectedCagr: 12.0, category: 'EQUITY' },
    { id: 'debt_fd', name: 'Fixed Deposits', value: startingNetWorth * 0.20, customExpectedCagr: 7.0, category: 'DEBT' },
    { id: 'cash_bank', name: 'Bank Balance', value: startingNetWorth * 0.10, customExpectedCagr: 4.0, category: 'CASH' }
  ];

  // 2. Setup chosen goal
  const initialGoals = [
    {
      id: 'main_milestone',
      name: milestoneType === 'ONE_CRORE' ? '₹1 Crore Club' : milestoneType === 'FIRE' ? 'Full FIRE' : 'Barista mental retirement',
      targetAmount: milestoneType === 'ONE_CRORE' ? 10000000 : milestoneType === 'FIRE' ? 25000000 : 12000000,
      monthlyContribution: monthlySip
    }
  ];

  // 3. Write profile variables
  storage.set('user.isProUser', false);
  storage.set('user.timeMachineTokens', 2); // Gift 2 starting tokens
  storage.set('user.assets', JSON.stringify(initialAssets));
  storage.set('user.goals', JSON.stringify(initialGoals));
  storage.set('user.streak', JSON.stringify({ currentStreak: 0, lastLoggedTimestamp: 0, bestStreak: 0 }));
  storage.set('user.completedStories', JSON.stringify([]));
  storage.set('user.isBootstrapped', true); // Flag to skip onboarding next time
};
```

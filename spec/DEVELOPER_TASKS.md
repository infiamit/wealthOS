# AI Coding Agent Implementation Task Checklist

This document is the official, step-by-step developer playbook for building the **Personal Wealth App & Indian Wealth Simulator**. Any AI coding agent tasked with bootstrapping or writing the codebase must execute these phases and tasks in strict sequential order.

---

## 🛠️ Phase 1: Setup & Foundational Scaffolding

### Task 1.1: Initialize Expo SDK 56 Project
* **Action**: Initialize a clean TypeScript Expo SDK 56 app inside the root directory (`./`).
* **Shell Command**:
  ```bash
  npx create-expo-app@56.0.0 ./ --template blank-typescript --yes
  ```

### Task 1.2: Install Lean Performance Dependencies
* **Action**: Install our targeted library stack, locking strictly to Expo SDK 56 matching versions.
* **Shell Command**:
  ```bash
  npx expo install react-native-mmkv react-native-reanimated moti react-native-svg react-native-gifted-charts expo-local-authentication expo-notifications @react-native-community/netinfo
  ```

### Task 1.3: Configure TS Path Aliases
* **Action**: Edit `tsconfig.json` and `app.json` (or `metro.config.js` if required) to support absolute path imports starting with `@/` pointing to the `src/` directory.

### Task 1.4: Initialize Globals, Theme, & Error Boundary
* **Action**: Create `src/styles/theme.ts` containing the premium radial dark theme constants.
* **Action**: Create `src/components/AppErrorBoundary.tsx` incorporating the corrected `this.props.children` rendering logic.
* **Action**: Configure `App.tsx` as the entry root, wrapping the layout inside `AppErrorBoundary` and our `ThemeProvider`.

### Task 1.5: Implement Local Biometric Lock
* **Action**: Create `src/services/biometricAuth.ts` wrapping `expo-local-authentication`.
* **Action**: Configure `App.tsx` to call the biometric unlock prompt upon mounting before displaying the dashboard.

---

## 📐 Phase 2: Core Math Library & Offline DB

### Task 2.1: Bootstrap MMKV Database Service
* **Action**: Create `src/services/storage.ts` using `react-native-mmkv` to load, write, and serialize offline profiles.
* **Action**: Implement the `bootstrapInitialProfile` routine to ensure first-run users never launch with an empty/₹0 dashboard.

### Task 2.2: Implement Mathematical Engine Library
* **Action**: Create `src/math/engine.ts` containing the core, copy-paste TypeScript mathematical solvers:
  * Combined Lump Sum + SIP Solver: `calculateCombinedSip`
  * BaristaFIRE Partial Retirement Solver: `calculateBaristaFire`
  * Logarithmic Milestone Target Date Solver: `solveMilestoneTargetDate`
  * Stochastic Monte Carlo Forecast solver: `runMonteCarloSimulation` (incorporating Box-Muller).

---

## 📱 Phase 3: Tab Navigator & Core Tab UI

### Task 3.1: Configure Bottom Tab Navigation
* **Action**: Create `src/navigation/TabNavigator.tsx` implementing 4 bottom tabs: Core, Daily, Snapshot, and Learn, utilizing simple custom SVG vectors.

### Task 3.2: Code the Snapshot Tab (Data Entry)
* **Action**: Create `src/screens/SnapshotScreen.tsx`.
* **Action**: Build a friction-free grid displaying Equity, Debt, Cash, and Gold balances with custom CAGR input sliders. Saving writes instantly to MMKV and triggers `Haptics.notificationAsync`.

### Task 3.3: Code the Core Tab (Compounding Sandbox)
* **Action**: Create `src/screens/CoreScreen.tsx` displaying current net worth and goal milestone progress bars (e.g. `₹34L / ₹1Cr | 34%`).
* **Action**: Integrate `react-native-gifted-charts` to draw the smooth 40-year percentile fan chart (10th, 50th, 90th percentile).
* **Action**: Code spring-loaded sliders (`moti`) adjusting SIPs, increments, rent, and CAGR return variables, instantly recalculating and redrawing the fan chart and the floating emotional target card (e.g., `August 2031`).

---

## 🎮 Phase 4: Daily Tab & Streak Engines

### Task 4.1: Code the Daily Tab Swiper Cards
* **Action**: Create `src/screens/DailyScreen.tsx`.
* **Action**: Implement Tinder-style card swipes (Swipe Left/Right) using Reanimated layout gestures.
* **Action**: Load the daily story JSON from CDN via `fetch()`. If offline, fall back to the 30-day pre-cached local pool.

### Task 4.2: Code Daily Outcomes & AdMob triggers
* **Action**: Integrate Google AdMob interstitial triggers. Tapping "View simulated outcome" fires a 5-second ad overlay.
* **Action**: On ad close, flip card to reveal color-coded outcome chart curves.

### Task 4.3: Implement the Daily Streak Flame & Notifications
* **Action**: Schedule on-device daily local notifications via `expo-notifications` (36-hour grace window).
* **Action**: Render the Duolingo-style fire flame icon displaying the active streak count on the Daily dashboard.

---

## 📖 Phase 5: Learn Tab & Compilation

### Task 5.1: Code the Learn Tab
* **Action**: Create `src/screens/LearnScreen.tsx`.
* **Action**: Populate the scrollable feed with our fully written **15 Curated Wealth Notes** articles.
* **Action**: Code the daily financial mini-quiz component, vibrating green on success and red on failure.

### Task 5.2: Offline NetInfo Banner
* **Action**: Wrap the tab headers in a connection banner. If offline, NetInfo triggers a warm amber banner: *"Offline Mode - Local Fallbacks Enabled"*.

### Task 5.3: Production App Build & Audit
* **Action**: Execute compilation checks via EAS CLI:
  ```bash
  npx expo-doctor
  eas build --platform android --local
  ```
* **Action**: Audit the final binary package size (ensuring it compiles under 15MB).

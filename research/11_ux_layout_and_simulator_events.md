# Module 11: Coherent UX Wireframes & Indian Economic Event Library

This document provides the visual screen blueprints, interactive wireframes, and the data-backed **Historical Indian Economic Event Library** designed to drive educational gamification in the **Indian Wealth Simulator** and **Daily Stories**.

---

## 🧭 Executive Summary
To prevent our application from looking like an assortment of disjointed tools, we establish a **Unified 4-Tab Product Frame**. The app functions as a single compound sandbox and daily decision loop. Additionally, we specify the under-the-hood **Indian Economic Event Library** (from 1999 to 2025) using actual Nifty volatility data (e.g., 2008's -51.3% crash and 2009's +77.6% recovery) to teach users sequence-of-returns risk and long-term holding strategies.

---

## 🎨 1. Tab-by-Tab Visual Wireframe Mockups

These ASCII schematics detail the premium, glassmorphic layout of each tab, serving as a ready guide for React Native component coding.

### A. 📈 The Core Tab
Displays their overall wealth, progress metrics, and the real-time "What-If" timeline sandbox.

```
+-------------------------------------------------------------+
|  [📈 CORE]         [🎮 DAILY]         [📊 SNAPSHOT]  [📖 LEARN] |
+-------------------------------------------------------------+
|                                                             |
|   YOUR NET WORTH TODAY                                      |
|   ₹34,50,000  (compounding at ~10.4% weighted CAGR)         |
|                                                             |
|   MILESTONE PROGRESS: ₹1 Crore Goal                         |
|   [=====================>......................]  34.5%      |
|                                                             |
|   ESTIMATED DATE OF FREEDOM:                                |
|   +-------------------------------------+                   |
|   |         📅  August 2031             |  <- Floating Card|
|   +-------------------------------------+                   |
|                                                             |
|   FORECAST CHART (Percentile Fan)                           |
|   ₹2Cr +                                     / 90th % (Best)|
|        |                                    /               |
|   ₹1Cr |-------------------*---------------/-- 50th % (Med) |
|        |                  /               /                 |
|     ₹0 +-----------------*---------------/---- 10th % (Worst|
|       Age 30           Age 35          Age 40               |
|                                                             |
|   🎛️ WHAT-IF SCENARIO SLIDERS (Spring Damping Moti)          |
|   [Monthly SIP: ₹30,000]       ---( O )-------------------- |
|   [Annual Hike: 8%]            -----( O )------------------ |
|   [Nominal return: 12%]        -------( O )---------------- |
|                                                             |
+-------------------------------------------------------------+
```

---

### B. 🎮 The Daily Tab
Hosts the Reigns-style card swipe daily voting game and the glowing Duolingo-style streak counter.

```
+-------------------------------------------------------------+
|  [📈 CORE]         [🎮 DAILY]  🔥 12    [📊 SNAPSHOT]  [📖 LEARN] |
+-------------------------------------------------------------+
|                                                             |
|   TODAY'S WEALTH STORY                                      |
|   +-----------------------------------------------------+   |
|   |  Rahul is 28 and earns ₹12 Lakh per year. He has    |   |
|   |  ₹3 Lakh in savings and wants a new SUV...          |   |
|   |                                                     |   |
|   |     <- Swipe Left                 Swipe Right ->    |   |
|   |     (Buy Used Cash)               (Buy New on EMI)  |   |
|   |                                                     |   |
|   |               [ Vote / Swipe Card ]                 |   |
|   +-----------------------------------------------------+   |
|                                                             |
|   COMMUNITY RESPONSE SPREAD (Revealed Post-Vote)             |
|   [x] Option A: Skip/SIP (50% voted) |====================] |
|   [ ] Option B: Used Hatch (35%)     |==============]       |
|   [ ] Option C: SUV on EMI (15%)     |======]               |
|                                                             |
|   OUTCOME IMPACT CHART                                      |
|   ₹80L |                                 / Option C (Max MF)|
|   ₹40L |                                /  Option B (Hatch) |
|     ₹0 +-------------------------------/---Option A (SUV)   |
|       Year 0                        Year 10                 |
|                                                             |
+-------------------------------------------------------------+
```

---

### C. 📊 The Snapshot Tab
The zero-friction, privacy-first monthly ledger entry screen.

```
+-------------------------------------------------------------+
|  [📈 CORE]         [🎮 DAILY]         [📊 SNAPSHOT]  [📖 LEARN] |
+-------------------------------------------------------------+
|                                                             |
|   QUICK MONTHLY SNAPSHOT LOG                                |
|   Update your offline asset totals. No DB, strictly private.|
|                                                             |
|   ASSET BUCKET                 VALUE (₹)       CAGR (%)     |
|   🟢 Equity Mutual Funds      [ 18,00,000 ]    [ 12.0 ]     |
|   🔵 Fixed Deposits / EPF     [  8,50,000 ]    [  7.0 ]     |
|   🟡 Physical Gold            [  5,00,000 ]    [  8.0 ]     |
|   🟢 Cash / Bank Balance      [  3,00,000 ]    [  4.0 ]     |
|                                                             |
|   TOTAL NET WORTH: ₹34,50,000                               |
|                                                             |
|   +-----------------------------------------------------+   |
|   |   💾  Save Today's Snapshot & Secure Streak          |   |
|   +-----------------------------------------------------+   |
|                                                             |
+-------------------------------------------------------------+
```

---

### D. 📖 The Learn Tab
The snackable educational interface containing calculations explainers and short quizzes.

```
+-------------------------------------------------------------+
|  [📈 CORE]         [🎮 DAILY]         [📊 SNAPSHOT]  [📖 LEARN] |
+-------------------------------------------------------------+
|                                                             |
|   WEALTH NOTES                                              |
|   * [Note #1: The Rule of 72 (Time to Double Capital)]      |
|   * [Note #2: Safe Withdrawal Rates & Sequence Risk]        |
|   * [Note #3: Why Retail Inflation is the Silent Wealth Tax]|
|                                                             |
|   DAILY QUICK MINI-QUIZ                                     |
|   "During 2008, the Nifty 50 crashed by 51.3%. What was the |
|   best action for an investor starting their SIP?"          |
|                                                             |
|   ( ) Stop the SIP to save cash.                            |
|   ( ) Panicsell investments to secure remaining balance.     |
|   (x) Continue the SIP to accumulate units cheap (SIP win!).|
|                                                             |
|   [ Check Answer (Vibrates Green on success) ]              |
|                                                             |
+-------------------------------------------------------------+
```

---

## 🎮 2. Indian Wealth Simulator Game: Screen Layouts

When the user enters **Game Mode** inside the Simulator, the layout shifts to a structured year-by-year turn dashboard:

1. **The Game Header**: Displays `Age: 22`, `Year: Turn 1/40`, `Cash Balance: ₹25,000`, `Portfolio: ₹0`.
2. **The Decision Feed**: Cards appear asking for annual decisions. E.g., Turn 1: *"Do you rent a room with roommates for ₹5,000/month or rent an independent 1BHK for ₹12,000/month?"*
3. **The Compounding Meter**: Under the hood, the TypeScript projection engine compounds their SIPs and stocks year-over-year.

---

## 📈 3. Historical Indian Economic Event Card Library

To make the game deeply data-backed and educational, the Event Cards are derived directly from actual Indian market returns and historical events (Nifty CAGR averages and volatility):

### 📉 Year 2000 (The Dot-Com Dust)
* **Macro Environment**: Nifty 50 drops by **-15.0%**. Tech layoffs begin.
* **Simulator Effect**: Tech salaries are frozen (0% annual increment). Stock and Mutual fund balances shrink by 15%. Debt/FD investments continue paying a high 8.5% historical risk-free return.
* **Educational Lesson**: Emphasizes the importance of debt allocation during equity bear phases.

### 🚀 Years 2003 - 2007 (The India Shining Bull Run)
* **Macro Environment**: Unprecedented growth. Nifty 50 CAGR climbs at **+30% annually**. Real estate prices double in major cities like Gurgaon and Bangalore.
* **Simulator Effect**: Stock assets appreciate massively. Corporate salary hikes surge (15-20% increments). Users are tempted to take massive home loans.
* **Educational Lesson**: Teaches how compounding speeds up during bull runs, but warns users against overleveraging on expensive properties near the top of the market cycle.

### 💣 Year 2008 (The Global Financial Crisis - Worst Nifty Year)
* **Macro Environment**: Nifty 50 crashes by **-51.3%**. Global liquidity dries up.
* **Simulator Choice Card**:
  * **Option A**: Panicsell stocks. Liquidate stock/SIP holdings to cash (guarantees a 51% loss).
  * **Option B**: Stop SIP. Freeze all new monthly investments and hold cash.
  * **Option C (Optimal)**: Double down. Keep the SIP active and buy the crash at 50% discount.
* **Educational Lesson**: Teaches **Sequence-of-Returns Risk**. If a user panic-sells, their wealth never recovers. If they double down, they buy mutual fund units at supreme historic discounts.

### 🌟 Year 2009 (The Sovereign Spring - Best Nifty Year)
* **Macro Environment**: Nifty 50 surges by **+77.6%** in an aggressive v-shaped recovery.
* **Simulator Effect**:
  * If the user panic-sold in 2008: They sit on cash and miss the 77% surge.
  * If the user doubled down in 2008: Their portfolio values double instantly, setting them up for a massive early retirement trajectory!

### 🛑 Year 2016 (Demonetization Stagnation)
* **Macro Environment**: Cash liquidity is squeezed. Real estate transactions drop, and city property values stagnate or fall by 10%. Equity remains resilient.
* **Simulator Effect**: Real estate assets experience zero growth. Users with heavy property debt feel the pinch of high EMIs while capital growth halts.
* **Educational Lesson**: Demonstrates the liquidity risk of real estate compared to liquid paper assets like index mutual funds.

### 🦠 Year 2020 (The COVID-19 Cascade & Retail Wave)
* **Macro Environment**: Nifty crashes 30% in March, then stages a massive recovery to end the year up +15%. Tech increments and remote-work tech booms.
* **Simulator Effect**: Highly volatile year. Tech salaries get a 20% remote-work bump. Direct equity investments surge as retail users flock to apps.
* **Educational Lesson**: Showcases rapid market rebounds and the power of remaining invested during sudden black-swan crises.

---

## 🎛️ 4. Dashboard Customization Settings (Minimalist Toggle)

As requested, to prevent clutter and keep the app highly personalized, the Settings page contains **Layout Toggles**. These options are stored locally in MMKV:

```typescript
interface DashboardConfig {
  showMilestones: boolean;
  showForecastChart: boolean;
  showScenarioSliders: boolean;
  activeAssetCategories: string[]; // e.g. ['EQUITY', 'GOLD', 'CASH']
}
```

* **Toggle Off Sliders**: Toggling off `showScenarioSliders` collapses the Core tab sliders into a simple icon, transforming the UI into a clean, minimalist net worth display.
* **Filter Asset Buckets**: Users can hide specific asset categories they do not own (e.g., hiding Liabilities or Gold), keeping their manual Snapshot grid completely clean.

# Goal: Personal Wealth App & Indian Wealth Simulator Game

Everything in this project revolves around **wealth**—generating it, tracking it, compounding it, and simulating it. 

The primary target is absolute simplicity, engagement, and **impenetrable privacy**. By storing all data strictly **offline/local-only** on the user's device, we ensure zero backend cost and complete data security (not even a database admin can see a user's net worth).

---

## 🎯 Primary Vision & Target Audience

* **First User**: **Amit** (You!). Designed to solve your custom scenarios and tracker frustrations.
* **Core Philosophies**:
  * **Privacy First (Offline-Only)**: Zero API sync, zero backend databases. All local storage via MMKV.
  * **Biometric Lock Security**: Because this is a private wealth app, users can secure their dashboard locally using Face ID / Fingerprint biometric authentication.
  * **No Heavy Trackers**: We will not compete with INDmoney, Groww, or ET Money on live stock tracking or broker transaction imports. Instead, we offer a clean, manual monthly net worth ledger.
  * **Visual Delight**: Exceptional, premium glassmorphic UI/UX that engages the brain and drives daily retention.
  * **Educational Core**: Integrate snackable financial literacy builders, standard explanations, and mathematical formulas directly in the UI to actively educate users.
* **Delivery Platform**: A beautiful, high-performance pure **React Native App (Expo SDK 56)** built inside a single client-side repository.

---

## 📱 Unified 4-Tab Product Structure

To ensure the application feels like **one cohesive, powerful product**, all features are categorized into four primary tabs. Users also have the future option to hide/customize dashboards based on their personal cognitive preferences.

```
       📱 PERSONAL WEALTH & SIMULATOR APP (4-TAB CORE)
  ┌──────────────────────────────────────────────────────────┐
  │  [📈 CORE]     [🎮 DAILY]     [📊 SNAPSHOT]   [📖 LEARN] │
  │  What-If       Dilemmas,      Manual ledger,  Notes,     │
  │  Timeline      Compounding    Quick edits,    Explaners, │
  │  Sandbox &     Outcome Charts, Asset buckets  Interactive│
  │  Projections   Daily Streaks  CAGR inputs     Quizzes    │
  └──────────────────────────────────────────────────────────┘
```

### 1. 📈 Core Tab (The Compounding Sandbox)
* **Net Worth Today**: Glowing digital ledger display.
* **Goal Milestones**: Visual progress bars displaying percentage targets (e.g., `₹34L / ₹1Cr | 34%`).
* **Forecast Chart**: Dynamic percentile fan (Worst, Median, Best) projecting 5 to 40 years.
* **Scenario Sliders**: Live, tactile spring-loaded sliders to tweak: *Salary Growth, Monthly SIP, Rent vs. Home Loan EMI, expected Inflation, and Portfolio Return CAGR*. Adjusting sliders instantly morphs the forecast chart and emotional milestone target dates.

### 2. 🎮 Daily Tab (Gamified Micro-Engagement)
* **Daily Wealth Story**: Snackable card presenting a financial dilemma (e.g., *"Rahul is 28..."*).
* **One Decision**: Reigns-style card swipes (Swipe Left, Swipe Right) to vote on choice.
* **One Result**: Flip animation displaying the simulated 15-year compound outcome chart + zero-cost community vote spreads.
* **Optional Streak**: Glowing Duolingo-style fire widget representing daily wealth logging consistency.

### 3. 📊 Snapshot Tab (Manual Offline Ledger)
* **Manual Monthly Update**: Clean, friction-free spreadsheet-style grid to edit asset classes.
* **Asset Buckets**: Segregated columns for Equity, Debt, Cash, and Gold with custom CAGR return assumptions.
* **Quick Edit**: Rapid click-to-edit values with standard haptic selection confirmations.

### 4. 📖 Learn Tab (Educational Hub)
* **Wealth Notes**: Clean, bookmarkable financial summaries.
* **Short Explanations**: Snackable math engines breakdowns, rule explanations (e.g., Rule of 72, 4% SWR), and terminology indices.
* **Interactive Quizzes**: Mini-scenarios testing knowledge based on historical Indian economy outcomes.

---

## 📂 Project Repository Directory Layout

```
vibe/
├── GOAL.md                       # This document (vision, features, layout)
├── QUESTIONS_ANSWERS.md          # Active Q&A log to align with the first user
├── .agent_rules.md               # Governs research standards, math, and styling
├── research/                     # Detailed, modular research articles
│   ├── 01_revenue_models.md
│   ├── 02_sip_calculator.md
│   ├── ...
│   └── 11_ux_layout_and_simulator_events.md
└── spec/                         # Development-ready functional specs for React Native
    ├── README.md
    └── DEVELOPER_TASKS.md        # AI Coding Agent step-by-step task checklist
```

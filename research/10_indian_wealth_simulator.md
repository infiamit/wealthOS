# Module 10: Indian Wealth Simulator Game Specification

This document provides the research, mathematical engine, gameplay loops, UI/UX aesthetics, and developer specifications for the **Indian Wealth Simulator Game**.

---

## 🧭 Executive Summary
The **Indian Wealth Simulator** is an interactive financial gamification engine. It guides players through their career, life, and investment milestones starting from **age 22** with a salary of **₹25,000 per month** inside the Indian macroeconomic environment. Rather than a rigid step-by-step game, it acts as a dynamic **"What-If" timeline sandbox**. Users can tweak variables on the fly (SIP, salary, rent, EMIs) and instantly visualize the future compounding trajectory on a premium chart.

---

## 📈 Core Gameplay & Sandbox Loops

Instead of static trackers, the simulator engages the user's brain through immediate financial feedback:

```mermaid
graph LR
    A[Adjust Variables: SIP, Rent, Hikes] --> B[Run Real-time Math Engine]
    B --> C[Instant Graph Update: Net Worth & Age Projections]
    C --> D[Trigger Achievement: 'Time to ₹1 Crore']
```

### 1. The Interactive "What-If" Sandbox
The main gameplay dashboard features premium, satisfying sliders that players can adjust in real-time to watch their projected wealth chart morph:
* **Salary Slider**: Starts at ₹25,000/month. Tweak annual increment assumptions (e.g., 5% standard hike vs. 15% promotion push).
* **SIP Slider**: Slide to adjust what percentage of monthly surplus goes directly into Equity Mutual Funds.
* **Rent vs. Home Loan Toggle**: Instantly swap between paying ₹6,000 rent (growing at 7% inflation) vs. buying a ₹30L property with a ₹24L home loan (paying ₹20.8k EMI and tracking asset appreciation).
* **Bonus & Windfall Slider**: Add one-off bonuses (e.g., "Add ₹1 Lakh bonus at Age 25").

### 2. The Dynamic Milestone Solver (e.g., "Time to ₹1 Crore")
A dedicated dashboard solver that resolves high-intent user questions with dynamic scenario calculations:
* **The Question**: *"How long will it take for me to hit ₹1 Crore in net worth?"*
* **The Mechanics**: The engine runs a rapid, iterative math loop using the player's custom assets, monthly surplus growth, and expected returns, pinpointing the exact **Age** and **Month** they hit the milestone.
* **Scenario Projections**: The solver lets users experiment with advanced sequences:
  * *"What if I stop investing entirely after 2 years, let it compound, and resume after 5?"*
  * *"What if I switch my corporate job to a side hustle that fails with 80% probability, but grows 5x with 20% probability?"*

---

## 📐 Mathematical Engine & Formulas

### 1. Iterative Projection Math
For any year $t$, the net worth is calculated recursively:
$$NW_{t} = NW_{t-1}(1 + r_{portfolio}) + Surplus_{t} \times \left( \frac{(1 + r_{portfolio})^{12} - 1}{r_{portfolio}} \right)$$

*Where:*
* **$NW_{t}$** = End of year net worth.
* **$Surplus_{t}$** = Monthly disposable surplus calculated in year $t$.
* **$r_{portfolio}$** = Monthly weighted average return rate of all local assets (Equity SIP, stocks, debt).

---

### 2. Dynamic Sequence Math ("Stop & Resume" Loop)
To support advanced sequence testing (e.g., stopping investments for $k$ years and resuming), the engine implements a state-based loop:

```typescript
interface TimelineModifier {
  startAge: number;
  durationYears: number;
  type: 'STOP_SIP' | 'DOUBLE_SIP' | 'JOB_LOSS' | 'WINDFALL';
  value?: number; // e.g. windfall cash amount
}

interface ProjectionVariables {
  startingAge: number;
  targetNetWorth: number;
  baseSalary: number;
  annualHikeRate: number;
  monthlyExpenses: number;
  sipAllocationRate: number;
  sipExpectedReturn: number; // e.g. 0.12 (12% CAGR)
  modifiers: TimelineModifier[];
}
```

### 💻 TypeScript Milestone & Timeline Solver

This performant, offline-first function executes in milliseconds, enabling instant chart rendering in React Native as the user drags sliders.

```typescript
export const calculateMilestoneAge = (vars: ProjectionVariables): { success: boolean; ageReached: number; yearTimeline: number[] } => {
  let age = vars.startingAge;
  let netWorth = 0;
  let currentSalary = vars.baseSalary;
  let currentExpenses = vars.monthlyExpenses;
  
  const timeline: number[] = [0];
  const maxSimulationYears = 45; // Max limit: Age 67 (starting from 22)
  let year = 0;

  while (netWorth < vars.targetNetWorth && year < maxSimulationYears) {
    year++;
    const currentAge = vars.startingAge + year;
    
    // 1. Check for active modifiers (e.g. Stop SIP, Job Loss)
    let activeSipRate = vars.sipAllocationRate;
    let activeSalary = currentSalary;

    vars.modifiers.forEach(mod => {
      if (currentAge >= mod.startAge && currentAge < mod.startAge + mod.durationYears) {
        if (mod.type === 'STOP_SIP') {
          activeSipRate = 0;
        } else if (mod.type === 'JOB_LOSS') {
          activeSalary = 0;
          activeSipRate = 0;
        } else if (mod.type === 'DOUBLE_SIP') {
          activeSipRate = Math.min(1.0, vars.sipAllocationRate * 2);
        }
      }
    });

    // 2. Compounding existing balance
    // We assume standard 12% CAGR equity return compounded monthly
    const monthlyRate = Math.pow(1 + vars.sipExpectedReturn, 1 / 12) - 1;
    for (let month = 1; month <= 12; month++) {
      netWorth = netWorth * (1 + monthlyRate);
      
      if (activeSalary > 0) {
        const surplus = activeSalary - currentExpenses;
        if (surplus > 0) {
          const monthlySip = surplus * activeSipRate;
          const monthlyCash = surplus * (1 - activeSipRate);
          netWorth += (monthlySip + monthlyCash);
        }
      }
    }

    // 3. Yearly salary increments & inflation
    currentSalary = currentSalary * (1 + vars.annualHikeRate);
    currentExpenses = currentExpenses * (1 + 0.055); // 5.5% Indian Inflation standard

    timeline.push(Math.round(netWorth));

    // Handle windfalls applied on specific years
    vars.modifiers.forEach(mod => {
      if (mod.type === 'WINDFALL' && mod.startAge === currentAge) {
        netWorth += (mod.value || 0);
      }
    });
  }

  return {
    success: netWorth >= vars.targetNetWorth,
    ageReached: vars.startingAge + (timeline.length - 1),
    yearTimeline: timeline
  };
};
```

---

## 🎨 FinTech UI/UX Game Aesthetics

As requested, the interface must look **polished, eye-catching, and satisfy the user's brain** to force retention without being cluttered:

* **Instantaneous Graph Redraws**: The line chart uses a smooth cubic spline animation that morphs in real-time as sliders are dragged.
* **Interactive Timeline Scrubbing**: Players can drag their finger along the graph timeline to inspect their simulated net worth at any age, triggering high-end sensory haptic clicks (`Haptics.selection()`).
* **Visualizing Milestones**: The "1 Crore Milestone" is represented as a radiant glowing gold line across the chart. Hitting it slides a full-screen dynamic overlay congratulating the player.
* **Story Mode Card Transitions**: Dynamic card-swipe animations that slide from left to right as rounds progress.

---

## 🔒 Offline Architecture Guidelines

* **Pure Offline Local Database**: Stored using `MMKV` for fast, reactive storage.
* **Zero Synced Accounts**: No login forms, no Google Sign-In, no password fields. All profiles and parameters are written locally.
* **No Database Admin Access**: Complete client-side local isolation. Since there are no databases, user data remains strictly private. Zero maintenance costs for servers!

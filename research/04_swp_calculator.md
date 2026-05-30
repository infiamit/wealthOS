# Module 04: SWP (Systematic Withdrawal Plan) Calculator Specification

This document details the mathematical engine, competitive benchmarks, UI layouts, and React Native code for the **SWP Calculator**.

---

## 🧭 Executive Summary
The **SWP Calculator** models systematic monthly cash outflows from a large retirement corpus. It demonstrates how long a capital corpus (e.g., ₹1 Crore) can survive under different withdrawal amounts (Safe Withdrawal Rates) while the remaining balance continues to compound.

---

## 📐 Mathematical Engine & Formulas

### 1. Monthly SWP Recurrence
For each month $m$, the remaining balance $B_m$ compiles as:

$$B_{m} = B_{m-1} \times (1 + i) - W_{m}$$

*Where:*
* **$B_{m}$** = Capital balance at the end of month $m$
* **$B_{0}$** = Initial lump-sum investment (Corpus)
* **$i$** = Monthly expected return rate ($r / 12$)
* **$W_{m}$** = Withdrawal amount during month $m$

---

### 2. Inflation-Adjusted Withdrawals (Preserving Purchasing Power)
If the user wants their monthly payout to sustain its buying power against retail inflation:

$$W_{m} = W_{m-1} \times \left( 1 + \frac{Inf}{12} \right)$$

*Where:*
* **$Inf$** = Annual inflation rate (e.g., 5.5%)

---

### 💻 TypeScript Mathematical Implementation

```typescript
export interface SwpInputs {
  initialCorpus: number;
  monthlyWithdrawal: number;
  expectedAnnualReturn: number; // e.g., 0.08
  years: number;
  adjustForInflation: boolean;
  annualInflationRate: number; // e.g., 0.055
}

export interface SwpResult {
  endingBalance: number;
  totalWithdrawn: number;
  monthsSurvived: number;
  isDepleted: boolean;
  yearlyTimeline: number[];
}

export const calculateSwp = (inputs: SwpInputs): SwpResult => {
  let balance = inputs.initialCorpus;
  let currentWithdrawal = inputs.monthlyWithdrawal;
  const totalMonths = inputs.years * 12;
  const monthlyRate = inputs.expectedAnnualReturn / 12;
  const monthlyInflation = inputs.annualInflationRate / 12;

  let totalWithdrawn = 0;
  let monthsSurvived = 0;
  let isDepleted = false;
  const yearlyTimeline: number[] = [inputs.initialCorpus];

  for (let month = 1; month <= totalMonths; month++) {
    if (balance <= 0) {
      isDepleted = true;
      break;
    }

    // Compounding occurs first
    balance = balance * (1 + monthlyRate);

    // Withdrawal deducted
    const actualWithdrawal = Math.min(balance, currentWithdrawal);
    balance -= actualWithdrawal;
    totalWithdrawn += actualWithdrawal;
    monthsSurvived++;

    // Record yearly timeline progress
    if (month % 12 === 0) {
      yearlyTimeline.push(Math.round(balance));
    }

    // Adjust withdrawal amount for inflation
    if (inputs.adjustForInflation) {
      currentWithdrawal = currentWithdrawal * (1 + monthlyInflation);
    }
  }

  // Handle case where simulation ended midway through a year
  if (yearlyTimeline.length <= inputs.years) {
    yearlyTimeline.push(Math.round(balance));
  }

  return {
    endingBalance: Math.round(Math.max(0, balance)),
    totalWithdrawn: Math.round(totalWithdrawn),
    monthsSurvived,
    isDepleted: balance <= 0,
    yearlyTimeline
  };
};
```

---

## 🎨 Premium UI/UX Design

* **The Depletion Warning**: If the corpus runs out during the selected timeframe, the layout morphs to alert the user with a subtle neon amber pulse (`#FFA500`), highlighting the exact month of depletion (e.g., *"Capital depleted at Year 14, Month 8"*).
* **The "Safe Zone" Gauge**: Shows their current withdrawal rate as a percentage of the corpus (e.g., ₹40,000/month on ₹1 Crore is a **4.8% withdrawal rate**). If under 4%, show a green safety badge.
* **Responsive Visuals**: A beautiful bar chart showing the corpus remaining year-by-year, decaying or growing based on parameters.

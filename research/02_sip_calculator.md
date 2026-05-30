# Module 02: Combined Lump Sum + SIP Calculator Specification

This document details the mathematical engine, competitive benchmarks, UI layouts, and React Native code for the combined **Lump Sum + SIP Calculator**.

---

## 🧭 Executive Summary
Most wealth builders do not start from absolute zero; they already possess some existing net worth. A standard SIP calculator fails to model their true trajectory. This calculator combines an **initial Lump Sum corpus** with a **monthly compounding SIP** to project exact nominal and inflation-adjusted future values.

---

## 📐 Mathematical Engine & Formulas

### 1. Combined Compounding Equation
To calculate the future value of an initial lump-sum corpus ($L$) compounding alongside a monthly SIP contribution ($P$) invested at the beginning of each compounding period:

$$FV = L(1 + i)^n + P \times \left[ \frac{(1 + i)^n - 1}{i} \right] \times (1 + i)$$

*Where:*
* **$FV$** = Future Value of the combined investment (INR ₹)
* **$L$** = Initial Lump Sum investment (Current starting capital)
* **$P$** = Monthly investment amount (Recurring SIP)
* **$i$** = Monthly expected rate of return (annual return rate divided by 12, e.g., $\frac{0.12}{12} = 0.01$)
* **$n$** = Total number of months (years $\times 12$)

---

### 2. Real Rate adjustment (Inflation Safeguard)
To preserve purchasing power calculations, nominal Expected CAGR is discounted by retail inflation:

$$r_{real} = \frac{1 + r_{nominal}}{1 + Inf} - 1$$

Both the $L(1+i)^n$ term and the $P$ compounding terms are evaluated using this real rate ($i_{real} = r_{real} / 12$) to calculate future value in today's purchasing power.

---

### 💻 TypeScript Mathematical Implementation

```typescript
export interface CombinedSipInputs {
  lumpSum: number;             // Initial starting net worth
  monthlyInvestment: number;   // Monthly recurring SIP
  expectedAnnualReturn: number; // e.g. 0.12 for 12%
  years: number;
  annualInflationRate: number; // e.g. 0.055 for 5.5%
}

export interface CombinedSipResult {
  totalInvested: number;
  futureValueNominal: number;
  futureValueReal: number;
  wealthGainedNominal: number;
}

export const calculateCombinedSip = (inputs: CombinedSipInputs): CombinedSipResult => {
  const totalInvested = inputs.lumpSum + (inputs.monthlyInvestment * inputs.years * 12);
  const totalMonths = inputs.years * 12;

  // 1. Nominal Projections
  const iNominal = inputs.expectedAnnualReturn / 12;
  const lumpSumCompoundedNominal = inputs.lumpSum * Math.pow(1 + iNominal, totalMonths);
  const sipCompoundedNominal = inputs.monthlyInvestment * 
    ((Math.pow(1 + iNominal, totalMonths) - 1) / iNominal) * 
    (1 + iNominal);
  const fvNominal = lumpSumCompoundedNominal + sipCompoundedNominal;

  // 2. Real Projections (Inflation Adjusted)
  const realAnnualRate = ((1 + inputs.expectedAnnualReturn) / (1 + inputs.annualInflationRate)) - 1;
  const iReal = realAnnualRate / 12;
  const lumpSumCompoundedReal = inputs.lumpSum * Math.pow(1 + iReal, totalMonths);
  const sipCompoundedReal = inputs.monthlyInvestment * 
    ((Math.pow(1 + iReal, totalMonths) - 1) / iReal) * 
    (1 + iReal);
  const fvReal = lumpSumCompoundedReal + sipCompoundedReal;

  return {
    totalInvested: Math.round(totalInvested),
    futureValueNominal: Math.round(fvNominal),
    futureValueReal: Math.round(fvReal),
    wealthGainedNominal: Math.round(Math.max(0, fvNominal - totalInvested))
  };
};
```

---

## 🎨 Premium UI/UX Design

* **Dual Input Card**: High-contrast glassmorphic card featuring two primary inputs: A slider for *"Existing Net Worth (Lump Sum)"* and a slider for *"Monthly Additions (SIP)"*.
* **Real-time Graph Updating**: As the user slides the lump-sum or monthly SIP controls, the chart's starting point (Y-intercept) and compound slope morph smoothly using Moti spring transition animations.
* **The "Today's Worth" Comparison**: A visual card showing:
  * Projected Balance: **₹1.8 Crores** (Nominal)
  * Inflation Adjusted: **₹94.2 Lakhs** (Real buying power equivalent)

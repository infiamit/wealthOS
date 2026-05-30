# Module 03: CAGR (Compound Annual Growth Rate) Calculator Specification

This document details the mathematical engine, competitive benchmarks, UI layouts, and React Native code for the **CAGR Calculator**.

---

## 🧭 Executive Summary
The **CAGR Calculator** allows users to calculate the exact annualized growth rate of their investments (mutual funds, gold, stocks, real estate) over time, factoring in fractional years. It is a critical audit tool for checking if historical asset returns beat inflation.

---

## 📐 Mathematical Engine & Formulas

### 1. General CAGR Equation
To find the smoothed annualized rate of return:

$$CAGR = \left( \frac{EV}{SV} \right)^{\frac{1}{n}} - 1$$

*Where:*
* **$EV$** = Ending Value of the investment
* **$SV$** = Starting Value (Principal)
* **$n$** = Total duration in years (can be fractional, e.g., 2.5 years)

---

### 2. Fractional Time ($n$) Calculation
To ensure maximum mathematical accuracy when investments are held for non-integer years, we calculate $n$ using days:

$$n = \frac{\text{Ending Date} - \text{Starting Date}}{365.25}$$

---

### 💻 TypeScript Mathematical Implementation

```typescript
export interface CagrInputs {
  startingValue: number;
  endingValue: number;
  startDate: Date;
  endDate: Date;
}

export interface CagrResult {
  totalYears: number;
  absoluteReturnPercent: number;
  cagrPercent: number;
  beatsInflation: boolean;
}

export const calculateCagr = (inputs: CagrInputs): CagrResult => {
  const diffTime = Math.abs(inputs.endDate.getTime() - inputs.startDate.getTime());
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const totalYears = totalDays / 365.25;

  const absoluteReturnPercent = ((inputs.endingValue - inputs.startingValue) / inputs.startingValue) * 100;
  
  let cagr = 0;
  if (totalYears > 0 && inputs.startingValue > 0) {
    cagr = (Math.pow(inputs.endingValue / inputs.startingValue, 1 / totalYears) - 1) * 100;
  }

  return {
    totalYears: parseFloat(totalYears.toFixed(2)),
    absoluteReturnPercent: parseFloat(absoluteReturnPercent.toFixed(2)),
    cagrPercent: parseFloat(cagr.toFixed(2)),
    beatsInflation: cagr > 5.5 // True if it beats the standard 5.5% Indian Inflation CPI
  };
};
```

---

## 🎨 Premium UI/UX Design

* **Simple Date Pickers**: Frosted glass inputs displaying calendar triggers.
* **The "Inflation Shield" Status**: A clean indicator. If the calculated CAGR is above 5.5%, display a green shield saying *"Beats Retail Inflation"*. If below, display a subtle warning: *"Losing purchasing power over time"*.
* **Micro-interactions**: Dynamic counter tick animation (`moti` or standard React Native values) rapidly cycling ending values upwards.

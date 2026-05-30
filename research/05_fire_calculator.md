# Module 05: FIRE (Financial Independence, Retire Early) & BaristaFIRE Calculator

This document details the mathematical engine, competitive benchmarks, UI layouts, and React Native code for the standard **FIRE** and **BaristaFIRE (Partial Retirement)** calculators.

---

## 🧭 Executive Summary
The **FIRE Calculator** models a user's journey to Financial Independence and Early Retirement. In this updated specification, we introduce **BaristaFIRE** (retiring mentally early by covering a portion of living expenses with a regular, low-stress side-income), demonstrating how partial retirement drastically reduces the required retirement corpus.

---

## 📐 Mathematical Engine & Formulas

### 1. Standard FIRE Number (Rule of 25)
The capital corpus required to support 100% of current living expenses under the **4% Safe Withdrawal Rate (SWR)**:

$$FIRE = AnnualExpenses \times 25 = \frac{AnnualExpenses}{SWR}$$

---

### 2. BaristaFIRE Number (Mental Retirement / Side-Income)
BaristaFIRE allows users to exit the high-stress corporate grind early by earning a small, predictable, low-stress monthly income ($SideIncome$) through a side hustle, consulting, or passion project. This side-income offsets annual expenses:

$$AnnualExpenses_{net} = AnnualExpenses - SideIncome_{annual}$$

$$BaristaFIRE = \frac{AnnualExpenses_{net}}{SWR} = \frac{AnnualExpenses - SideIncome_{annual}}{SWR}$$

If standard 4% SWR is used:
$$BaristaFIRE = (AnnualExpenses - SideIncome_{annual}) \times 25$$

*Example:*
* Annual Expenses: ₹12,00,000
* Side-Hustle Income: ₹6,00,000
* Standard FIRE Corpus needed: **₹3.0 Crore**
* BaristaFIRE Corpus needed: **₹1.5 Crore** (Cuts required wealth threshold in half, allowing users to "mentally retire" decades earlier!)

---

### 3. Coast-BaristaFIRE Threshold
The liquid capital needed today that will compound on its own to meet the BaristaFIRE target by target retirement age without additional contributions:

$$CoastBaristaFIRE = \frac{BaristaFIRE}{(1 + r_{real})^{t}}$$

*Where:*
* **$r_{real}$** = Real rate of return ($\frac{1 + \text{CAGR}}{1 + \text{Inflation}} - 1$)
* **$t$** = Years until retirement (Retirement Age - Current Age)

---

### 💻 TypeScript Mathematical Implementation

```typescript
export interface FireInputs {
  currentAge: number;
  targetRetirementAge: number;
  monthlyExpensesToday: number;
  currentInvestments: number;
  expectedAnnualReturn: number; // e.g. 0.12 (12%)
  annualInflationRate: number; // e.g. 0.055 (5.5%)
  customSWR: number; // e.g. 0.035 for 3.5%
  monthlySideIncome: number; // Regular part-time/side-hustle income
}

export interface FireResult {
  fireNumberStandard: number;
  fireNumberCustom: number;
  baristaFireNumber: number; // New: BaristaFIRE corpus
  coastFireThreshold: number;
  coastBaristaThreshold: number; // New: Coast-Barista target today
  yearsToRetire: number;
  isAlreadyCoastFire: boolean;
  isAlreadyCoastBarista: boolean;
}

export const calculateFireAndBarista = (inputs: FireInputs): FireResult => {
  const yearsToRetire = inputs.targetRetirementAge - inputs.currentAge;
  const annualExpensesToday = inputs.monthlyExpensesToday * 12;
  const annualSideIncome = inputs.monthlySideIncome * 12;

  // 1. Standard and Custom FIRE Numbers
  const fireNumberStandard = annualExpensesToday * 25;
  const fireNumberCustom = annualExpensesToday / inputs.customSWR;

  // 2. BaristaFIRE calculation (deducting side income from expenses)
  const netAnnualExpenses = Math.max(0, annualExpensesToday - annualSideIncome);
  const baristaFireNumber = netAnnualExpenses / inputs.customSWR;

  // 3. Discounting to find Coast thresholds today using real returns
  const realAnnualRate = ((1 + inputs.expectedAnnualReturn) / (1 + inputs.annualInflationRate)) - 1;
  
  const coastFireThreshold = fireNumberCustom / Math.pow(1 + realAnnualRate, yearsToRetire);
  const coastBaristaThreshold = baristaFireNumber / Math.pow(1 + realAnnualRate, yearsToRetire);

  return {
    fireNumberStandard: Math.round(fireNumberStandard),
    fireNumberCustom: Math.round(fireNumberCustom),
    baristaFireNumber: Math.round(baristaFireNumber),
    coastFireThreshold: Math.round(coastFireThreshold),
    coastBaristaThreshold: Math.round(coastBaristaThreshold),
    yearsToRetire,
    isAlreadyCoastFire: inputs.currentInvestments >= coastFireThreshold,
    isAlreadyCoastBarista: inputs.currentInvestments >= coastBaristaThreshold
  };
};
```

---

## 🎨 Premium UI/UX Design

* **"Mental Retirement" Toggle**: A beautiful glassmorphic switch labeled *"Plan for Mental Retirement (BaristaFIRE)"*. Toggling it reveals a slider to input *"Expected Side-Hustle/Consulting Payout"*.
* **The Dual Progress Rings**: Render two concentric glowing rings:
  * Inner Ring: Progress towards Coast-BaristaFIRE (reaches 100% far sooner, triggering mental relief!).
  * Outer Ring: Progress towards full standard CoastFIRE.
* **The "Freedom Year" Gauge**: Instantly displays the years shaved off their standard corporate career by adopting the BaristaFIRE pathway (e.g., *"Mental Freedom achieved 8.5 years early!"*).

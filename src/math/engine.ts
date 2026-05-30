/**
 * WealthOS — Mathematical Engine
 * 
 * Pure TypeScript solvers for all financial calculations.
 * No external dependencies — runs offline, instant computation.
 * 
 * Formulas are based on standard compound interest mathematics
 * with Indian market defaults (12% equity CAGR, 5.5% inflation).
 */

import {
  SipInputs,
  SipResult,
  FireInputs,
  FireResult,
  GoalInputs,
  MonteCarloInputs,
  MonteCarloResult,
  SwpInputs,
  SwpResult,
  CagrInputs,
} from '@/types';

// ============================================================
// A. Combined Lump Sum + SIP Solver
// ============================================================
//
// Formula (Nominal):
// FV = P(1 + i)^n + M × [((1 + i)^n - 1) / i] × (1 + i)
//
// Where:
//   P = Lump sum principal (₹)
//   M = Monthly investment (₹)
//   i = Monthly interest rate (annual / 12)
//   n = Total months (years × 12)
//
// Real (Inflation-Adjusted):
//   realRate = ((1 + nominalAnnual) / (1 + inflationAnnual)) - 1
//   Same formula with realRate instead of nominalRate

export const calculateCombinedSip = (inputs: SipInputs): SipResult => {
  const { lumpSum, monthlyInvestment, expectedAnnualReturn, years, annualInflationRate } = inputs;

  const totalMonths = years * 12;
  const totalInvested = lumpSum + (monthlyInvestment * totalMonths);

  // Edge case: zero return
  if (expectedAnnualReturn <= 0) {
    return {
      totalInvested: Math.round(totalInvested),
      futureValueNominal: Math.round(totalInvested),
      futureValueReal: Math.round(totalInvested),
      wealthGained: 0,
    };
  }

  // Nominal compounding
  const iNominal = expectedAnnualReturn / 12;
  const compoundFactor = Math.pow(1 + iNominal, totalMonths);
  const fvNominal =
    (lumpSum * compoundFactor) +
    (monthlyInvestment * ((compoundFactor - 1) / iNominal) * (1 + iNominal));

  // Real (inflation-adjusted) compounding
  const realAnnualRate = ((1 + expectedAnnualReturn) / (1 + annualInflationRate)) - 1;
  const iReal = realAnnualRate / 12;
  let fvReal: number;

  if (iReal <= 0) {
    fvReal = totalInvested;
  } else {
    const realCompoundFactor = Math.pow(1 + iReal, totalMonths);
    fvReal =
      (lumpSum * realCompoundFactor) +
      (monthlyInvestment * ((realCompoundFactor - 1) / iReal) * (1 + iReal));
  }

  return {
    totalInvested: Math.round(totalInvested),
    futureValueNominal: Math.round(fvNominal),
    futureValueReal: Math.round(fvReal),
    wealthGained: Math.round(Math.max(0, fvNominal - totalInvested)),
  };
};

// ============================================================
// B. BaristaFIRE Partial Retirement Solver
// ============================================================
//
// Formula:
//   Standard FIRE Corpus = (Annual Expenses) / SWR
//   Barista FIRE Corpus  = (Annual Expenses - Annual Side Income) / SWR
//   Capital Saved        = Standard - Barista
//
// Default SWR: 4% (0.04) from the Trinity Study

export const calculateBaristaFire = (inputs: FireInputs): FireResult => {
  const { monthlyExpensesToday, monthlySideIncome, customSWR } = inputs;

  const annualExpenses = monthlyExpensesToday * 12;
  const annualSideIncome = monthlySideIncome * 12;
  const netAnnualExpenses = Math.max(0, annualExpenses - annualSideIncome);

  // Guard against zero SWR
  const swr = customSWR > 0 ? customSWR : 0.04;

  const standardFireCorpus = annualExpenses / swr;
  const baristaFireCorpus = netAnnualExpenses / swr;

  return {
    standardFireCorpus: Math.round(standardFireCorpus),
    baristaFireCorpus: Math.round(baristaFireCorpus),
    capitalSaved: Math.round(Math.max(0, standardFireCorpus - baristaFireCorpus)),
  };
};

// ============================================================
// C. Logarithmic Milestone Target Date Solver
// ============================================================
//
// Solves: "When will I reach ₹X?"
//
// Formula (with SIP contributions):
//   months = ln((Target + Factor) / (Current + Factor)) / ln(1 + i)
//   where Factor = M × (1 + i) / i
//   and i = monthlyRate
//
// Returns a human-readable date string like "Aug 2031"

export const solveMilestoneTargetDate = (inputs: GoalInputs): string => {
  const { targetAmount, currentNetWorth, monthlyContribution, expectedAnnualReturn } = inputs;

  // Already achieved!
  if (currentNetWorth >= targetAmount) return 'Achieved! 🎉';

  let monthsRemaining: number;

  if (expectedAnnualReturn <= 0) {
    // No growth — simple division
    if (monthlyContribution <= 0) return 'Increase your SIP';
    monthsRemaining = Math.ceil((targetAmount - currentNetWorth) / monthlyContribution);
  } else {
    const i = expectedAnnualReturn / 12;
    const factor = monthlyContribution * ((1 + i) / i);
    const numerator = targetAmount + factor;
    const denominator = currentNetWorth + factor;

    if (denominator <= 0 || numerator <= 0) return 'Increase your SIP';

    monthsRemaining = Math.ceil(Math.log(numerator / denominator) / Math.log(1 + i));
  }

  // Convert months to a target date
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + monthsRemaining);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  return `${monthNames[targetDate.getMonth()]} ${targetDate.getFullYear()}`;
};

/**
 * Returns months remaining until milestone (for progress calculations)
 */
export const solveMilestoneMonths = (inputs: GoalInputs): number => {
  const { targetAmount, currentNetWorth, monthlyContribution, expectedAnnualReturn } = inputs;

  if (currentNetWorth >= targetAmount) return 0;

  if (expectedAnnualReturn <= 0) {
    if (monthlyContribution <= 0) return Infinity;
    return Math.ceil((targetAmount - currentNetWorth) / monthlyContribution);
  }

  const i = expectedAnnualReturn / 12;
  const factor = monthlyContribution * ((1 + i) / i);
  const numerator = targetAmount + factor;
  const denominator = currentNetWorth + factor;

  if (denominator <= 0 || numerator <= 0) return Infinity;

  return Math.ceil(Math.log(numerator / denominator) / Math.log(1 + i));
};

// ============================================================
// D. Stochastic Monte Carlo Forecast Solver
// ============================================================
//
// Uses Box-Muller transform to generate normally distributed
// random returns, simulating thousands of portfolio paths
// to produce percentile-based forecast fans.
//
// Box-Muller: z = √(-2·ln(u1)) × cos(2π·u2)
// Monthly return: μ_m + σ_m × z
//   where μ_m = (1 + annualReturn)^(1/12) - 1
//         σ_m = annualVolatility / √12

/**
 * Box-Muller transform: generates a standard normal random variate
 */
const boxMullerRandom = (): number => {
  let u1 = 0;
  let u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
};

export const runMonteCarloSimulation = (inputs: MonteCarloInputs): MonteCarloResult => {
  const {
    initialPortfolio,
    monthlySip,
    expectedReturn,
    volatility,
    years,
    simulations,
  } = inputs;

  // Monthly parameters
  const monthlyMean = Math.pow(1 + expectedReturn, 1 / 12) - 1;
  const monthlySigma = volatility / Math.sqrt(12);
  const totalMonths = years * 12;

  // Run simulations — store final year-end values for each path
  // Each path: array of yearly portfolio values
  const allPaths: number[][] = [];

  for (let sim = 0; sim < simulations; sim++) {
    let portfolio = initialPortfolio;
    const yearlyValues: number[] = [portfolio];

    for (let month = 1; month <= totalMonths; month++) {
      // Random monthly return
      const z = boxMullerRandom();
      const monthlyReturn = monthlyMean + monthlySigma * z;

      // Apply return and add SIP
      portfolio = portfolio * (1 + monthlyReturn) + monthlySip;
      portfolio = Math.max(0, portfolio); // Floor at zero

      // Record at year boundaries
      if (month % 12 === 0) {
        yearlyValues.push(Math.round(portfolio));
      }
    }

    allPaths.push(yearlyValues);
  }

  // Calculate percentiles for each year
  const percentile10: number[] = [];
  const percentile50: number[] = [];
  const percentile90: number[] = [];
  const yearLabels: number[] = [];

  const currentYear = new Date().getFullYear();

  for (let yearIdx = 0; yearIdx <= years; yearIdx++) {
    const yearValues = allPaths
      .map((path) => path[yearIdx] ?? path[path.length - 1])
      .sort((a, b) => a - b);

    const p10Index = Math.floor(simulations * 0.1);
    const p50Index = Math.floor(simulations * 0.5);
    const p90Index = Math.floor(simulations * 0.9);

    percentile10.push(yearValues[p10Index]);
    percentile50.push(yearValues[p50Index]);
    percentile90.push(yearValues[p90Index]);
    yearLabels.push(currentYear + yearIdx);
  }

  return { percentile10, percentile50, percentile90, yearLabels };
};

// ============================================================
// E. Utility Helpers
// ============================================================

/**
 * Format INR currency with Indian comma notation
 * e.g., 1000000 → "₹10,00,000"
 */
export const formatINR = (amount: number): string => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  const str = absAmount.toString();

  if (str.length <= 3) return `${isNegative ? '-' : ''}₹${str}`;

  // Indian grouping: last 3 digits, then groups of 2
  const lastThree = str.slice(-3);
  const remaining = str.slice(0, -3);
  const formatted = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');

  return `${isNegative ? '-' : ''}₹${formatted},${lastThree}`;
};

/**
 * Format large amounts in Lakhs / Crores
 * e.g., 10000000 → "₹1 Cr", 3450000 → "₹34.5L"
 */
export const formatINRCompact = (amount: number): string => {
  const absAmount = Math.abs(amount);
  const isNegative = amount < 0;
  const prefix = isNegative ? '-' : '';

  if (absAmount >= 10000000) {
    const crores = absAmount / 10000000;
    return `${prefix}₹${crores % 1 === 0 ? crores.toFixed(0) : crores.toFixed(1)} Cr`;
  }
  if (absAmount >= 100000) {
    const lakhs = absAmount / 100000;
    return `${prefix}₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
  }
  if (absAmount >= 1000) {
    const thousands = absAmount / 1000;
    return `${prefix}₹${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K`;
  }
  return `${prefix}₹${absAmount}`;
};

/**
 * Calculate weighted average CAGR from asset portfolio
 */
export const calculateWeightedCagr = (
  assets: { value: number; customExpectedCagr: number }[]
): number => {
  const totalValue = assets.reduce((sum, a) => sum + a.value, 0);
  if (totalValue === 0) return 0;

  const weightedSum = assets.reduce(
    (sum, a) => sum + (a.value / totalValue) * a.customExpectedCagr,
    0
  );

  return Math.round(weightedSum * 10) / 10;
};

/**
 * Calculate total net worth from all asset classes
 */
export const calculateNetWorth = (
  assets: { value: number; category: string }[]
): number => {
  return assets.reduce((sum, asset) => {
    // Liabilities subtract from net worth
    if (asset.category === 'LIABILITY') {
      return sum - asset.value;
    }
    return sum + asset.value;
  }, 0);
};

// ============================================================
// F. SWP (Systematic Withdrawal Plan) Retirement Survival Solver
// ============================================================
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
  if (yearlyTimeline.length <= inputs.years && balance > 0) {
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

// ============================================================
// G. CAGR (Compound Annual Growth Rate) Solver
// ============================================================
export const calculateCagrValue = (inputs: CagrInputs): number => {
  if (inputs.initialValue <= 0 || inputs.finalValue <= 0 || inputs.years <= 0) return 0;
  const cagr = Math.pow(inputs.finalValue / inputs.initialValue, 1 / inputs.years) - 1;
  return Math.round(cagr * 1000) / 10; // returns e.g. 12.5 for 12.5%
};


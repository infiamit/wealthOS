# Module 08: Retirement Forecast Specification (Static & Monte Carlo Projections)

This document details the mathematical engine, statistical models, UI layouts, and React Native code for the **Retirement Forecast** module.

---

## 🧭 Executive Summary
Retirement forecasting in India is typically modeled using static "flat" returns. However, in reality, equity markets fluctuate wildly, exposing early retirees to **Sequence-of-Returns Risk** (the risk that a market crash early in retirement depletes the corpus permanently). To give users realistic projections, our forecast engine supports both **Static Compounding** and a local **Stochastic Monte Carlo Simulation** to compute the mathematical *Probability of Success* under historical Indian equity volatilities.

---

## 📐 Mathematical Engine & Formulas

### 1. Static Forecast Model
Assumes steady, year-over-year compounding returns and standard retail inflation:

$$NW_t = NW_{t-1}(1 + r_{real}) - Expenses_{annual, t}$$

*Where:*
* **$r_{real}$** = Real return rate ($\frac{1 + \text{Nominal CAGR}}{1 + \text{Inflation}} - 1$)
* **$Expenses_{annual, t}$** = Yearly expenses in today's dollars (representing flat purchasing power).

---

### 2. Monte Carlo Stochastic Model
Rather than a flat return rate, the engine models annual market returns ($r_t$) as a random variable drawn from a **Normal Distribution** based on historical Nifty 50 volatility data:

$$r_t \sim \mathcal{N}(\mu, \sigma^2)$$

*Where:*
* **$\mu$** = Mean expected long-term return (e.g., 12.0% CAGR)
* **$\sigma$** = Annualized standard deviation of the Indian market (e.g., 15.0% volatility)

For each of the $N$ simulations (typically $N = 100$), the math engine calculates a unique 40-year path. The **Probability of Success** is calculated as:

$$\text{Probability of Success} = \frac{\text{Simulations where ending balance } > 0}{N} \times 100\%$$

To draw random returns adhering to a normal distribution on the client-side without external dependencies, we implement the **Box-Muller Transform**:

$$Z_0 = \sqrt{-2 \ln U_1} \cos(2\pi U_2)$$
$$r_t = \mu + Z_0 \times \sigma$$

*Where $U_1, U_2$ are independent random variables uniformly distributed on the interval $(0, 1]$.*

---

### 💻 TypeScript Monte Carlo Forecast Engine

```typescript
export interface ForecastInputs {
  currentInvestments: number;
  monthlySavings: number;
  retirementAge: number;
  targetAge: number; // e.g. 80 years
  annualExpensesRetirement: number;
  meanCagr: number; // e.g., 0.12
  marketVolatility: number; // e.g., 0.15 (15% standard deviation)
  inflationRate: number; // e.g., 0.055
}

export interface MonteCarloSummary {
  probabilityOfSuccessPercent: number;
  tenthPercentileTimeline: number[]; // Conservative path
  fiftiethPercentileTimeline: number[]; // Median path
  ninetiethPercentileTimeline: number[]; // Aggressive path
}

// Box-Muller Transform to generate standard normally distributed variable
const generateNormalRandom = (mean: number, stdDev: number): number => {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * stdDev;
};

export const runMonteCarloSimulation = (inputs: ForecastInputs, simCount: number = 100): MonteCarloSummary => {
  const currentAge = 30; // standard default baseline
  const totalYears = inputs.targetAge - currentAge;
  const yearsToRetire = inputs.retirementAge - currentAge;

  const results: number[][] = []; // Array of timelines [simCount][totalYears]

  for (let sim = 0; sim < simCount; sim++) {
    let balance = inputs.currentInvestments;
    let currentExpenses = inputs.annualExpensesRetirement;
    let currentSavings = inputs.monthlySavings * 12;
    const timeline: number[] = [balance];

    for (let year = 1; year <= totalYears; year++) {
      // 1. Draw stochastic nominal return for this specific year
      const nominalReturn = generateNormalRandom(inputs.meanCagr, inputs.marketVolatility);
      
      // 2. Adjust assets for returns
      balance = balance * (1 + nominalReturn);

      if (year <= yearsToRetire) {
        // Accumulation phase
        balance += currentSavings;
        currentSavings = currentSavings * 1.07; // 7% salary growth
      } else {
        // Distribution (Retirement) phase
        balance = Math.max(0, balance - currentExpenses);
      }

      // Inflate retirement expenses for next year
      currentExpenses = currentExpenses * (1 + inputs.inflationRate);

      timeline.push(Math.round(balance));
    }
    results.push(timeline);
  }

  // Calculate Success Rate
  let successes = 0;
  results.forEach(timeline => {
    if (timeline[timeline.length - 1] > 0) {
      successes++;
    }
  });

  // Extract Percentiles (10th, 50th, 90th) at each year
  const tenthPercentileTimeline: number[] = [];
  const fiftiethPercentileTimeline: number[] = [];
  const ninetiethPercentileTimeline: number[] = [];

  for (let year = 0; year <= totalYears; year++) {
    const yearValues = results.map(timeline => timeline[year]).sort((a, b) => a - b);
    
    const idx10 = Math.floor(simCount * 0.1);
    const idx50 = Math.floor(simCount * 0.5);
    const idx90 = Math.floor(simCount * 0.9);

    tenthPercentileTimeline.push(yearValues[idx10]);
    fiftiethPercentileTimeline.push(yearValues[idx50]);
    ninetiethPercentileTimeline.push(yearValues[idx90]);
  }

  return {
    probabilityOfSuccessPercent: Math.round((successes / simCount) * 100),
    tenthPercentileTimeline,
    fiftiethPercentileTimeline,
    ninetiethPercentileTimeline
  };
};
```

---

## 🎨 Premium UI/UX Design

* **The Percentile Fan Chart**: Rather than rendering a single boring line, the forecast displays a beautiful translucent "shading area" (Percentile Fan) using gradient opacity:
  * Top line: 90th percentile (Aggressive growth).
  * Center line: 50th percentile (Median expected path).
  * Bottom line: 10th percentile (Worst-case conservative path).
* **The Probability Gauge**: A circular neon-indicator that displays the overall safety score (e.g., **"92% Success Probability"**). Under 70%, the ring changes color to warn the user: *"High risk of capital depletion. Consider increasing savings or working 2 more years."*

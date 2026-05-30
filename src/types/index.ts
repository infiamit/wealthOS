/**
 * WealthOS — Data Types & Schemas
 * 
 * All TypeScript interfaces for the offline-first MMKV database.
 * These schemas govern the entire local data layer.
 */

// ============================================================
// ASSET CLASSES — Manual Ledger Categories
// ============================================================
export type AssetCategory = 'EQUITY' | 'DEBT' | 'CASH' | 'GOLD' | 'LIABILITY';

export interface AssetClass {
  /** Unique identifier for this asset bucket */
  id: string;
  /** Display name, e.g., "Equity Mutual Funds" */
  name: string;
  /** Current value in INR ₹ */
  value: number;
  /** Expected annual return as percentage, e.g., 12.0 for 12% */
  customExpectedCagr: number;
  /** Asset category for color-coding and grouping */
  category: AssetCategory;
}

// ============================================================
// GOALS — Wealth Milestones
// ============================================================
export type MilestoneType = 'ONE_CRORE' | 'FIRE' | 'BARISTA';

export interface WealthGoal {
  /** Unique identifier */
  id: string;
  /** Goal name, e.g., "₹1 Crore Club" */
  name: string;
  /** Target corpus in INR ₹ */
  targetAmount: number;
  /** Monthly contribution towards this goal in INR ₹ */
  monthlyContribution: number;
}

// ============================================================
// STREAK — Daily Engagement Tracker
// ============================================================
export interface StreakState {
  /** Current active streak count */
  currentStreak: number;
  /** Unix timestamp (ms) of last logged activity */
  lastLoggedTimestamp: number;
  /** All-time best streak record */
  bestStreak: number;
}

// ============================================================
// DAILY STORIES — Gamified Financial Dilemmas
// ============================================================
export interface CompletedStory {
  /** Story identifier */
  storyId: string;
  /** Which option the user voted for */
  votedOption: 'A' | 'B' | 'C';
  /** Unix timestamp (ms) of the vote */
  votedTimestamp: number;
  /** Whether user picked the optimal financial choice */
  wasOptimalChoice: boolean;
}

export interface StoryChoice {
  label: string;
  description: string;
  /** 10 or 15-year projected outcome in INR ₹ */
  projectedOutcome: number;
  /** Whether this is the mathematically optimal choice */
  isOptimal: boolean;
}

export interface DailyStory {
  storyId: string;
  characterName: string;
  age: number;
  income: string;
  intro: string;
  choices: {
    A: StoryChoice;
    B: StoryChoice;
    C?: StoryChoice;
  };
  /** Static community vote distribution (fetched from CDN) */
  communityVotes: {
    A: number;
    B: number;
    C?: number;
  };
  /** Projection horizon in years */
  projectionYears: number;
  /** Educational takeaway text */
  lesson: string;
}

// ============================================================
// DASHBOARD CONFIG — Layout Customization
// ============================================================
export interface DashboardConfig {
  showMilestones: boolean;
  showForecastChart: boolean;
  showScenarioSliders: boolean;
  activeAssetCategories: AssetCategory[];
}

// ============================================================
// USER PROFILE — Consolidated Offline State
// ============================================================
export interface UserProfileState {
  /** Whether biometric lock is enabled */
  isBiometricLocked: boolean;
  /** Whether this is a premium (ad-free) user */
  isProUser: boolean;
  /** Consumable game tokens for time-machine feature */
  timeMachineTokens: number;
  /** All asset classes in the manual ledger */
  assets: AssetClass[];
  /** Wealth goals and milestones */
  goals: WealthGoal[];
  /** Daily streak tracking */
  streak: StreakState;
  /** History of completed daily stories */
  completedStories: CompletedStory[];
  /** Dashboard layout preferences */
  dashboardConfig: DashboardConfig;
}

// ============================================================
// MATH ENGINE INPUT TYPES
// ============================================================
export interface SipInputs {
  /** Initial lump sum investment in INR ₹ */
  lumpSum: number;
  /** Monthly SIP amount in INR ₹ */
  monthlyInvestment: number;
  /** Expected annual return as decimal, e.g., 0.12 for 12% */
  expectedAnnualReturn: number;
  /** Investment horizon in years */
  years: number;
  /** Annual inflation rate as decimal, e.g., 0.055 for 5.5% */
  annualInflationRate: number;
}

export interface SipResult {
  totalInvested: number;
  futureValueNominal: number;
  futureValueReal: number;
  wealthGained: number;
}

export interface FireInputs {
  /** Current monthly expenses in INR ₹ */
  monthlyExpensesToday: number;
  /** Monthly side-hustle / part-time income in INR ₹ */
  monthlySideIncome: number;
  /** Safe Withdrawal Rate as decimal, e.g., 0.04 for 4% */
  customSWR: number;
}

export interface FireResult {
  standardFireCorpus: number;
  baristaFireCorpus: number;
  capitalSaved: number;
}

export interface GoalInputs {
  /** Target corpus to achieve in INR ₹ */
  targetAmount: number;
  /** Current net worth in INR ₹ */
  currentNetWorth: number;
  /** Monthly contribution in INR ₹ */
  monthlyContribution: number;
  /** Expected annual return as decimal */
  expectedAnnualReturn: number;
}

export interface MonteCarloInputs {
  /** Starting portfolio value in INR ₹ */
  initialPortfolio: number;
  /** Monthly SIP contribution in INR ₹ */
  monthlySip: number;
  /** Expected annual return as decimal */
  expectedReturn: number;
  /** Annual volatility (standard deviation) as decimal */
  volatility: number;
  /** Number of years to simulate */
  years: number;
  /** Number of simulation paths to run */
  simulations: number;
}

export interface MonteCarloResult {
  /** Array of yearly values for 10th percentile (worst case) */
  percentile10: number[];
  /** Array of yearly values for 50th percentile (median) */
  percentile50: number[];
  /** Array of yearly values for 90th percentile (best case) */
  percentile90: number[];
  /** Year labels for x-axis */
  yearLabels: number[];
}

// ============================================================
// LEARN TAB — Educational Content
// ============================================================
export interface WealthNote {
  id: string;
  title: string;
  category: 'rule' | 'strategy' | 'trap' | 'tax' | 'basics';
  summary: string;
  content: string;
  formula?: string;
  actionableTip: string;
  isBookmarked: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  relatedNoteId: string;
}

// ============================================================
// INDIAN WEALTH SIMULATOR GAME TYPES
// ============================================================
export interface HistoricalChoice {
  label: string;
  description: string;
  equityAllocation: number; // e.g. 0.8 for 80% Equity, 0.2 Debt
  debtAllocation: number;
  monthlySip: number; // monthly SIP contribution
  portfolioModifier?: number; // multiplier for current portfolio (e.g. 0.5 on panic sell)
  isOptimal: boolean;
  impactText: string;
}

export interface HistoricalGameTurn {
  year: number; // e.g. 2008
  age: number; // e.g. 30
  eventTitle: string; // e.g. "Global Financial Crisis"
  eventDescription: string;
  niftyReturn: number; // e.g. -0.513 for -51.3% Nifty return
  inflation: number; // e.g. 0.055 for 5.5% CPI
  fixedReturn: number; // e.g. 0.08 for 8% FD return
  salaryHikeRate: number; // e.g. 0.08 for 8% increment
  choiceQuestion: string;
  choices: {
    A: HistoricalChoice;
    B: HistoricalChoice;
    C?: HistoricalChoice;
  };
  lesson: string;
}

// ============================================================
// SWP AND CAGR CALCULATOR TYPES
// ============================================================
export interface SwpInputs {
  initialCorpus: number;
  monthlyWithdrawal: number;
  expectedAnnualReturn: number;
  years: number;
  adjustForInflation: boolean;
  annualInflationRate: number;
}

export interface SwpResult {
  endingBalance: number;
  totalWithdrawn: number;
  monthsSurvived: number;
  isDepleted: boolean;
  yearlyTimeline: number[];
}

export interface CagrInputs {
  initialValue: number;
  finalValue: number;
  years: number;
}



import { DailyStory } from '@/types';

export const BASELINE_STORIES: DailyStory[] = [
  {
    storyId: 'story_1',
    characterName: 'Rahul',
    age: 28,
    income: '₹12 Lakh/year',
    intro: 'Rahul commutes 2 hours daily in heavy Gurgaon traffic. He has ₹5 Lakh in cash savings and wants his own car to escape the stress.',
    projectionYears: 10,
    choices: {
      A: {
        label: 'Buy a ₹10L SUV on EMI',
        description: 'Downpayment ₹2 Lakh. 5-year loan of ₹8 Lakh at 9.5% interest (EMI ₹16,800/mo). Fuel + maintenance adds ₹8,000/mo. Reduced SIP to ₹5,200/mo.',
        projectedOutcome: 4230000,
        isOptimal: false,
      },
      B: {
        label: 'Buy Used Hatchback',
        description: 'Buy a reliable, pre-owned hatchback for ₹5 Lakh in cash. No EMIs. Maintenance is ₹4,000/mo. Monthly SIP continues at ₹25,000/mo after fuel.',
        projectedOutcome: 6480000,
        isOptimal: true,
      },
      C: {
        label: 'Public Metro & Double SIP',
        description: 'Skip buying a car entirely. Commit to taking the public metro. Invest all saved cash and increase monthly SIP to ₹40,000/mo.',
        projectedOutcome: 9210000,
        isOptimal: true,
      },
    },
    communityVotes: {
      A: 42,
      B: 38,
      C: 20,
    },
    lesson: 'Vehicles are depreciating assets. Buying an expensive SUV on EMI creates a double drag: high interest expenses and a massive reduction in your monthly SIP investments. A used hatchback or public transport keeps your compounding rate high.',
  },
  {
    storyId: 'story_2',
    characterName: 'Neha',
    age: 32,
    income: '₹1.8 Lakh/month',
    intro: 'Neha has accumulated ₹20 Lakh in liquid cash. She is under social pressure to buy her own home instead of renting.',
    projectionYears: 15,
    choices: {
      A: {
        label: 'Buy ₹1.2 Crore Apartment',
        description: 'Downpayment ₹20L. Home loan ₹1 Crore at 8.75% for 20 years. Monthly EMI: ₹88,370. SIP becomes ₹0. Property appreciates at 6.5% CAGR.',
        projectedOutcome: 26000000,
        isOptimal: false,
      },
      B: {
        label: 'Rent & Index Fund SIP',
        description: 'Rent a similar flat for ₹30,000/mo. Invest the ₹20L cash and the monthly surplus (₹50,000/mo) in a diversified Equity Index SIP.',
        projectedOutcome: 39000000,
        isOptimal: true,
      },
    },
    communityVotes: {
      A: 65,
      B: 35,
    },
    lesson: 'In many Indian metro areas, rental yield is extremely low (2-3%), while home loan interest sits at 8.5-9%. Renting and investing the surplus into equity indices beats high-leverage home buying due to heavy EMI interest drag.',
  },
  {
    storyId: 'story_3',
    characterName: 'Ananya',
    age: 26,
    income: '₹10 Lakh/year',
    intro: 'Ananya is getting married. Her family wants a lavish, memorable ₹15 Lakh wedding. She has saved ₹10 Lakh in liquid cash.',
    projectionYears: 15,
    choices: {
      A: {
        label: 'Spend ₹10L on Premium Wedding',
        description: 'Spend all her cash savings on a single day premium wedding. Starts her post-marriage life with ₹0 and no active stock SIP.',
        projectedOutcome: 0,
        isOptimal: false,
      },
      B: {
        label: 'Court Wedding + Equity SIP',
        description: 'Opt for a simple court wedding + simple reception for ₹2 Lakh. Instantly invest the remaining ₹8 Lakh in a diversified Equity index.',
        projectedOutcome: 4370000,
        isOptimal: true,
      },
    },
    communityVotes: {
      A: 78,
      B: 22,
    },
    lesson: 'Spending an entire life savings on a single day represents a severe opportunity cost. Investing ₹8 Lakh at age 26 creates a massive liquid corpus of over ₹43 Lakhs by age 41 at 12% CAGR, establishing solid early security.',
  },
  {
    storyId: 'story_4',
    characterName: 'Karan',
    age: 35,
    income: '₹24 Lakh/year',
    intro: 'Karan wants to build a guaranteed college education fund for his 5-year-old daughter. He is deciding on school fees.',
    projectionYears: 13,
    choices: {
      A: {
        label: 'Premium International School',
        description: 'Enroll in a premium IB international school costing ₹5 Lakh/year. Leaves zero surplus for long-term investments.',
        projectedOutcome: 0,
        isOptimal: false,
      },
      B: {
        label: 'CBSE School + Education SIP',
        description: 'Choose a reputable CBSE school costing ₹2 Lakh/year. Invest the ₹3 Lakh/year difference (₹25,000/mo) in a dedicated mutual fund SIP.',
        projectedOutcome: 8850000,
        isOptimal: true,
      },
    },
    communityVotes: {
      A: 55,
      B: 45,
    },
    lesson: 'While premium schooling is attractive, starting college with ₹0 college savings can force high-interest education loans. A CBSE school combined with a disciplined education SIP compounds to a liquid ₹88L college fund by her 18th birthday.',
  },
  {
    storyId: 'story_5',
    characterName: 'Dev',
    age: 23,
    income: '₹35,000/month',
    intro: 'Dev wants the latest flagship iPhone costing ₹1,50,000. He only has ₹10,000 in cash reserves.',
    projectionYears: 5,
    choices: {
      A: {
        label: 'iPhone on 24mo No-Cost EMI',
        description: 'Buy the iPhone via credit card No-Cost EMI of ₹6,250/month for 24 months. Zero liquid stock additions.',
        projectedOutcome: 15000,
        isOptimal: false,
      },
      B: {
        label: 'Budget Phone + Index SIP',
        description: 'Buy a reliable budget phone for ₹20,000 in cash. Invest the ₹6,250/mo savings in a diversified Direct Index Mutual Fund.',
        projectedOutcome: 510000,
        isOptimal: true,
      },
    },
    communityVotes: {
      A: 82,
      B: 18,
    },
    lesson: 'Consumer credit traps like "No-Cost EMI" lock up your future cash flows. Buying a functional phone in cash and investing the EMI difference compounds to over ₹5 Lakhs in 5 years, while the phone depreciates to almost nothing.',
  },
  {
    storyId: 'story_6',
    characterName: 'Priya',
    age: 30,
    income: '₹1.5 Lakh/month',
    intro: 'Priya keeps ₹10 Lakh in liquid cash sitting idle in her bank savings account earning 3% interest because she is afraid of market volatility.',
    projectionYears: 10,
    choices: {
      A: {
        label: 'Keep Cash in Savings Account',
        description: 'Leave the ₹10 Lakh in the bank savings account earning a steady but low 3% interest rate.',
        projectedOutcome: 1340000,
        isOptimal: false,
      },
      B: {
        label: 'Move to a Gold ETF',
        description: 'Transfer the entire ₹10 Lakh into a liquid Gold ETF (assumes a historical 8% CAGR return).',
        projectedOutcome: 2150000,
        isOptimal: false,
      },
      C: {
        label: 'Equity Index Mutual Fund',
        description: 'Invest the ₹10 Lakh into a diversified Nifty 50 Equity Index mutual fund (assumes a standard 12% CAGR return).',
        projectedOutcome: 3100000,
        isOptimal: true,
      },
    },
    communityVotes: {
      A: 33,
      B: 33,
      C: 34,
    },
    lesson: 'Keeping cash in savings accounts is a guaranteed way to lose purchasing power due to inflation. Over 10 years, moving cash into a diversified equity index can compound it to over 3x its starting value, safely outpacing inflation.',
  },
  {
    storyId: 'story_7',
    characterName: 'Amit',
    age: 29,
    income: '₹12 Lakh/year',
    intro: 'Amit has ₹2 Lakh in stock market investments, but is carrying ₹2 Lakh outstanding credit card debt charging 42% annual compound interest.',
    projectionYears: 3,
    choices: {
      A: {
        label: 'Pay Minimum Due (Keep Stocks)',
        description: 'Keep his stock portfolio intact. Pay only the minimum credit card due of ₹10,000/month.',
        projectedOutcome: -480000,
        isOptimal: false,
      },
      B: {
        label: 'Sell Stocks, Clear Debt',
        description: 'Immediately liquidate his ₹2 Lakh stock portfolio and pay off the credit card debt in full to hit ₹0 balance.',
        projectedOutcome: 0,
        isOptimal: true,
      },
    },
    communityVotes: {
      A: 30,
      B: 70,
    },
    lesson: 'No stock market return (12-15% CAGR) can ever outrun the compounding destruction of credit card interest (36-42%). Keeping investments while carrying credit card debt is a mathematical trap. Pay off high-interest debt first!',
  },
  {
    storyId: 'story_8',
    characterName: 'Sid',
    age: 27,
    income: '₹8 Lakh/year',
    intro: 'Sid is looking to buy life insurance. An advisor suggests an Endowment (Traditional) LIC Policy costing ₹50,000/year.',
    projectionYears: 15,
    choices: {
      A: {
        label: 'Endowment Endowment Plan',
        description: 'Pay ₹50,000/year for 15 years. Endowment plan guarantees a return of ~5.5% CAGR, yielding ₹10.2 Lakhs.',
        projectedOutcome: 1020000,
        isOptimal: false,
      },
      B: {
        label: 'Term Plan + Equity Index SIP',
        description: 'Buy a pure Term Cover (₹10,000/year for ₹1 Crore cover). Invest the remaining ₹40,000/year in a Direct index fund.',
        projectedOutcome: 1680000,
        isOptimal: true,
      },
    },
    communityVotes: {
      A: 62,
      B: 38,
    },
    lesson: 'Endowment policies combine insurance and investment but do both poorly, yielding low 5-6% returns. Keeping them separate—buying a cheap Term Insurance cover and investing the difference in equity index funds—yields 60%+ more wealth.',
  },
];

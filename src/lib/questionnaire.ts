// Political profile questionnaire — each question maps to one or more score dimensions
export interface Question {
  id: string;
  text: string;
  category: string;
  options: { label: string; scores: Partial<ScoreMap> }[];
}

export interface ScoreMap {
  economic: number;
  social: number;
  foreign_policy: number;
  environment: number;
  healthcare: number;
  immigration: number;
  gun_policy: number;
  education: number;
}

export const QUESTIONS: Question[] = [
  // ─── Economic ───
  {
    id: "tax_policy",
    text: "What is your view on taxes?",
    category: "Economy",
    options: [
      {
        label: "Lower taxes for everyone, including corporations — it spurs growth",
        scores: { economic: 0.8 },
      },
      {
        label: "Lower taxes for the middle class, higher taxes on the wealthy and corporations",
        scores: { economic: -0.5 },
      },
      {
        label: "Keep taxes roughly where they are",
        scores: { economic: 0.0 },
      },
      {
        label: "Significantly raise taxes on the wealthy to fund social programs",
        scores: { economic: -0.9 },
      },
    ],
  },
  {
    id: "govt_spending",
    text: "How should the government handle spending?",
    category: "Economy",
    options: [
      {
        label: "Cut spending significantly — the government is too big",
        scores: { economic: 0.9 },
      },
      {
        label: "Maintain current spending but reallocate priorities",
        scores: { economic: 0.1 },
      },
      {
        label: "Increase spending on social safety nets and infrastructure",
        scores: { economic: -0.7 },
      },
      {
        label: "Dramatically expand government programs like universal basic income",
        scores: { economic: -0.9 },
      },
    ],
  },
  {
    id: "minimum_wage",
    text: "What should happen with the minimum wage?",
    category: "Economy",
    options: [
      {
        label: "Eliminate it — let the market decide wages",
        scores: { economic: 1.0 },
      },
      {
        label: "Keep it the same",
        scores: { economic: 0.3 },
      },
      {
        label: "Raise it to $15/hour",
        scores: { economic: -0.5 },
      },
      {
        label: "Raise it to a living wage ($20+/hour) indexed to inflation",
        scores: { economic: -0.9 },
      },
    ],
  },

  // ─── Healthcare ───
  {
    id: "healthcare_system",
    text: "What healthcare system do you prefer?",
    category: "Healthcare",
    options: [
      {
        label: "Fully private — government should stay out of healthcare",
        scores: { healthcare: 1.0 },
      },
      {
        label: "Private with a safety net for those who can't afford it",
        scores: { healthcare: 0.3 },
      },
      {
        label: "Public option alongside private insurance",
        scores: { healthcare: -0.5 },
      },
      {
        label: "Universal single-payer — Medicare for All",
        scores: { healthcare: -1.0 },
      },
    ],
  },
  {
    id: "drug_pricing",
    text: "Should the government negotiate drug prices?",
    category: "Healthcare",
    options: [
      {
        label: "No — let the free market handle drug pricing",
        scores: { healthcare: 0.7 },
      },
      {
        label: "Only for government programs like Medicare",
        scores: { healthcare: 0.0 },
      },
      {
        label: "Yes — the government should aggressively negotiate all drug prices",
        scores: { healthcare: -0.8 },
      },
    ],
  },

  // ─── Environment ───
  {
    id: "climate_action",
    text: "What should we do about climate change?",
    category: "Environment",
    options: [
      {
        label: "It's not a priority — focus on economic growth",
        scores: { environment: 0.9 },
      },
      {
        label: "Encourage voluntary action by businesses, no mandates",
        scores: { environment: 0.4 },
      },
      {
        label: "Set emissions targets and incentivize clean energy",
        scores: { environment: -0.5 },
      },
      {
        label: "Aggressive action now — Green New Deal style transformation",
        scores: { environment: -1.0 },
      },
    ],
  },
  {
    id: "energy_policy",
    text: "What should our energy policy prioritize?",
    category: "Environment",
    options: [
      {
        label: "Maximize all domestic energy including fossil fuels",
        scores: { environment: 0.8 },
      },
      {
        label: "All-of-the-above approach with gradual transition to renewables",
        scores: { environment: 0.0 },
      },
      {
        label: "Rapidly transition to 100% renewable energy",
        scores: { environment: -0.9 },
      },
    ],
  },

  // ─── Social ───
  {
    id: "social_issues",
    text: "How do you feel about social and cultural issues?",
    category: "Social",
    options: [
      {
        label: "Traditional values are important — society changes too fast",
        scores: { social: 0.8 },
      },
      {
        label: "I'm moderate — some change is good but respect tradition",
        scores: { social: 0.1 },
      },
      {
        label: "Society should be inclusive and adapt to modern values",
        scores: { social: -0.6 },
      },
      {
        label: "We need bold progressive change on social justice",
        scores: { social: -1.0 },
      },
    ],
  },
  {
    id: "criminal_justice",
    text: "What's your view on criminal justice?",
    category: "Social",
    options: [
      {
        label: "Tough on crime — stricter sentencing and more police",
        scores: { social: 0.7 },
      },
      {
        label: "Balance law enforcement with rehabilitation programs",
        scores: { social: 0.0 },
      },
      {
        label: "Major reform needed — reduce incarceration, invest in communities",
        scores: { social: -0.8 },
      },
    ],
  },

  // ─── Immigration ───
  {
    id: "immigration_policy",
    text: "What's your position on immigration?",
    category: "Immigration",
    options: [
      {
        label: "Significantly reduce all immigration and secure the border first",
        scores: { immigration: 0.9 },
      },
      {
        label: "Legal immigration is fine, but enforce existing laws strictly",
        scores: { immigration: 0.4 },
      },
      {
        label: "Create a path to citizenship and expand legal immigration",
        scores: { immigration: -0.5 },
      },
      {
        label: "Open borders with minimal restrictions",
        scores: { immigration: -1.0 },
      },
    ],
  },

  // ─── Gun Policy ───
  {
    id: "gun_rights",
    text: "What's your position on gun policy?",
    category: "Gun Policy",
    options: [
      {
        label: "The Second Amendment is absolute — no new restrictions",
        scores: { gun_policy: 1.0 },
      },
      {
        label: "Protect gun rights but support background checks",
        scores: { gun_policy: 0.3 },
      },
      {
        label: "Ban assault weapons and high-capacity magazines",
        scores: { gun_policy: -0.6 },
      },
      {
        label: "Strict gun control — heavily regulate or ban most firearms",
        scores: { gun_policy: -1.0 },
      },
    ],
  },

  // ─── Education ───
  {
    id: "education_policy",
    text: "What's your view on education?",
    category: "Education",
    options: [
      {
        label: "School choice — parents should pick any school with vouchers",
        scores: { education: 0.8 },
      },
      {
        label: "Improve public schools but allow charter schools",
        scores: { education: 0.1 },
      },
      {
        label: "Invest heavily in public schools — they should be the priority",
        scores: { education: -0.7 },
      },
      {
        label: "Free public college and universal pre-K",
        scores: { education: -0.9 },
      },
    ],
  },

  // ─── Foreign Policy ───
  {
    id: "foreign_policy",
    text: "How should the US engage with the world?",
    category: "Foreign Policy",
    options: [
      {
        label: "America First — reduce international commitments",
        scores: { foreign_policy: 0.5 },
      },
      {
        label: "Maintain strong military and alliances to protect interests",
        scores: { foreign_policy: 0.8 },
      },
      {
        label: "Prioritize diplomacy and international cooperation",
        scores: { foreign_policy: -0.5 },
      },
      {
        label: "Significantly reduce military spending, focus on peace",
        scores: { foreign_policy: -0.9 },
      },
    ],
  },
  {
    id: "military_spending",
    text: "What should happen with military spending?",
    category: "Foreign Policy",
    options: [
      {
        label: "Increase it — we need the strongest military in the world",
        scores: { foreign_policy: 0.9 },
      },
      {
        label: "Keep it about the same",
        scores: { foreign_policy: 0.2 },
      },
      {
        label: "Cut it and redirect funds to domestic needs",
        scores: { foreign_policy: -0.8 },
      },
    ],
  },
];

// Calculate scores from questionnaire answers
export function calculateScores(
  answers: Record<string, number> // questionId -> selected option index
): {
  economic: number;
  social: number;
  foreign_policy: number;
  environment: number;
  healthcare: number;
  immigration: number;
  gun_policy: number;
  education: number;
} {
  const totals: Record<string, { sum: number; count: number }> = {
    economic: { sum: 0, count: 0 },
    social: { sum: 0, count: 0 },
    foreign_policy: { sum: 0, count: 0 },
    environment: { sum: 0, count: 0 },
    healthcare: { sum: 0, count: 0 },
    immigration: { sum: 0, count: 0 },
    gun_policy: { sum: 0, count: 0 },
    education: { sum: 0, count: 0 },
  };

  for (const [questionId, optionIndex] of Object.entries(answers)) {
    const question = QUESTIONS.find((q) => q.id === questionId);
    if (!question) continue;
    const option = question.options[optionIndex];
    if (!option) continue;

    for (const [dimension, score] of Object.entries(option.scores)) {
      if (totals[dimension]) {
        totals[dimension].sum += score;
        totals[dimension].count += 1;
      }
    }
  }

  const result: Record<string, number> = {};
  for (const [dim, { sum, count }] of Object.entries(totals)) {
    result[dim] = count > 0 ? Math.round((sum / count) * 100) / 100 : 0;
  }

  return result as ReturnType<typeof calculateScores>;
}

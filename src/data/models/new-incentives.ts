import type { CEAModel, CEANode, CountryData } from '../../types/cea';

function fmt(n: number) { return Math.round(n).toLocaleString(); }

// Discount factors for future deaths averted
const DISCOUNT_5_14 = Math.pow(0.995, 10);     // ~0.9511
const DISCOUNT_15_49 = Math.pow(0.995, 32.5);  // ~0.8504
const DISCOUNT_50_74 = Math.pow(0.995, 62.5);  // ~0.7324

// Intervention-level adjustment affecting lives saved (constant across states)
const ADJ_INTERVENTION_LIVES = 0.236;

const niNodes: CEANode[] = [
  // === COSTS ===
  {
    id: 'grant_size',
    label: 'Grant size',
    section: 'costs',
    nodeKind: 'input',
    format: 'currency',
    editable: true,
    description:
      'Total grant amount allocated for New Incentives\u2019 conditional cash transfer program to increase infant vaccination.',
    dependencies: [],
  },
  {
    id: 'cost_per_infant',
    label: 'Adjusted cost per infant enrolled',
    section: 'costs',
    nodeKind: 'input',
    format: 'currency',
    editable: false,
    description:
      'Cost per infant enrolled in the program ($16.26), adjusted upward for repeat enrollments (+10.7%) to $18.21.',
    dependencies: [],
  },
  {
    id: 'children_enrolled',
    label: 'Total children enrolled',
    section: 'costs',
    nodeKind: 'derived',
    format: 'number',
    editable: false,
    description:
      'Total number of infants enrolled in the vaccination incentive program with this grant.',
    formula: 'Grant size \u00F7 Cost per infant enrolled',
    compute: (v) => v.grant_size / v.cost_per_infant,
    dependencies: ['grant_size', 'cost_per_infant'],
    dependencyOps: { grant_size: '\u00F7', cost_per_infant: '\u00F7' },
  },

  // === VACCINATION COVERAGE ===
  {
    id: 'counterfactual_unvax_rate',
    label: 'Counterfactual unvaccinated rate',
    section: 'coverage',
    nodeKind: 'input',
    format: 'percentage',
    editable: false,
    description:
      'Proportion of children who would NOT be vaccinated in the absence of the program, aggregated across incentivized vaccines. Varies by state based on baseline vaccination coverage.',
    dependencies: [],
  },
  {
    id: 'treatment_effect',
    label: 'Treatment effect on unvaccinated',
    section: 'coverage',
    nodeKind: 'input',
    format: 'percentage',
    editable: false,
    description:
      'Reduction in the proportion of unvaccinated children as a result of the program, based on the New Incentives RCT (33.3%), adjusted for internal validity (-12%).',
    dependencies: [],
  },
  {
    id: 'children_vaccinated',
    label: 'Children counterfactually vaccinated',
    section: 'coverage',
    nodeKind: 'derived',
    format: 'number',
    editable: false,
    description:
      'Number of children who got vaccinated because of the program and would not have been vaccinated otherwise.',
    formula: 'Enrolled \u00D7 Effect \u00D7 Unvax rate \u00F7 Total vax rate',
    compute: (v) => {
      const unvax = v.counterfactual_unvax_rate;
      const effect = v.treatment_effect;
      const increase = effect * unvax;
      const totalVaxRate = (1 - unvax) + increase;
      return v.children_enrolled * increase / totalVaxRate;
    },
    dependencies: ['children_enrolled', 'counterfactual_unvax_rate', 'treatment_effect'],
    dependencyOps: {
      children_enrolled: '\u00D7',
      counterfactual_unvax_rate: '\u00D7',
      treatment_effect: '\u00D7',
    },
  },

  // === DEATHS AVERTED ===
  {
    id: 'deaths_averted_u5',
    label: 'Deaths averted (under 5)',
    section: 'deaths_averted',
    nodeKind: 'derived',
    format: 'number',
    editable: false,
    description:
      'Deaths averted among people under age 5 from vaccine-preventable diseases, including indirect mortality effects (75% uplift).',
    formula: 'Children vaccinated \u00D7 Mortality risk per vaccinated child',
    compute: (v) => v.children_vaccinated * v._death_rate_u5,
    dependencies: ['children_vaccinated'],
  },
  {
    id: 'deaths_averted_5_14',
    label: 'Deaths averted (5\u201314, discounted)',
    section: 'deaths_averted',
    nodeKind: 'derived',
    format: 'number',
    editable: false,
    description:
      'Discounted deaths averted among people age 5\u201314. Discounted at 0.5% per year over an average of 10 years between vaccination and mortality.',
    formula: 'Children vaccinated \u00D7 Mortality risk \u00D7 Discount factor',
    compute: (v) => v.children_vaccinated * v._death_rate_5_14 * DISCOUNT_5_14,
    dependencies: ['children_vaccinated'],
  },
  {
    id: 'deaths_averted_15_49',
    label: 'Deaths averted (15\u201349, discounted)',
    section: 'deaths_averted',
    nodeKind: 'derived',
    format: 'number',
    editable: false,
    description:
      'Discounted deaths averted among people age 15\u201349. Discounted at 0.5% per year over an average of 32.5 years.',
    formula: 'Children vaccinated \u00D7 Mortality risk \u00D7 Discount factor',
    compute: (v) => v.children_vaccinated * v._death_rate_15_49 * DISCOUNT_15_49,
    dependencies: ['children_vaccinated'],
  },
  {
    id: 'deaths_averted_50_74',
    label: 'Deaths averted (50\u201374, discounted)',
    section: 'deaths_averted',
    nodeKind: 'derived',
    format: 'number',
    editable: false,
    description:
      'Discounted deaths averted among people age 50\u201374. Discounted at 0.5% per year over an average of 62.5 years.',
    formula: 'Children vaccinated \u00D7 Mortality risk \u00D7 Discount factor',
    compute: (v) => v.children_vaccinated * v._death_rate_50_74 * DISCOUNT_50_74,
    dependencies: ['children_vaccinated'],
  },

  // === VALUE ASSIGNMENTS ===
  {
    id: 'value_per_u5_death',
    label: 'Value per under-5 death averted',
    section: 'value',
    nodeKind: 'input',
    format: 'uov',
    editable: false,
    description:
      'Units of value assigned to averting one death of a person under age 5 from vaccine-preventable disease.',
    dependencies: [],
  },
  {
    id: 'value_per_5_14_death',
    label: 'Value per 5\u201314 death averted',
    section: 'value',
    nodeKind: 'input',
    format: 'uov',
    editable: false,
    description:
      'Units of value assigned to averting one death of a person age 5\u201314 from vaccine-preventable disease.',
    dependencies: [],
  },
  {
    id: 'value_per_15_49_death',
    label: 'Value per 15\u201349 death averted',
    section: 'value',
    nodeKind: 'input',
    format: 'uov',
    editable: false,
    description:
      'Units of value assigned to averting one death of a person age 15\u201349 from vaccine-preventable disease.',
    dependencies: [],
  },
  {
    id: 'value_per_50_74_death',
    label: 'Value per 50\u201374 death averted',
    section: 'value',
    nodeKind: 'input',
    format: 'uov',
    editable: false,
    description:
      'Units of value assigned to averting one death of a person age 50\u201374 from vaccine-preventable disease.',
    dependencies: [],
  },
  {
    id: 'income_value_ratio',
    label: 'Income increase value ratio',
    section: 'value',
    nodeKind: 'input',
    format: 'number',
    editable: false,
    description:
      'Ratio of value from long-term income increases to value from mortality averted among under-15s. Based on SMC comparison (0.307), with no additional adjustment for New Incentives.',
    dependencies: [],
  },
  {
    id: 'total_value',
    label: 'Total units of value (before adjustments)',
    section: 'value',
    nodeKind: 'derived',
    format: 'uov',
    editable: false,
    description:
      'Sum of all value streams: mortality reduction across all age groups, long-term income increases, and consumption increases from cash transfers.',
    formula: '\u03A3(Deaths \u00D7 Value) + Income value + Consumption value',
    compute: (v) => {
      const mortValue =
        v.deaths_averted_u5 * v.value_per_u5_death +
        v.deaths_averted_5_14 * v.value_per_5_14_death +
        v.deaths_averted_15_49 * v.value_per_15_49_death +
        v.deaths_averted_50_74 * v.value_per_50_74_death;
      const u15MortValue =
        v.deaths_averted_u5 * v.value_per_u5_death +
        v.deaths_averted_5_14 * v.value_per_5_14_death;
      const incomeValue = v.income_value_ratio * u15MortValue;
      return mortValue + incomeValue + v._value_consumption;
    },
    dependencies: [
      'deaths_averted_u5',
      'deaths_averted_5_14',
      'deaths_averted_15_49',
      'deaths_averted_50_74',
      'value_per_u5_death',
      'value_per_5_14_death',
      'value_per_15_49_death',
      'value_per_50_74_death',
      'income_value_ratio',
    ],
    dependencyOps: {
      deaths_averted_u5: '\u00D7',
      deaths_averted_5_14: '\u00D7',
      deaths_averted_15_49: '\u00D7',
      deaths_averted_50_74: '\u00D7',
      value_per_u5_death: '\u00D7',
      value_per_5_14_death: '\u00D7',
      value_per_15_49_death: '\u00D7',
      value_per_50_74_death: '\u00D7',
      income_value_ratio: '\u00D7',
    },
  },

  // === INITIAL COST-EFFECTIVENESS ===
  {
    id: 'benchmark',
    label: 'Cash transfer benchmark',
    section: 'initial_ce',
    nodeKind: 'input',
    format: 'uov',
    editable: false,
    description:
      'GiveWell\u2019s estimate of the units of value generated per dollar spent on unconditional cash transfers (GiveDirectly).',
    dependencies: [],
  },
  {
    id: 'initial_ce',
    label: 'Initial cost-effectiveness',
    section: 'initial_ce',
    nodeKind: 'derived',
    format: 'multiplier',
    editable: false,
    description:
      'Cost-effectiveness relative to GiveDirectly cash transfers, before grantee-level and intervention-level adjustments.',
    formula: '(Total value \u00F7 Grant) \u00F7 Benchmark',
    compute: (v) => (v.total_value / v.grant_size) / v.benchmark,
    dependencies: ['total_value', 'grant_size', 'benchmark'],
    dependencyOps: {
      total_value: '\u00D7',
      grant_size: '\u00F7',
      benchmark: '\u00F7',
    },
  },

  // === ADJUSTMENTS ===
  {
    id: 'adj_grantee',
    label: 'Adj: grantee-level factors',
    section: 'adjustments',
    nodeKind: 'adjustment',
    format: 'percentage',
    editable: true,
    description:
      'Adjustment for grantee risks: biased monitoring (-2%), non-funding bottlenecks (-5%). Covers wastage, monitoring quality, and fund use confidence.',
    dependencies: [],
  },
  {
    id: 'adj_intervention',
    label: 'Adj: intervention-level factors',
    section: 'adjustments',
    nodeKind: 'adjustment',
    format: 'percentage',
    editable: true,
    description:
      'Net supplemental adjustment for intervention effects: morbidity (+6.7%), inflation (-5%), treatment costs averted (+20%), income investment (+5%), herd immunity (+12.5%), lower infection transmission (+6%), timeliness (+3.5%), outbreak effects (+4%), serotype replacement (-4%), polio outbreaks (-2%), indirect vaccine mortality effects (+3.6%).',
    dependencies: [],
  },
  {
    id: 'adj_leverage_funging',
    label: 'Adj: leverage & funging',
    section: 'adjustments',
    nodeKind: 'adjustment',
    format: 'percentage',
    editable: true,
    description:
      'Combined adjustment for the possibility of crowding funding into the program (leverage, negative) and crowding funding out (funging, negative). Varies by state.',
    dependencies: [],
  },

  // === FINAL RESULTS ===
  {
    id: 'final_ce',
    label: 'Final cost-effectiveness',
    section: 'final',
    nodeKind: 'output',
    format: 'multiplier',
    editable: false,
    description:
      'The final cost-effectiveness estimate after all adjustments, expressed as a multiple of GiveDirectly cash transfers.',
    formula: 'Initial CE \u00D7 (1 + grantee adj) \u00D7 (1 + intervention adj) \u00D7 (1 + leverage/funging adj)',
    compute: (v) =>
      v.initial_ce *
      (1 + v.adj_grantee) *
      (1 + v.adj_intervention) *
      (1 + v.adj_leverage_funging),
    dependencies: ['initial_ce', 'adj_grantee', 'adj_intervention', 'adj_leverage_funging'],
    dependencyOps: {
      initial_ce: '\u00D7',
      adj_grantee: '\u00D7 (1+)',
      adj_intervention: '\u00D7 (1+)',
      adj_leverage_funging: '\u00D7 (1+)',
    },
  },
  {
    id: 'cost_per_life_saved',
    label: 'Cost per life saved',
    section: 'final',
    nodeKind: 'output',
    format: 'currency',
    editable: false,
    description:
      'The estimated cost per death counterfactually averted, accounting for all adjustments.',
    formula: 'Grant \u00F7 (Total deaths \u00D7 All adjustments)',
    compute: (v) => {
      const totalDeaths =
        v.deaths_averted_u5 +
        v.deaths_averted_5_14 +
        v.deaths_averted_15_49 +
        v.deaths_averted_50_74;
      const adjFactor =
        (1 + v.adj_grantee) *
        (1 + ADJ_INTERVENTION_LIVES) *
        (1 + v.adj_leverage_funging);
      return v.grant_size / (totalDeaths * adjFactor);
    },
    dependencies: [
      'grant_size',
      'deaths_averted_u5',
      'deaths_averted_5_14',
      'deaths_averted_15_49',
      'deaths_averted_50_74',
      'adj_grantee',
      'adj_leverage_funging',
    ],
    dependencyOps: {
      grant_size: '\u00F7',
      deaths_averted_u5: '\u00F7',
      deaths_averted_5_14: '\u00F7',
      deaths_averted_15_49: '\u00F7',
      deaths_averted_50_74: '\u00F7',
      adj_grantee: '\u00D7 (1+)',
      adj_leverage_funging: '\u00D7 (1+)',
    },
  },
];

// State data for New Incentives (7 Nigerian states)
// Hidden parameters prefixed with _ are used in compute functions but don't have their own nodes
// _death_rate_X = mortality_prob_combined × vaccine_efficacy for each age group
const niStates: CountryData[] = [
  {
    id: 'bauchi',
    name: 'Bauchi',
    values: {
      grant_size: 1_000_000,
      cost_per_infant: 18.2126,
      counterfactual_unvax_rate: 0.4368,
      treatment_effect: 0.2931,
      value_per_u5_death: 116.25262,
      value_per_5_14_death: 133.7,
      value_per_15_49_death: 103.58571,
      value_per_50_74_death: 42.44,
      income_value_ratio: 0.30647,
      benchmark: 0.00333,
      adj_grantee: -0.07,
      adj_intervention: 0.503,
      adj_leverage_funging: -0.13768,
      _death_rate_u5: 0.05654 * 0.5226,
      _death_rate_5_14: 0.004314 * 0.5100,
      _death_rate_15_49: 0.01358 * 0.1730,
      _death_rate_50_74: 0.05343 * 0.08492,
      _value_consumption: 2472.90,
    },
  },
  {
    id: 'gombe',
    name: 'Gombe',
    values: {
      grant_size: 1_000_000,
      cost_per_infant: 18.2126,
      counterfactual_unvax_rate: 0.3174,
      treatment_effect: 0.2931,
      value_per_u5_death: 116.25262,
      value_per_5_14_death: 133.7,
      value_per_15_49_death: 103.58571,
      value_per_50_74_death: 42.44,
      income_value_ratio: 0.30647,
      benchmark: 0.00333,
      adj_grantee: -0.07,
      adj_intervention: 0.503,
      adj_leverage_funging: -0.14388,
      _death_rate_u5: 0.04199 * 0.5274,
      _death_rate_5_14: 0.003082 * 0.5115,
      _death_rate_15_49: 0.008089 * 0.1802,
      _death_rate_50_74: 0.03700 * 0.09082,
      _value_consumption: 2472.90,
    },
  },
  {
    id: 'jigawa',
    name: 'Jigawa',
    values: {
      grant_size: 1_000_000,
      cost_per_infant: 18.2126,
      counterfactual_unvax_rate: 0.3613,
      treatment_effect: 0.2931,
      value_per_u5_death: 116.25262,
      value_per_5_14_death: 133.7,
      value_per_15_49_death: 103.58571,
      value_per_50_74_death: 42.44,
      income_value_ratio: 0.30647,
      benchmark: 0.00333,
      adj_grantee: -0.07,
      adj_intervention: 0.503,
      adj_leverage_funging: -0.13048,
      _death_rate_u5: 0.06325 * 0.5508,
      _death_rate_5_14: 0.004581 * 0.5329,
      _death_rate_15_49: 0.01553 * 0.1685,
      _death_rate_50_74: 0.05265 * 0.08175,
      _value_consumption: 2472.90,
    },
  },
  {
    id: 'kaduna',
    name: 'Kaduna',
    values: {
      grant_size: 1_000_000,
      cost_per_infant: 18.2126,
      counterfactual_unvax_rate: 0.3898,
      treatment_effect: 0.2931,
      value_per_u5_death: 116.25262,
      value_per_5_14_death: 133.7,
      value_per_15_49_death: 103.58571,
      value_per_50_74_death: 42.44,
      income_value_ratio: 0.30647,
      benchmark: 0.00333,
      adj_grantee: -0.07,
      adj_intervention: 0.503,
      adj_leverage_funging: -0.16690,
      _death_rate_u5: 0.02844 * 0.5437,
      _death_rate_5_14: 0.002095 * 0.5286,
      _death_rate_15_49: 0.005946 * 0.1846,
      _death_rate_50_74: 0.02086 * 0.09052,
      _value_consumption: 2472.90,
    },
  },
  {
    id: 'kano',
    name: 'Kano',
    values: {
      grant_size: 1_000_000,
      cost_per_infant: 18.2126,
      counterfactual_unvax_rate: 0.4074,
      treatment_effect: 0.2931,
      value_per_u5_death: 116.25262,
      value_per_5_14_death: 133.7,
      value_per_15_49_death: 103.58571,
      value_per_50_74_death: 42.44,
      income_value_ratio: 0.30647,
      benchmark: 0.00333,
      adj_grantee: -0.07,
      adj_intervention: 0.503,
      adj_leverage_funging: -0.15232,
      _death_rate_u5: 0.04002 * 0.5160,
      _death_rate_5_14: 0.003000 * 0.4997,
      _death_rate_15_49: 0.007590 * 0.1782,
      _death_rate_50_74: 0.02798 * 0.08790,
      _value_consumption: 2472.90,
    },
  },
  {
    id: 'katsina',
    name: 'Katsina',
    values: {
      grant_size: 1_000_000,
      cost_per_infant: 18.2126,
      counterfactual_unvax_rate: 0.4438,
      treatment_effect: 0.2931,
      value_per_u5_death: 116.25262,
      value_per_5_14_death: 133.7,
      value_per_15_49_death: 103.58571,
      value_per_50_74_death: 42.44,
      income_value_ratio: 0.30647,
      benchmark: 0.00333,
      adj_grantee: -0.07,
      adj_intervention: 0.503,
      adj_leverage_funging: -0.14572,
      _death_rate_u5: 0.04391 * 0.5458,
      _death_rate_5_14: 0.003599 * 0.5291,
      _death_rate_15_49: 0.01273 * 0.1713,
      _death_rate_50_74: 0.04545 * 0.08387,
      _value_consumption: 2472.90,
    },
  },
  {
    id: 'kebbi',
    name: 'Kebbi',
    values: {
      grant_size: 1_000_000,
      cost_per_infant: 18.2126,
      counterfactual_unvax_rate: 0.5711,
      treatment_effect: 0.2931,
      value_per_u5_death: 116.25262,
      value_per_5_14_death: 133.7,
      value_per_15_49_death: 103.58571,
      value_per_50_74_death: 42.44,
      income_value_ratio: 0.30647,
      benchmark: 0.00333,
      adj_grantee: -0.07,
      adj_intervention: 0.503,
      adj_leverage_funging: -0.14155,
      _death_rate_u5: 0.05121 * 0.5582,
      _death_rate_5_14: 0.004145 * 0.5379,
      _death_rate_15_49: 0.01367 * 0.1728,
      _death_rate_50_74: 0.05635 * 0.08450,
      _value_consumption: 2472.90,
    },
  },
];

export const newIncentivesModel: CEAModel = {
  id: 'new-incentives',
  title: 'GiveWell New Incentives Cost-Effectiveness Analysis',
  subtitle: 'Conditional Cash Transfers for Infant Vaccination \u00B7 Main CEA',
  regionLabel: 'State',
  logos: ['/logos/givewell.png', '/logos/new-incentives.svg'],
  nodes: niNodes,
  regions: niStates,
  layoutSections: [
    {
      id: 'costs',
      label: 'Costs',
      nodeIds: ['grant_size', 'cost_per_infant', 'children_enrolled'],
    },
    {
      id: 'coverage',
      label: 'Vaccination Coverage',
      nodeIds: ['counterfactual_unvax_rate', 'treatment_effect', 'children_vaccinated'],
    },
    {
      id: 'deaths_averted',
      label: 'Deaths Averted',
      nodeIds: ['deaths_averted_u5', 'deaths_averted_5_14', 'deaths_averted_15_49', 'deaths_averted_50_74'],
    },
    {
      id: 'value',
      label: 'Value of Outcomes',
      nodeIds: [
        'value_per_u5_death', 'value_per_5_14_death', 'value_per_15_49_death', 'value_per_50_74_death',
        'income_value_ratio', 'total_value',
      ],
    },
    {
      id: 'initial_ce',
      label: 'Initial Cost-Effectiveness',
      nodeIds: ['benchmark', 'initial_ce'],
    },
    {
      id: 'adjustments',
      label: 'Adjustments',
      nodeIds: ['adj_grantee', 'adj_intervention', 'adj_leverage_funging'],
    },
    {
      id: 'final',
      label: 'Final Estimate',
      nodeIds: ['final_ce', 'cost_per_life_saved'],
    },
  ],
  spreadsheetSections: [
    {
      title: 'Costs',
      rows: [
        { nodeId: 'grant_size', label: 'Grant size' },
        { nodeId: 'cost_per_infant', label: 'Adjusted cost per infant enrolled' },
        { nodeId: 'children_enrolled', label: 'Total children enrolled' },
      ],
    },
    {
      title: 'Vaccination coverage',
      rows: [
        { nodeId: 'counterfactual_unvax_rate', label: 'Counterfactual unvaccinated rate' },
        { nodeId: 'treatment_effect', label: 'Treatment effect on unvaccinated' },
        { nodeId: 'children_vaccinated', label: 'Children counterfactually vaccinated' },
      ],
    },
    {
      title: 'Deaths averted',
      rows: [
        { nodeId: 'deaths_averted_u5', label: 'Deaths averted (under 5)' },
        { nodeId: 'deaths_averted_5_14', label: 'Deaths averted (5\u201314, discounted)' },
        { nodeId: 'deaths_averted_15_49', label: 'Deaths averted (15\u201349, discounted)' },
        { nodeId: 'deaths_averted_50_74', label: 'Deaths averted (50\u201374, discounted)' },
      ],
    },
    {
      title: 'Value of outcomes',
      rows: [
        { nodeId: 'value_per_u5_death', label: 'Value per under-5 death averted' },
        { nodeId: 'value_per_5_14_death', label: 'Value per 5\u201314 death averted' },
        { nodeId: 'value_per_15_49_death', label: 'Value per 15\u201349 death averted' },
        { nodeId: 'value_per_50_74_death', label: 'Value per 50\u201374 death averted' },
        { nodeId: 'income_value_ratio', label: 'Income increase value ratio' },
        { nodeId: 'total_value', label: 'Total units of value (before adjustments)' },
      ],
    },
    {
      title: 'Initial cost-effectiveness',
      rows: [
        { nodeId: 'benchmark', label: 'Cash transfer benchmark (UoV/$)' },
        { nodeId: 'initial_ce', label: 'Initial cost-effectiveness (x benchmark)' },
      ],
    },
    {
      title: 'Adjustments',
      rows: [
        { nodeId: 'adj_grantee', label: 'Adj: grantee-level factors' },
        { nodeId: 'adj_intervention', label: 'Adj: intervention-level factors' },
        { nodeId: 'adj_leverage_funging', label: 'Adj: leverage & funging' },
      ],
    },
    {
      title: 'Final cost-effectiveness estimate',
      rows: [
        { nodeId: 'final_ce', label: 'Final cost-effectiveness (x benchmark)' },
        { nodeId: 'cost_per_life_saved', label: 'Cost per life saved' },
      ],
    },
  ],
  getNarrative: (v, region) =>
    `For every $${fmt(v.grant_size)} donated to New Incentives in ${region}, roughly ${fmt(v.children_enrolled)} infants are enrolled in the vaccination program — averting an estimated ${v.deaths_averted_u5 !== undefined ? v.deaths_averted_u5.toFixed(1) : '?'} under-5 deaths and delivering ${v.final_ce?.toFixed(1)}× the impact of direct cash transfers ($${fmt(v.cost_per_life_saved)} per life saved).`,
};

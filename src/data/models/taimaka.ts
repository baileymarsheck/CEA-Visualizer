import type { CEAModel, CEANode, CountryData } from '../../types/cea';

function fmt(n: number) { return Math.round(n).toLocaleString(); }

const taimakaNodes: CEANode[] = [
  // === GRANT ===
  {
    id: 'grant_size',
    label: 'Grant size',
    section: 'grant',
    nodeKind: 'input',
    format: 'currency',
    editable: true,
    description:
      'Total grant amount allocated to Taimaka for malnutrition treatment in Gombe State, Nigeria.',
    dependencies: [],
  },
  {
    id: 'cost_per_child',
    label: 'Cost per child treated',
    section: 'grant',
    nodeKind: 'input',
    format: 'currency',
    editable: false,
    description:
      'Total program cost per child treated for severe acute malnutrition (SAM), including direct treatment costs and program overhead.',
    dependencies: [],
  },

  // === CHILDREN REACHED ===
  {
    id: 'children_treated',
    label: 'Children treated',
    section: 'coverage',
    nodeKind: 'derived',
    format: 'number',
    editable: false,
    description:
      'Total number of severely malnourished children who receive treatment funded by this grant.',
    formula: 'Grant size \u00F7 Cost per child',
    compute: (v) => v.grant_size / v.cost_per_child,
    dependencies: ['grant_size', 'cost_per_child'],
    dependencyOps: { grant_size: '\u00F7', cost_per_child: '\u00F7' },
  },
  {
    id: 'govt_treatment_share',
    label: 'Share receiving govt treatment (counterfactual)',
    section: 'coverage',
    nodeKind: 'input',
    format: 'percentage',
    editable: false,
    description:
      'Proportion of children reached by Taimaka who would have received government malnutrition treatment in the absence of the program. Reduces counterfactual impact since government treatment already saves some lives.',
    dependencies: [],
  },
  {
    id: 'additional_children',
    label: 'Additional children reached',
    section: 'coverage',
    nodeKind: 'derived',
    format: 'number',
    editable: false,
    description:
      'Number of children who receive treatment because of Taimaka and would have received no treatment otherwise — the net counterfactual impact on coverage.',
    formula: 'Children treated \u00D7 (1 \u2212 Govt treatment share)',
    compute: (v) => v.children_treated * (1 - v.govt_treatment_share),
    dependencies: ['children_treated', 'govt_treatment_share'],
    dependencyOps: { children_treated: '\u00D7', govt_treatment_share: '\u00D7 (1\u2212)' },
  },

  // === UNTREATED MORTALITY RATE ===
  {
    id: 'mortality_rate_initial',
    label: 'Untreated mortality rate (initial)',
    section: 'mortality',
    nodeKind: 'input',
    format: 'percentage',
    editable: false,
    description:
      'Estimated annual all-cause mortality rate among children 6\u201359 months with untreated severe acute malnutrition, before plausibility adjustment. Drawn from a systematic review of untreated SAM mortality.',
    dependencies: [],
  },
  {
    id: 'plausibility_discount',
    label: 'Plausibility discount',
    section: 'mortality',
    nodeKind: 'input',
    format: 'percentage',
    editable: false,
    description:
      'Downward adjustment to the initial mortality rate based on a ceiling analysis: if true SAM prevalence equals the observed rate, the implied population-level under-5 mortality rate would exceed what is actually observed. This discount corrects for that inconsistency.',
    dependencies: [],
  },
  {
    id: 'mortality_rate_adjusted',
    label: 'Untreated mortality rate (adjusted)',
    section: 'mortality',
    nodeKind: 'derived',
    format: 'percentage',
    editable: false,
    description:
      'Best-guess annual all-cause mortality rate among children with untreated severe acute malnutrition, after applying the plausibility discount from the ceiling analysis.',
    formula: 'Initial rate \u00D7 Plausibility discount',
    compute: (v) => v.mortality_rate_initial * v.plausibility_discount,
    dependencies: ['mortality_rate_initial', 'plausibility_discount'],
    dependencyOps: { mortality_rate_initial: '\u00D7', plausibility_discount: '\u00D7' },
  },

  // === TREATMENT EFFECT ===
  {
    id: 'treatment_effect_ngo',
    label: 'Mortality reduction vs no treatment',
    section: 'treatment',
    nodeKind: 'input',
    format: 'percentage',
    editable: false,
    description:
      'Reduction in all-cause mortality from receiving NGO-supported malnutrition treatment, compared to receiving no treatment at all. Based on relative risk estimates from clinical SAM treatment studies.',
    dependencies: [],
  },
  {
    id: 'increased_effect_vs_govt',
    label: 'Additional reduction vs govt treatment',
    section: 'treatment',
    nodeKind: 'input',
    format: 'percentage',
    editable: false,
    description:
      'Incremental mortality reduction from receiving Taimaka\u2019s NGO-supported treatment compared to standard government treatment. Applies only to the minority of children who would otherwise receive government care.',
    dependencies: [],
  },
  {
    id: 'deaths_averted',
    label: 'Deaths averted',
    section: 'treatment',
    nodeKind: 'derived',
    format: 'number',
    editable: false,
    description:
      'Total deaths averted: deaths prevented among children who would have received no treatment (the majority) plus incremental deaths prevented among those who would have received standard government treatment.',
    formula: 'Additional children \u00D7 Rate \u00D7 Effect + Govt-substituted \u00D7 Rate \u00D7 Incremental effect',
    compute: (v) => {
      const govtSubstituted = v.children_treated - v.additional_children;
      return (
        v.additional_children * v.mortality_rate_adjusted * v.treatment_effect_ngo +
        govtSubstituted * v.mortality_rate_adjusted * v.increased_effect_vs_govt
      );
    },
    dependencies: [
      'additional_children',
      'children_treated',
      'mortality_rate_adjusted',
      'treatment_effect_ngo',
      'increased_effect_vs_govt',
    ],
    dependencyOps: {
      additional_children: '\u00D7',
      mortality_rate_adjusted: '\u00D7',
      treatment_effect_ngo: '\u00D7',
      increased_effect_vs_govt: '+\u00D7',
    },
  },

  // === VALUE OF OUTCOMES ===
  {
    id: 'income_ratio',
    label: 'Income-to-mortality value ratio',
    section: 'value',
    nodeKind: 'input',
    format: 'number',
    editable: false,
    description:
      'Ratio of value generated from long-term income increases (via improved childhood development) to value from mortality reductions. Based on GiveWell\u2019s seasonal malaria chemoprevention (SMC) comparison, adjusted downward for CMAM.',
    dependencies: [],
  },
  {
    id: 'moral_weight',
    label: 'Moral weight: under-5 death averted',
    section: 'value',
    nodeKind: 'input',
    format: 'uov',
    editable: false,
    description:
      'GiveWell\u2019s estimate of the moral value of averting one death of a child under age 5, expressed in units of value (multiples of the value of one year of doubled consumption for one person).',
    dependencies: [],
  },
  {
    id: 'total_value',
    label: 'Total units of value',
    section: 'value',
    nodeKind: 'derived',
    format: 'uov',
    editable: false,
    description:
      'Total units of value generated by the grant, combining the mortality reduction benefit and the long-term income increase benefit. Income value is added as a proportional multiple of mortality value.',
    formula: 'Deaths averted \u00D7 (1 + Income ratio) \u00D7 Moral weight',
    compute: (v) => v.deaths_averted * (1 + v.income_ratio) * v.moral_weight,
    dependencies: ['deaths_averted', 'income_ratio', 'moral_weight'],
    dependencyOps: {
      deaths_averted: '\u00D7',
      income_ratio: '\u00D7 (1+)',
      moral_weight: '\u00D7',
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
      'GiveWell\u2019s estimate of units of value generated per dollar donated to GiveDirectly\u2019s unconditional cash transfer program (33.5 UoV per $10,000). Used as the baseline for cost-effectiveness comparisons.',
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
      'Cost-effectiveness relative to GiveDirectly cash transfers, before applying supplemental adjustments for program benefits/downsides and leverage/funging.',
    formula: '(Total value \u00F7 Grant) \u00F7 Benchmark',
    compute: (v) => (v.total_value / v.grant_size) / v.benchmark,
    dependencies: ['total_value', 'grant_size', 'benchmark'],
    dependencyOps: { total_value: '\u00F7', grant_size: '\u00F7', benchmark: '\u00F7' },
  },

  // === ADJUSTMENTS ===
  {
    id: 'adj_program',
    label: 'Adj: program benefits & downsides',
    section: 'adjustments',
    nodeKind: 'adjustment',
    format: 'percentage',
    editable: true,
    description:
      'Net adjustment for additional program benefits and downsides not captured in the main calculation, such as caregiver time costs, improved nutritional status beyond mortality, and program quality considerations.',
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
      'Adjustment for the possibility that GiveWell\u2019s funding crowds out other funding sources (funging, negative) or leverages additional resources (leverage, positive). Net adjustment is negative, reflecting funging concerns.',
    dependencies: [],
  },

  // === FINAL ESTIMATE ===
  {
    id: 'final_ce',
    label: 'Final cost-effectiveness',
    section: 'final',
    nodeKind: 'output',
    format: 'multiplier',
    editable: false,
    description:
      'Final cost-effectiveness estimate after all adjustments, expressed as a multiple of GiveDirectly cash transfers. A value of ~8.8\u00D7 means Taimaka generates roughly 8.8 times as much value per dollar as direct cash transfers.',
    formula: 'Initial CE \u00D7 (1 + program adj) \u00D7 (1 + leverage adj)',
    compute: (v) =>
      v.initial_ce * (1 + v.adj_program) * (1 + v.adj_leverage_funging),
    dependencies: ['initial_ce', 'adj_program', 'adj_leverage_funging'],
    dependencyOps: {
      initial_ce: '\u00D7',
      adj_program: '\u00D7 (1+)',
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
      'Estimated cost per death averted after accounting for all adjustments. Calculated as the grant divided by adjusted total deaths averted.',
    formula: 'Grant \u00F7 (Deaths averted \u00D7 program adj \u00D7 leverage adj)',
    compute: (v) => {
      const adjDeaths =
        v.deaths_averted * (1 + v.adj_program) * (1 + v.adj_leverage_funging);
      return v.grant_size / adjDeaths;
    },
    dependencies: ['grant_size', 'deaths_averted', 'adj_program', 'adj_leverage_funging'],
    dependencyOps: {
      grant_size: '\u00F7',
      deaths_averted: '\u00F7',
      adj_program: '\u00F7 (1+)',
      adj_leverage_funging: '\u00F7 (1+)',
    },
  },
];

// Taimaka currently operates in Gombe State, Nigeria
const taimakaRegions: CountryData[] = [
  {
    id: 'gombe',
    name: 'Gombe State, Nigeria',
    values: {
      grant_size: 4_787_985,
      cost_per_child: 105.4065076,
      govt_treatment_share: 0.0465520683,
      mortality_rate_initial: 0.1321771,
      plausibility_discount: 0.3286322691,
      treatment_effect_ngo: 0.5949166667,
      increased_effect_vs_govt: 0.09697699304,
      income_ratio: 0.2015,
      moral_weight: 117.59366,
      benchmark: 0.00335,
      adj_program: -0.02045637367,
      adj_leverage_funging: -0.09906706939,
    },
  },
];

export const taimakaModel: CEAModel = {
  id: 'taimaka',
  title: 'GiveWell Taimaka Cost-Effectiveness Analysis',
  subtitle: 'Malnutrition Treatment \u00B7 Gombe State, Nigeria',
  regionLabel: 'Region',
  logos: ['/logos/givewell.png', '/logos/taimaka.png'],
  nodes: taimakaNodes,
  regions: taimakaRegions,
  layoutSections: [
    {
      id: 'grant',
      label: 'Grant',
      nodeIds: ['grant_size', 'cost_per_child'],
    },
    {
      id: 'coverage',
      label: 'Children Reached',
      nodeIds: ['children_treated', 'govt_treatment_share', 'additional_children'],
    },
    {
      id: 'mortality',
      label: 'Untreated Mortality Rate',
      nodeIds: ['mortality_rate_initial', 'plausibility_discount', 'mortality_rate_adjusted'],
    },
    {
      id: 'treatment',
      label: 'Treatment Effect',
      nodeIds: ['treatment_effect_ngo', 'increased_effect_vs_govt', 'deaths_averted'],
    },
    {
      id: 'value',
      label: 'Value of Outcomes',
      nodeIds: ['income_ratio', 'moral_weight', 'total_value'],
    },
    {
      id: 'initial_ce',
      label: 'Initial Cost-Effectiveness',
      nodeIds: ['benchmark', 'initial_ce'],
    },
    {
      id: 'adjustments',
      label: 'Adjustments',
      nodeIds: ['adj_program', 'adj_leverage_funging'],
    },
    {
      id: 'final',
      label: 'Final Estimate',
      nodeIds: ['final_ce', 'cost_per_life_saved'],
    },
  ],
  spreadsheetSections: [
    {
      title: 'Grant',
      rows: [
        { nodeId: 'grant_size', label: 'Grant size' },
        { nodeId: 'cost_per_child', label: 'Cost per child treated' },
      ],
    },
    {
      title: 'Children reached',
      rows: [
        { nodeId: 'children_treated', label: 'Children treated' },
        { nodeId: 'govt_treatment_share', label: 'Share receiving govt treatment (counterfactual)' },
        { nodeId: 'additional_children', label: 'Additional children reached' },
      ],
    },
    {
      title: 'Untreated mortality rate',
      rows: [
        { nodeId: 'mortality_rate_initial', label: 'Annual mortality rate (initial estimate)' },
        { nodeId: 'plausibility_discount', label: 'Plausibility discount' },
        { nodeId: 'mortality_rate_adjusted', label: 'Annual mortality rate (adjusted)' },
      ],
    },
    {
      title: 'Treatment effect',
      rows: [
        { nodeId: 'treatment_effect_ngo', label: 'Mortality reduction vs no treatment' },
        { nodeId: 'increased_effect_vs_govt', label: 'Additional reduction vs govt treatment' },
        { nodeId: 'deaths_averted', label: 'Total deaths averted' },
      ],
    },
    {
      title: 'Value of outcomes',
      rows: [
        { nodeId: 'income_ratio', label: 'Income-to-mortality value ratio' },
        { nodeId: 'moral_weight', label: 'Moral weight: under-5 death (UoV)' },
        { nodeId: 'total_value', label: 'Total units of value' },
      ],
    },
    {
      title: 'Initial cost-effectiveness',
      rows: [
        { nodeId: 'benchmark', label: 'Cash transfer benchmark (UoV/$)' },
        { nodeId: 'initial_ce', label: 'Initial cost-effectiveness (\u00D7 benchmark)' },
      ],
    },
    {
      title: 'Adjustments',
      rows: [
        { nodeId: 'adj_program', label: 'Adj: program benefits & downsides' },
        { nodeId: 'adj_leverage_funging', label: 'Adj: leverage & funging' },
      ],
    },
    {
      title: 'Final cost-effectiveness estimate',
      rows: [
        { nodeId: 'final_ce', label: 'Final cost-effectiveness (\u00D7 benchmark)' },
        { nodeId: 'cost_per_life_saved', label: 'Cost per life saved' },
      ],
    },
  ],
  getNarrative: (v, region) =>
    `For every $${fmt(v.grant_size)} donated to Taimaka in ${region}, roughly ${fmt(v.children_treated)} severely malnourished children receive treatment \u2014 averting an estimated ${v.deaths_averted?.toFixed(1)} deaths and delivering ${v.final_ce?.toFixed(1)}\u00D7 the impact of direct cash transfers ($${fmt(v.cost_per_life_saved)} per life saved).`,
};

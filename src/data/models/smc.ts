import type { CEAModel, CEANode, CountryData } from '../../types/cea';

function fmt(n: number) { return Math.round(n).toLocaleString(); }

const smcNodes: CEANode[] = [
  // === GRANT ===
  {
    id: 'grant_size',
    label: 'Grant size',
    section: 'grant',
    nodeKind: 'input',
    format: 'currency',
    editable: true,
    description:
      'Total grant amount allocated to Malaria Consortium for seasonal malaria chemoprevention (SMC) in the target country.',
    dependencies: [],
  },
  {
    id: 'cost_per_child',
    label: 'Cost per child under 5 reached',
    section: 'grant',
    nodeKind: 'input',
    format: 'currency',
    editable: false,
    description:
      'Total upstream program cost per child under age 5 who receives a full year of SMC cycles, including delivery, drugs, and program overhead. Varies by country based on SMC cycle costs and number of cycles per year.',
    dependencies: [],
  },

  // === CHILDREN REACHED ===
  {
    id: 'children_reached',
    label: 'Children under 5 reached',
    section: 'coverage',
    nodeKind: 'derived',
    format: 'number',
    editable: false,
    description:
      'Total number of children under age 5 who receive a full year of SMC funded by this grant.',
    formula: 'Grant size \u00F7 Cost per child',
    compute: (v) => v.grant_size / v.cost_per_child,
    dependencies: ['grant_size', 'cost_per_child'],
    dependencyOps: { grant_size: '\u00F7', cost_per_child: '\u00F7' },
  },
  {
    id: 'counterfactual_share',
    label: 'Counterfactual SMC coverage',
    section: 'coverage',
    nodeKind: 'input',
    format: 'percentage',
    editable: false,
    description:
      'Proportion of children reached who would have received SMC in the absence of this program (e.g. from government distribution). Represents the counterfactual baseline; zero means all children are additional.',
    dependencies: [],
  },
  {
    id: 'additional_children',
    label: 'Additional children receiving SMC',
    section: 'coverage',
    nodeKind: 'derived',
    format: 'number',
    editable: false,
    description:
      'Number of children who receive SMC because of this grant and would not have received it otherwise — the net counterfactual impact on coverage.',
    formula: 'Children reached \u00D7 (1 \u2212 Counterfactual share)',
    compute: (v) => v.children_reached * (1 - v.counterfactual_share),
    dependencies: ['children_reached', 'counterfactual_share'],
    dependencyOps: { children_reached: '\u00D7', counterfactual_share: '\u00D7 (1\u2212)' },
  },

  // === MORTALITY BENEFITS ===
  {
    id: 'mortality_rate',
    label: 'Malaria mortality rate under 5',
    section: 'mortality',
    nodeKind: 'input',
    format: 'percentage',
    editable: false,
    description:
      'Annual malaria-attributable mortality rate among children aged 3\u201359 months, including both direct and indirect malaria deaths and adjusted for malaria vaccine rollout in the target country. Drawn from GBD estimates.',
    dependencies: [],
  },
  {
    id: 'seasonal_share',
    label: 'Proportion during SMC season',
    section: 'mortality',
    nodeKind: 'input',
    format: 'percentage',
    editable: false,
    description:
      'Proportion of annual malaria mortality that occurs during the SMC transmission season. SMC is only administered during high-transmission months, so this limits the fraction of deaths that can be averted.',
    dependencies: [],
  },
  {
    id: 'smc_effect',
    label: 'SMC effect on malaria mortality',
    section: 'mortality',
    nodeKind: 'input',
    format: 'percentage',
    editable: false,
    description:
      'Expected reduction in malaria mortality among children under 5 who receive SMC, derived from the Meremikwu et al. 2012 meta-analysis of RCT evidence, adjusted for internal and external validity.',
    dependencies: [],
  },
  {
    id: 'deaths_averted',
    label: 'Under-5 deaths averted',
    section: 'mortality',
    nodeKind: 'derived',
    format: 'number',
    editable: false,
    description:
      'Estimated number of child (under-5) deaths averted by the SMC program: additional children reached \u00D7 malaria mortality rate \u00D7 seasonal share \u00D7 SMC protective effect.',
    formula: 'Additional children \u00D7 Mortality rate \u00D7 Seasonal share \u00D7 SMC effect',
    compute: (v) =>
      v.additional_children * v.mortality_rate * v.seasonal_share * v.smc_effect,
    dependencies: ['additional_children', 'mortality_rate', 'seasonal_share', 'smc_effect'],
    dependencyOps: {
      additional_children: '\u00D7',
      mortality_rate: '\u00D7',
      seasonal_share: '\u00D7',
      smc_effect: '\u00D7',
    },
  },

  // === INITIAL COST-EFFECTIVENESS ===
  {
    id: 'moral_weight',
    label: 'Moral weight: under-5 death averted',
    section: 'initial_ce',
    nodeKind: 'input',
    format: 'uov',
    editable: false,
    description:
      'GiveWell\u2019s estimate of the moral value of averting one death of a child under age 5, expressed in units of value (UoV). Based on estimates of the value of a year of life and years of life lost.',
    dependencies: [],
  },
  {
    id: 'benchmark',
    label: 'Cash transfer benchmark',
    section: 'initial_ce',
    nodeKind: 'input',
    format: 'number',
    editable: false,
    description:
      'GiveWell\u2019s estimate of units of value generated per dollar donated to GiveDirectly\u2019s unconditional cash transfer program. Used as the baseline for all cost-effectiveness comparisons.',
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
      'Cost-effectiveness relative to GiveDirectly cash transfers, considering only under-5 mortality benefits and before supplemental adjustments for other benefits (over-5 spillover, developmental) and additional factors.',
    formula: '(Deaths averted \u00D7 Moral weight) \u00F7 Grant \u00F7 Benchmark',
    compute: (v) => (v.deaths_averted * v.moral_weight) / v.grant_size / v.benchmark,
    dependencies: ['deaths_averted', 'moral_weight', 'grant_size', 'benchmark'],
    dependencyOps: {
      deaths_averted: '\u00D7',
      moral_weight: '\u00D7',
      grant_size: '\u00F7',
      benchmark: '\u00F7',
    },
  },

  // === ADJUSTMENTS FOR OTHER BENEFITS ===
  {
    id: 'adj_over5',
    label: 'Adj: over-5 mortality spillover',
    section: 'other_benefits',
    nodeKind: 'adjustment',
    format: 'percentage',
    editable: false,
    description:
      'Adjustment for the protective spillover effect of SMC on malaria mortality among people age 5 and older who live near SMC-treated children. Based on Ciss\u00E9 et al. 2016 evidence on community-level transmission reduction.',
    dependencies: [],
  },
  {
    id: 'adj_developmental',
    label: 'Adj: developmental & income benefits',
    section: 'other_benefits',
    nodeKind: 'adjustment',
    format: 'percentage',
    editable: false,
    description:
      'Adjustment for long-term economic benefits: averting malaria in children under 15 leads to improved cognitive development and higher adult incomes, estimated via the Bleakley 2010 study on malaria eradication.',
    dependencies: [],
  },

  // === ADDITIONAL ADJUSTMENTS ===
  {
    id: 'adj_program',
    label: 'Adj: program benefits & downsides',
    section: 'adjustments',
    nodeKind: 'adjustment',
    format: 'percentage',
    editable: false,
    description:
      'Net adjustment for supplemental intervention-level factors not captured in the main calculation, including malaria morbidity reductions, short-term anemia benefits, treatment costs averted, rebound immunity effects, and drug resistance concerns.',
    dependencies: [],
  },
  {
    id: 'adj_grantee',
    label: 'Adj: grantee-level factors',
    section: 'adjustments',
    nodeKind: 'adjustment',
    format: 'percentage',
    editable: false,
    description:
      'Net adjustment for grantee-level quality factors: monitoring and evaluation accuracy, risk of wastage (double treatment, expired goods), and confidence that funds are used for their intended purpose.',
    dependencies: [],
  },
  {
    id: 'adj_leverage_funging',
    label: 'Adj: leverage & funging',
    section: 'adjustments',
    nodeKind: 'adjustment',
    format: 'percentage',
    editable: false,
    description:
      'Net adjustment combining leverage (GiveWell funding unlocks additional resources) and funging (GiveWell funding displaces other donors who would have funded the same work). The large negative funging adjustment reflects that much of the program would likely be funded by others.',
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
      'Final cost-effectiveness estimate after all adjustments, expressed as a multiple of GiveDirectly cash transfers. Values above 10\u00D7 indicate exceptional cost-effectiveness by GiveWell\u2019s standards.',
    formula:
      'Initial CE \u00D7 (1 + over-5 adj + dev adj) \u00D7 (1 + program adj) \u00D7 (1 + grantee adj) \u00D7 (1 + leverage adj)',
    compute: (v) =>
      v.initial_ce *
      (1 + v.adj_over5 + v.adj_developmental) *
      (1 + v.adj_program) *
      (1 + v.adj_grantee) *
      (1 + v.adj_leverage_funging),
    dependencies: [
      'initial_ce',
      'adj_over5',
      'adj_developmental',
      'adj_program',
      'adj_grantee',
      'adj_leverage_funging',
    ],
    dependencyOps: {
      initial_ce: '\u00D7',
      adj_over5: '\u00D7 (1+)',
      adj_developmental: '+',
      adj_program: '\u00D7 (1+)',
      adj_grantee: '\u00D7 (1+)',
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
      'Estimated cost per death averted after all adjustments, including the over-5 mortality spillover benefit. Calculated from the grant divided by adjusted effective deaths averted (mortality benefits only, excluding income increases).',
    formula: 'Grant \u00F7 (Deaths averted \u00D7 over-5 adj \u00D7 program adj \u00D7 grantee adj \u00D7 leverage adj)',
    compute: (v) => {
      const adjDeaths =
        v.deaths_averted *
        (1 + v.adj_over5) *
        (1 + v.adj_program) *
        (1 + v.adj_grantee) *
        (1 + v.adj_leverage_funging);
      return v.grant_size / adjDeaths;
    },
    dependencies: [
      'grant_size',
      'deaths_averted',
      'adj_over5',
      'adj_program',
      'adj_grantee',
      'adj_leverage_funging',
    ],
    dependencyOps: {
      grant_size: '\u00F7',
      deaths_averted: '\u00F7',
      adj_over5: '\u00F7 (1+)',
      adj_program: '\u00F7 (1+)',
      adj_grantee: '\u00F7 (1+)',
      adj_leverage_funging: '\u00F7 (1+)',
    },
  },
];

// Two countries from the 2025 SMC Simple CEA
const smcRegions: CountryData[] = [
  {
    id: 'burkina_faso',
    name: 'Burkina Faso',
    values: {
      grant_size: 10_000_000,
      cost_per_child: 6.332846,
      counterfactual_share: 0.0,
      mortality_rate: 0.004748327,
      seasonal_share: 0.70,
      smc_effect: 0.7936950,
      moral_weight: 116.25262,
      benchmark: 0.00335,
      adj_over5: 0.06857112,
      adj_developmental: 0.31328741,
      adj_program: 0.191,
      adj_grantee: -0.08,
      adj_leverage_funging: -0.40038118,  // leverage (−0.40%) + funging (−39.64%) combined
    },
  },
  {
    id: 'chad',
    name: 'Chad',
    values: {
      grant_size: 10_000_000,
      cost_per_child: 7.014882,
      counterfactual_share: 0.0,
      mortality_rate: 0.004788735,
      seasonal_share: 0.70,
      smc_effect: 0.7936950,
      moral_weight: 116.25262,
      benchmark: 0.00335,
      adj_over5: 0.05499181,
      adj_developmental: 0.20796504,
      adj_program: 0.241,
      adj_grantee: -0.08,
      adj_leverage_funging: -0.23380867,  // leverage (−0.60%) + funging (−22.78%) combined
    },
  },
];

export const smcModel: CEAModel = {
  id: 'smc',
  title: 'GiveWell Malaria Consortium Cost-Effectiveness Analysis',
  subtitle: 'Seasonal Malaria Chemoprevention (SMC) \u00B7 Simple CEA \u00B7 2025',
  regionLabel: 'Country',
  logos: ['/logos/givewell.png', '/logos/malaria-consortium.png'],
  nodes: smcNodes,
  regions: smcRegions,
  layoutSections: [
    {
      id: 'grant',
      label: 'Grant',
      nodeIds: ['grant_size', 'cost_per_child'],
    },
    {
      id: 'coverage',
      label: 'Children Reached',
      nodeIds: ['children_reached', 'counterfactual_share', 'additional_children'],
    },
    {
      id: 'mortality',
      label: 'Mortality Benefits',
      nodeIds: ['mortality_rate', 'seasonal_share', 'smc_effect', 'deaths_averted'],
    },
    {
      id: 'initial_ce',
      label: 'Initial Cost-Effectiveness',
      nodeIds: ['moral_weight', 'benchmark', 'initial_ce'],
    },
    {
      id: 'other_benefits',
      label: 'Other Benefits',
      nodeIds: ['adj_over5', 'adj_developmental'],
    },
    {
      id: 'adjustments',
      label: 'Additional Adjustments',
      nodeIds: ['adj_program', 'adj_grantee', 'adj_leverage_funging'],
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
        { nodeId: 'cost_per_child', label: 'Cost per child under 5 reached' },
      ],
    },
    {
      title: 'Under-five mortality benefits',
      rows: [
        { nodeId: 'children_reached', label: 'Children under 5 reached' },
        { nodeId: 'counterfactual_share', label: 'Counterfactual SMC coverage' },
        { nodeId: 'additional_children', label: 'Additional children receiving SMC' },
        { nodeId: 'mortality_rate', label: 'Malaria mortality rate (under 5)' },
        { nodeId: 'seasonal_share', label: 'Proportion during SMC season' },
        { nodeId: 'smc_effect', label: 'SMC effect on malaria mortality' },
        { nodeId: 'deaths_averted', label: 'Under-5 deaths averted' },
      ],
    },
    {
      title: 'Initial cost-effectiveness',
      rows: [
        { nodeId: 'moral_weight', label: 'Moral weight: under-5 death (UoV)' },
        { nodeId: 'benchmark', label: 'Cash transfer benchmark (UoV/$)' },
        { nodeId: 'initial_ce', label: 'Initial cost-effectiveness (\u00D7 benchmark)' },
      ],
    },
    {
      title: 'Adjustments for other benefits',
      rows: [
        { nodeId: 'adj_over5', label: 'Adj: over-5 mortality spillover' },
        { nodeId: 'adj_developmental', label: 'Adj: developmental & income benefits' },
      ],
    },
    {
      title: 'Additional adjustments',
      rows: [
        { nodeId: 'adj_program', label: 'Adj: program benefits & downsides' },
        { nodeId: 'adj_grantee', label: 'Adj: grantee-level factors' },
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
  getNarrative: (v, country) =>
    `For every $${fmt(v.grant_size)} donated to Malaria Consortium in ${country}, roughly ${fmt(v.additional_children)} children receive seasonal malaria chemoprevention \u2014 averting an estimated ${v.deaths_averted?.toFixed(1)} under-5 deaths and delivering ${v.final_ce?.toFixed(1)}\u00D7 the impact of direct cash transfers ($${fmt(v.cost_per_life_saved)} per life saved).`,
};

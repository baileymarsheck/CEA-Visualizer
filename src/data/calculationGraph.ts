import type { CEANode } from '../types/cea';

export const ceaNodes: CEANode[] = [
  // === GRANT INPUTS ===
  {
    id: 'grant_size',
    label: 'Grant size',
    section: 'grant',
    nodeKind: 'input',
    format: 'currency',
    editable: true,
    description:
      'Total grant amount allocated for ITN distribution in this country. This is the amount contributed by the grantee (e.g., Against Malaria Foundation).',
    dependencies: [],
  },
  {
    id: 'cost_per_u5_reached',
    label: 'Cost per person under 5 reached',
    section: 'grant',
    nodeKind: 'input',
    format: 'currency',
    editable: false,
    description:
      'The upstream cost of reaching one child under age 5 with an ITN. Derived from net costs, distribution costs, the proportion of nets actually used, people per net, and the under-5 share of the population.',
    dependencies: [],
  },

  // === UNDER-5 MORTALITY BENEFITS ===
  {
    id: 'num_u5_reached',
    label: 'People under 5 reached',
    section: 'under5_mortality',
    nodeKind: 'derived',
    format: 'number',
    editable: false,
    description:
      'The number of children under age 5 who sleep under an ITN as a result of this grant.',
    formula: 'Grant size \u00F7 Cost per person under 5 reached',
    compute: (v) => v.grant_size / v.cost_per_u5_reached,
    dependencies: ['grant_size', 'cost_per_u5_reached'],
    dependencyOps: { grant_size: '\u00F7', cost_per_u5_reached: '\u00F7' },
  },
  {
    id: 'years_effective_coverage',
    label: 'Years of effective coverage',
    section: 'under5_mortality',
    nodeKind: 'input',
    format: 'number',
    editable: false,
    description:
      'The number of years each distributed net provides effective malaria protection, accounting for net decay, attrition, and physical damage over time. Calculated in the Effective Coverage sheet.',
    dependencies: [],
  },
  {
    id: 'mortality_rate_u5',
    label: 'Malaria mortality rate (under-5)',
    section: 'under5_mortality',
    nodeKind: 'input',
    format: 'percentage',
    editable: false,
    description:
      'The annual malaria-attributable mortality rate among children aged 1-59 months in the absence of ITN coverage. Accounts for direct and indirect malaria deaths, adjusted for seasonal malaria chemoprevention where applicable.',
    dependencies: [],
  },
  {
    id: 'effect_on_deaths',
    label: 'Effect of ITNs on malaria deaths',
    section: 'under5_mortality',
    nodeKind: 'input',
    format: 'percentage',
    editable: false,
    description:
      'The expected percentage reduction in malaria mortality among children under 5 who sleep under an ITN. Based on RCT evidence from Pryce et al. (2018), adjusted for internal/external validity and local insecticide resistance levels.',
    dependencies: [],
  },
  {
    id: 'deaths_averted_u5',
    label: 'Deaths averted (under-5)',
    section: 'under5_mortality',
    nodeKind: 'derived',
    format: 'number',
    editable: false,
    description:
      'The estimated number of deaths among children under 5 prevented by this grant. This is the core impact metric.',
    formula:
      'People reached \u00D7 Years of coverage \u00D7 Mortality rate \u00D7 Effect on deaths',
    compute: (v) =>
      v.num_u5_reached *
      v.years_effective_coverage *
      v.mortality_rate_u5 *
      v.effect_on_deaths,
    dependencies: [
      'num_u5_reached',
      'years_effective_coverage',
      'mortality_rate_u5',
      'effect_on_deaths',
    ],
    dependencyOps: {
      num_u5_reached: '\u00D7',
      years_effective_coverage: '\u00D7',
      mortality_rate_u5: '\u00D7',
      effect_on_deaths: '\u00D7',
    },
  },

  // === INITIAL COST-EFFECTIVENESS ===
  {
    id: 'cost_per_death_averted',
    label: 'Cost per under-5 death averted',
    section: 'initial_ce',
    nodeKind: 'derived',
    format: 'currency',
    editable: false,
    description:
      'How much grant money is spent per under-5 life saved, before adjustments for other benefits.',
    formula: 'Grant size \u00F7 Deaths averted',
    compute: (v) => v.grant_size / v.deaths_averted_u5,
    dependencies: ['grant_size', 'deaths_averted_u5'],
    dependencyOps: { grant_size: '\u00F7', deaths_averted_u5: '\u00F7' },
  },
  {
    id: 'moral_value_u5_death',
    label: 'Moral value of averting under-5 death',
    section: 'initial_ce',
    nodeKind: 'input',
    format: 'uov',
    editable: false,
    description:
      'Units of value (UoV) assigned to averting one death of a child under 5. Based on GiveWell\u2019s moral weights, which incorporate the number of DALYs lost and the value of a statistical life year.',
    dependencies: [],
  },
  {
    id: 'benchmark',
    label: 'Cash transfer benchmark',
    section: 'initial_ce',
    nodeKind: 'input',
    format: 'uov',
    editable: false,
    description:
      'GiveWell\u2019s estimate of the units of value generated per dollar spent on unconditional cash transfers (GiveDirectly). All cost-effectiveness estimates are expressed as multiples of this benchmark.',
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
      'Cost-effectiveness relative to GiveDirectly cash transfers, considering only under-5 mortality benefits. This is the starting point before adjustments.',
    formula:
      '(Deaths averted \u00D7 Moral value \u00F7 Grant) \u00F7 Benchmark',
    compute: (v) =>
      (v.deaths_averted_u5 * v.moral_value_u5_death) /
      v.grant_size /
      v.benchmark,
    dependencies: [
      'deaths_averted_u5',
      'moral_value_u5_death',
      'grant_size',
      'benchmark',
    ],
    dependencyOps: {
      deaths_averted_u5: '\u00D7',
      moral_value_u5_death: '\u00D7',
      grant_size: '\u00F7',
      benchmark: '\u00F7',
    },
  },

  // === OTHER BENEFITS ADJUSTMENTS ===
  {
    id: 'adj_5plus_mortality',
    label: 'Adj: mortality averted (age 5+)',
    section: 'other_benefits',
    nodeKind: 'adjustment',
    format: 'percentage',
    editable: true,
    description:
      'Upward adjustment to account for malaria deaths averted among people age 5 and older. ITNs protect all household members, not just children under 5.',
    dependencies: [],
  },
  {
    id: 'adj_developmental',
    label: 'Adj: developmental benefits',
    section: 'other_benefits',
    nodeKind: 'adjustment',
    format: 'percentage',
    editable: true,
    description:
      'Upward adjustment for long-term income increases from averting malaria cases in children under 15. Malaria in childhood reduces future earnings; preventing it has lasting economic benefits.',
    dependencies: [],
  },
  {
    id: 'u5_mortality_share',
    label: 'Under-5 mortality share of impact',
    section: 'other_benefits',
    nodeKind: 'derived',
    format: 'percentage',
    editable: false,
    description:
      'The proportion of total program value attributed to preventing deaths of children under 5.',
    formula: '1 \u2212 (5+ share + developmental share)',
    compute: (v) => {
      const over5Share =
        v.adj_5plus_mortality /
        ((1 + v.adj_5plus_mortality) * (1 + v.adj_developmental));
      const devShare = v.adj_developmental / (1 + v.adj_developmental);
      return 1 - over5Share - devShare;
    },
    dependencies: ['adj_5plus_mortality', 'adj_developmental'],
    dependencyOps: { adj_5plus_mortality: '\u2212', adj_developmental: '\u2212' },
  },

  // === ADDITIONAL ADJUSTMENTS ===
  {
    id: 'adj_program',
    label: 'Adj: program benefits & downsides',
    section: 'adjustments',
    nodeKind: 'adjustment',
    format: 'percentage',
    editable: true,
    description:
      'Net adjustment for supplemental program effects: malaria morbidity reduction, anemia prevention, other disease prevention, stillbirth prevention, income investment effects, treatment costs averted, rebound effects, subnational differences, and insecticide resistance.',
    dependencies: [],
  },
  {
    id: 'adj_grantee',
    label: 'Adj: grantee-level factors',
    section: 'adjustments',
    nodeKind: 'adjustment',
    format: 'percentage',
    editable: true,
    description:
      'Adjustment for risks specific to the grantee: double treatment, ineffective goods, wastage, monitoring quality, misappropriation, and organizational fungibility.',
    dependencies: [],
  },
  {
    id: 'adj_leverage',
    label: 'Adj: leverage',
    section: 'adjustments',
    nodeKind: 'adjustment',
    format: 'percentage',
    editable: true,
    description:
      'Adjustment for the possibility that donations crowd additional funding into the program (leverage effect).',
    dependencies: [],
  },
  {
    id: 'adj_funging',
    label: 'Adj: funging',
    section: 'adjustments',
    nodeKind: 'adjustment',
    format: 'percentage',
    editable: true,
    description:
      'Adjustment for the possibility that donations crowd existing funding out of the program (funging effect). A large negative value means much of the donation may displace funding that would have happened anyway.',
    dependencies: [],
  },

  // === SUPPLEMENTAL INPUTS FOR COST PER LIFE SAVED ===
  {
    id: 'deaths_u5',
    label: 'Malaria deaths (under-5)',
    section: 'final',
    nodeKind: 'input',
    format: 'number',
    editable: false,
    description:
      'Estimated malaria deaths among children under 5 in the country. Used alongside age 5+ deaths to compute the proportion of total malaria mortality that is under-5, which adjusts the cost per life saved metric.',
    dependencies: [],
  },
  {
    id: 'deaths_5plus',
    label: 'Malaria deaths (age 5+)',
    section: 'final',
    nodeKind: 'input',
    format: 'number',
    editable: false,
    description:
      'Estimated malaria deaths among people age 5 and older. Used together with under-5 deaths to calculate the share of all malaria deaths affecting children under 5.',
    dependencies: [],
  },
  {
    id: 'overall_outcome_adj',
    label: 'Overall outcome adjustment',
    section: 'final',
    nodeKind: 'adjustment',
    format: 'percentage',
    editable: true,
    description:
      'The combined proportional adjustment to all outcomes, accounting for program benefits and downsides, grantee-level factors, leverage, and funging.',
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
      'The final cost-effectiveness estimate, expressed as a multiple of GiveDirectly cash transfers. A value of 10x means this intervention generates 10 times as much value per dollar as cash transfers.',
    formula:
      'Initial CE \u00F7 Under-5 share \u00D7 (1 + program adj) \u00D7 (1 + grantee adj) \u00D7 (1 + leverage + funging)',
    compute: (v) =>
      (v.initial_ce / v.u5_mortality_share) *
      (1 + v.adj_program) *
      (1 + v.adj_grantee) *
      (1 + v.adj_leverage + v.adj_funging),
    dependencies: [
      'initial_ce',
      'u5_mortality_share',
      'adj_program',
      'adj_grantee',
      'adj_leverage',
      'adj_funging',
    ],
    dependencyOps: {
      initial_ce: '\u00D7',
      u5_mortality_share: '\u00F7',
      adj_program: '\u00D7 (1+)',
      adj_grantee: '\u00D7 (1+)',
      adj_leverage: '\u00D7 (1+)',
      adj_funging: '\u00D7 (1+)',
    },
  },
  {
    id: 'final_cost_per_life',
    label: 'Cost per life saved',
    section: 'final',
    nodeKind: 'output',
    format: 'currency',
    editable: false,
    description:
      'The estimated cost per life counterfactually saved, accounting for all adjustments including leverage, funging, and deaths averted across all age groups.',
    formula:
      'Cost per u5 death averted \u00D7 u5 share of deaths \u00F7 (1 + outcome adjustment)',
    compute: (v) =>
      v.cost_per_death_averted *
      (v.deaths_u5 / (v.deaths_u5 + v.deaths_5plus)) /
      (1 + v.overall_outcome_adj),
    dependencies: ['cost_per_death_averted', 'deaths_u5', 'deaths_5plus', 'overall_outcome_adj'],
    dependencyOps: {
      cost_per_death_averted: '\u00D7',
      deaths_u5: '\u00D7',
      deaths_5plus: '\u00F7',
      overall_outcome_adj: '\u00F7 (1+)',
    },
  },
];

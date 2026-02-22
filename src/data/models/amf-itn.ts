import type { CEAModel } from '../../types/cea';
import { ceaNodes } from '../calculationGraph';
import { countries } from '../countries';

function fmt(n: number) { return Math.round(n).toLocaleString(); }

export const amfItnModel: CEAModel = {
  id: 'amf-itn',
  title: 'GiveWell ITN Cost-Effectiveness Analysis',
  subtitle: 'Against Malaria Foundation \u00B7 Interactive Simple CEA',
  regionLabel: 'Country',
  logos: ['/logos/givewell.png', '/logos/amf.gif'],
  nodes: ceaNodes,
  regions: countries,
  layoutSections: [
    {
      id: 'grant',
      label: 'Grant',
      nodeIds: ['grant_size', 'cost_per_u5_reached'],
    },
    {
      id: 'under5_mortality',
      label: 'Under-5 Mortality Benefits',
      nodeIds: ['num_u5_reached', 'years_effective_coverage', 'mortality_rate_u5', 'effect_on_deaths', 'deaths_averted_u5'],
    },
    {
      id: 'initial_ce',
      label: 'Initial Cost-Effectiveness',
      nodeIds: ['cost_per_death_averted', 'moral_value_u5_death', 'benchmark', 'initial_ce'],
    },
    {
      id: 'other_benefits',
      label: 'Other Benefits Adjustments',
      nodeIds: ['adj_5plus_mortality', 'adj_developmental', 'u5_mortality_share'],
    },
    {
      id: 'adjustments',
      label: 'Additional Adjustments',
      nodeIds: ['adj_program', 'adj_grantee', 'adj_leverage', 'adj_funging'],
    },
    {
      id: 'final',
      label: 'Final Estimate',
      nodeIds: ['deaths_u5', 'deaths_5plus', 'overall_outcome_adj', 'final_ce', 'final_cost_per_life'],
    },
  ],
  getNarrative: (v, region) =>
    `For every $${fmt(v.grant_size)} donated to AMF in ${region}, roughly ${fmt(v.num_u5_reached)} children under 5 sleep under an ITN — averting an estimated ${fmt(v.deaths_averted_u5)} deaths and delivering ${v.final_ce?.toFixed(1)}× the impact of direct cash transfers ($${fmt(v.final_cost_per_life)} per life saved).`,

  spreadsheetSections: [
    {
      title: 'Grant',
      rows: [{ nodeId: 'grant_size', label: 'Grant size' }],
    },
    {
      title: 'Under-five mortality benefits',
      rows: [
        { nodeId: 'cost_per_u5_reached', label: 'Cost per person under age five reached' },
        { nodeId: 'num_u5_reached', label: 'Number of people under age five reached' },
        { nodeId: 'years_effective_coverage', label: 'Years of effective coverage provided by nets' },
        { nodeId: 'mortality_rate_u5', label: 'Malaria-attributable mortality rate (under-5)' },
        { nodeId: 'effect_on_deaths', label: 'Effect of ITN distributions on malaria deaths' },
        { nodeId: 'deaths_averted_u5', label: 'Deaths averted among people under age five' },
      ],
    },
    {
      title: 'Initial cost-effectiveness estimate',
      rows: [
        { nodeId: 'cost_per_death_averted', label: 'Cost per under-five death averted' },
        { nodeId: 'moral_value_u5_death', label: 'Moral value of averting under-5 death' },
        { nodeId: 'benchmark', label: 'Cash transfer benchmark (UoV/$)' },
        { nodeId: 'initial_ce', label: 'Initial cost-effectiveness (x benchmark)' },
      ],
    },
    {
      title: 'Adjustments for other benefits',
      rows: [
        { nodeId: 'adj_5plus_mortality', label: 'Adj: mortalities averted (age 5+)' },
        { nodeId: 'adj_developmental', label: 'Adj: developmental benefits (income)' },
        { nodeId: 'u5_mortality_share', label: 'Under-5 mortality share of total impact' },
      ],
    },
    {
      title: 'Additional adjustments',
      rows: [
        { nodeId: 'adj_program', label: 'Adj: program benefits & downsides' },
        { nodeId: 'adj_grantee', label: 'Adj: grantee-level factors' },
        { nodeId: 'adj_leverage', label: 'Adj: leverage' },
        { nodeId: 'adj_funging', label: 'Adj: funging' },
      ],
    },
    {
      title: 'Final cost-effectiveness estimate',
      rows: [
        { nodeId: 'deaths_u5', label: 'Malaria deaths (under-5)' },
        { nodeId: 'deaths_5plus', label: 'Malaria deaths (age 5+)' },
        { nodeId: 'overall_outcome_adj', label: 'Overall outcome adjustment' },
        { nodeId: 'final_ce', label: 'Final cost-effectiveness (x benchmark)' },
        { nodeId: 'final_cost_per_life', label: 'Cost per life saved' },
      ],
    },
  ],
};

# CEA Visualizer — Spreadsheet Conversion Prompt

Use this file with any AI chatbot (Claude, ChatGPT, etc.) to convert a cost-effectiveness analysis spreadsheet into a model file for CEA Visualizer.

---

## How to use

1. Start a new chat with Claude or ChatGPT
2. Attach **this file** (`PROMPT_TEMPLATE.md`) as a file attachment
3. Attach your **spreadsheet file** (Excel or CSV) as a file attachment
4. Send a message like: "Please follow the instructions in PROMPT_TEMPLATE.md to convert the attached spreadsheet."
5. The AI will return a TypeScript file
6. Save that file as `src/data/models/your-model-name.ts` in the CEA Visualizer repo
7. Add it to `src/data/models/index.ts` and `src/components/LandingPage.tsx`

---

---

You are helping convert a cost-effectiveness analysis (CEA) spreadsheet into a structured model file for CEA Visualizer (https://cea-visualizer.vercel.app).

The spreadsheet has been attached as a file. Use the data from that file to populate the model.

I will paste the contents of my spreadsheet below. Your job is to produce a TypeScript model file that matches the schema described here.

## OUTPUT FORMAT

Produce a complete TypeScript file with this structure:

```typescript
import type { CEAModel, CEANode, CountryData } from '../../types/cea';

const nodes: CEANode[] = [ /* ... */ ];
const regions: CountryData[] = [ /* ... */ ];

export const myModel: CEAModel = {
  id: 'my-model',
  title: 'Full title of the analysis',
  subtitle: 'Organization · Short description · Year',
  regionLabel: 'Country',  // or 'Region', 'State', etc.
  nodes,
  regions,
  layoutSections: [ /* ... */ ],
  spreadsheetSections: [ /* ... */ ],
  getNarrative: (v, region) => `One sentence summary of results for ${region}.`,
};
```

---

## NODE TYPES (nodeKind)

Classify each row of the spreadsheet as one of:
- **input** — a base assumption or empirical value (not derived from other rows)
- **derived** — calculated from other nodes via a formula
- **adjustment** — a percentage modifier applied to scale up or down (can be positive or negative)
- **output** — a final result (cost-effectiveness ratio, cost per outcome, etc.)

---

## VALUE FORMATS (format)

Choose the best format for each node's value:
- **currency** — dollar amounts ($6.33, $4,893)
- **percentage** — rates or proportions stored as decimals (0.70 = 70%, -0.08 = -8%)
- **number** — plain counts or unitless values (1,580,000 children)
- **multiplier** — a multiple of a benchmark (13.3× GiveDirectly)
- **uov** — "units of value" — moral weight values (116.25 UoV)

---

## NODE FIELDS

For each row in the spreadsheet, produce a node object:

```typescript
{
  id: 'snake_case_id',           // unique identifier, used in formulas
  label: 'Human-readable label', // short name shown in the diagram
  section: 'section_id',         // which column/group this node belongs to
  nodeKind: 'input',             // input | derived | adjustment | output
  format: 'currency',            // currency | percentage | number | multiplier | uov
  editable: false,               // true only for grant_size or top-level inputs the user might want to change
  description: 'One to two sentences explaining what this value represents and how it is estimated.',

  // For derived nodes only — omit for input/adjustment/output:
  formula: 'A × B ÷ C',               // human-readable formula string (use × ÷ − symbols)
  compute: (v) => v.a * v.b / v.c,    // JavaScript arrow function
  dependencies: ['a', 'b', 'c'],      // ids of all nodes this depends on
  dependencyOps: {                     // operator symbol for each dependency
    a: '×',
    b: '×',
    c: '÷',
  },
}
```

Common operator symbols for dependencyOps: `×`, `÷`, `+`, `−`, `× (1+)`, `× (1−)`

---

## SECTIONS

Group nodes into logical columns for the flow diagram. Each section becomes a vertical column. Aim for 2–5 nodes per section. Typical sections for a GiveWell-style CEA:

```typescript
layoutSections: [
  { id: 'grant',         label: 'Grant',                   nodeIds: ['grant_size', 'cost_per_person'] },
  { id: 'coverage',      label: 'People Reached',          nodeIds: ['people_reached', 'additional_reach'] },
  { id: 'benefits',      label: 'Benefits',                nodeIds: ['mortality_rate', 'effect_size', 'outcomes'] },
  { id: 'initial_ce',    label: 'Initial Cost-Effectiveness', nodeIds: ['moral_weight', 'benchmark', 'initial_ce'] },
  { id: 'adjustments',   label: 'Adjustments',             nodeIds: ['adj_factor_1', 'adj_factor_2'] },
  { id: 'final',         label: 'Final Estimate',          nodeIds: ['final_ce', 'cost_per_outcome'] },
],
```

The spreadsheetSections should mirror the same groupings but can use more descriptive titles and include all nodes, since the spreadsheet panel is read top-to-bottom:

```typescript
spreadsheetSections: [
  {
    title: 'Grant & costs',
    rows: [
      { nodeId: 'grant_size', label: 'Grant size' },
      { nodeId: 'cost_per_person', label: 'Cost per person reached' },
    ],
  },
  // ... one section per group
],
```

---

## REGIONS

For each country, region, or scenario in the spreadsheet, produce a CountryData object with the actual numeric values from the spreadsheet:

```typescript
{
  id: 'country_id',      // snake_case
  name: 'Country Name',  // displayed in the region selector
  values: {
    node_id_1: 0.0473,   // numeric value — percentages as decimals
    node_id_2: 6.33,
    // one entry per node id, even for derived nodes
    // (derived node values are only used as fallbacks if compute fails)
  }
}
```

Rules for values:
- All percentages stored as decimals: 70% → 0.70, -8% → -0.08
- All currency as raw numbers: $6.33 → 6.33, $4,893 → 4893
- Multipliers as raw numbers: 13.3× → 13.3

---

## ADJUSTMENT FORMULA PATTERN

GiveWell-style adjustments are typically applied as multiplicative factors. If the spreadsheet shows several adjustment rows that are combined, the pattern is usually:

```
final_ce = initial_ce × (1 + adj_benefits_1 + adj_benefits_2) × (1 + adj_other_1) × (1 + adj_negative_1)
```

Group additive adjustments (e.g. two types of benefit) inside one `(1 + a + b)` term. Separate conceptually distinct adjustment groups into their own `(1 + x)` terms.

---

## RULES

1. Node ids must be short, unique, and in snake_case
2. Every `derived` node must have `compute`, `dependencies`, `dependencyOps`, and `formula`
3. `input` and `adjustment` nodes have `dependencies: []` and no `compute`
4. The final cost-effectiveness output is typically a `multiplier` node
5. Write clear, accurate descriptions — these appear in tooltips when users hover nodes
6. Aim for 15–30 nodes total. If the spreadsheet has many more rows, focus on the main causal chain and consolidate minor sub-calculations into their parent node
7. If there is only one region/country, still wrap it in a `regions` array with one entry

---

---

*The spreadsheet file is attached. Use it as the source data for all node values, regions, and formulas.*

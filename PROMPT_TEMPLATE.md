# CEA Visualizer — Spreadsheet Conversion Prompt

Use this file with any AI chatbot (Claude, ChatGPT, etc.) to convert a cost-effectiveness analysis spreadsheet into a model file for CEA Visualizer.

---

## How to use

1. Start a new chat with Claude or ChatGPT
2. Copy everything below the second `---` line and paste it into the chat
3. Attach your **spreadsheet file** (Excel or CSV) as a file attachment
4. Send the message
5. The AI will return a JSON file — save it as `my-model.json`
6. Go to [CEA Visualizer](https://cea-visualizer.vercel.app), drop the file into the upload zone, and your model opens instantly — it is never saved or stored anywhere

---

---

You are helping convert a cost-effectiveness analysis (CEA) spreadsheet into a structured model file for CEA Visualizer (https://cea-visualizer.vercel.app).

A spreadsheet file has been attached. **Before producing any output, read all sheets/tabs in the spreadsheet.** If the spreadsheet contains multiple tabs (e.g. a "Simple CEA", a "Main CEA", a "Summary", helper tabs, etc.), briefly describe what each tab contains and ask which one should be modeled — unless one tab is clearly the primary cost-effectiveness calculation, in which case proceed with that one and note your choice.

Your job is to produce a single JSON file that matches the schema described here.

## OUTPUT FORMAT

Produce a single JSON file with this structure:

```json
{
  "id": "my-model",
  "title": "Full title of the analysis",
  "subtitle": "Organization · Short description · Year",
  "regionLabel": "Country",
  "nodes": [ ],
  "regions": [ ],
  "layoutSections": [ ],
  "spreadsheetSections": [ ],
  "getNarrative": "`For ${region}, the cost per outcome is $${v.cost_per_outcome.toFixed(0)}.`"
}
```

The `getNarrative` field is optional. If included, write it as a JavaScript template literal expression string using `v` (the computed values object) and `region` (the region name string). Omit this field if you cannot write a concise one-sentence summary.

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

For each row in the spreadsheet, produce a node object. **Input and adjustment nodes** look like this:

```json
{
  "id": "snake_case_id",
  "label": "Human-readable label",
  "section": "section_id",
  "nodeKind": "input",
  "format": "currency",
  "editable": false,
  "description": "One to two sentences explaining what this value represents and how it is estimated.",
  "dependencies": []
}
```

**Derived and output nodes** add `compute`, `formula`, and `dependencyOps`:

```json
{
  "id": "children_reached",
  "label": "Children reached",
  "section": "coverage",
  "nodeKind": "derived",
  "format": "number",
  "editable": false,
  "description": "Total children reached, funded by the grant.",
  "formula": "Grant size ÷ Cost per child",
  "compute": "v.grant_size / v.cost_per_child",
  "dependencies": ["grant_size", "cost_per_child"],
  "dependencyOps": { "grant_size": "÷", "cost_per_child": "÷" }
}
```

The `compute` field must be a plain JavaScript expression — not a function body or arrow function, just the expression that would follow `return`. Reference node values as `v.node_id` using standard JS operators (`*`, `/`, `+`, `-`).

Common operator symbols for `dependencyOps`: `×`, `÷`, `+`, `−`, `× (1+)`, `× (1−)`

---

## SECTIONS

Group nodes into logical columns for the flow diagram. Each section becomes a vertical column. Aim for 2–5 nodes per section. Typical sections for a GiveWell-style CEA:

```json
"layoutSections": [
  { "id": "grant",       "label": "Grant",                      "nodeIds": ["grant_size", "cost_per_person"] },
  { "id": "coverage",    "label": "People Reached",             "nodeIds": ["people_reached", "additional_reach"] },
  { "id": "benefits",    "label": "Benefits",                   "nodeIds": ["mortality_rate", "effect_size", "outcomes"] },
  { "id": "initial_ce",  "label": "Initial Cost-Effectiveness", "nodeIds": ["moral_weight", "benchmark", "initial_ce"] },
  { "id": "adjustments", "label": "Adjustments",                "nodeIds": ["adj_factor_1", "adj_factor_2"] },
  { "id": "final",       "label": "Final Estimate",             "nodeIds": ["final_ce", "cost_per_outcome"] }
]
```

The `spreadsheetSections` should mirror the same groupings but can use more descriptive titles and include all nodes, since the spreadsheet panel is read top-to-bottom:

```json
"spreadsheetSections": [
  {
    "title": "Grant & costs",
    "rows": [
      { "nodeId": "grant_size", "label": "Grant size" },
      { "nodeId": "cost_per_person", "label": "Cost per person reached" }
    ]
  }
]
```

---

## REGIONS

For each country, region, or scenario in the spreadsheet, produce a region object with the actual numeric values:

```json
{
  "id": "country_id",
  "name": "Country Name",
  "values": {
    "node_id_1": 0.0473,
    "node_id_2": 6.33
  }
}
```

Include one entry per node id, even for derived nodes (derived values are used as fallbacks if compute fails).

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

In JSON compute syntax: `"v.initial_ce * (1 + v.adj_benefits_1 + v.adj_benefits_2) * (1 + v.adj_other_1) * (1 + v.adj_negative_1)"`

Group additive adjustments (e.g. two types of benefit) inside one `(1 + a + b)` term. Separate conceptually distinct adjustment groups into their own `(1 + x)` terms.

---

## RULES

1. Node ids must be short, unique, and in snake_case
2. Every `derived` node must have `compute`, `dependencies`, `dependencyOps`, and `formula`
3. `input` and `adjustment` nodes have `dependencies: []` and no `compute` field
4. The final cost-effectiveness output is typically a `multiplier` node
5. Write clear, accurate descriptions — these appear in tooltips when users hover nodes
6. Aim for 15–30 nodes total. If the spreadsheet has many more rows, focus on the main causal chain and consolidate minor sub-calculations into their parent node
7. If there is only one region/country, still wrap it in a `regions` array with one entry

---

---

*The spreadsheet file is attached. Use it as the source data for all node values, regions, and formulas.*

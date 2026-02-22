# CEA Visualizer

An interactive tool for exploring GiveWell's cost-effectiveness analyses (CEAs). Renders each model as a navigable flow diagram where you can trace every assumption, understand how values are derived, and run live sensitivity analyses.

**Live site:** https://cea-visualizer.vercel.app

Built by [Bailey Marsheck](https://www.linkedin.com/in/baileymarsheck/) using [Claude Code](https://claude.ai/claude-code).

---

## What it does

GiveWell publishes detailed cost-effectiveness spreadsheets for their top charities. CEA Visualizer renders each model as a directed graph — nodes represent inputs, intermediate calculations, adjustments, and final outputs, connected by edges that show the flow of calculations.

**Features:**
- **Flow diagram** — pan and zoom through the full causal graph, with nodes color-coded by type (inputs, calculations, adjustments, outputs)
- **Spreadsheet panel** — mirrors the original CEA structure section by section, with live computed values
- **Sensitivity analysis** — click any node, then drag sliders or type values to see how changes ripple through the entire model in real time
- **Region switching** — compare the same model across countries or regions using GiveWell's published baseline values
- **Tooltips** — hover any node for its description, formula, and current value
- **Focus mode** — click a node to highlight it and its direct dependencies, dimming everything else

---

## Models included

| Model | Org | Regions | Nodes |
|---|---|---|---|
| ITN Distribution | Against Malaria Foundation | 8 countries | 21 |
| Conditional Cash Transfers for Vaccination | New Incentives | 7 Nigerian states | 23 |
| Malnutrition Treatment (SAM) | Taimaka | 1 region | 20 |
| Seasonal Malaria Chemoprevention | Malaria Consortium | 2 countries | 22 |

All models are based on GiveWell's publicly available 2024–2025 cost-effectiveness spreadsheets.

---

## Tech stack

- **React 19** + **TypeScript**
- **Vite** for bundling
- **@xyflow/react** (React Flow) for the interactive graph
- **Dagre** for automatic graph layout
- **Tailwind CSS** for styling
- Deployed on **Vercel**

---

## Running locally

```bash
npm install
npm run dev
```

---

## Data sourcing

All values are sourced directly from [GiveWell's published cost-effectiveness models](https://www.givewell.org/how-we-work/our-criteria/cost-effectiveness/cost-effectiveness-models). This project is not affiliated with GiveWell.

---

Built by [Bailey Marsheck](https://www.linkedin.com/in/baileymarsheck/) using [Claude Code](https://claude.ai/claude-code).

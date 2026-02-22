# CEA Visualizer

**Live site:** https://cea-visualizer.vercel.app

An interactive tool for exploring cost-effectiveness analyses (CEAs). Renders each model as a navigable flow diagram where you can trace every assumption, understand how values are derived, and run live sensitivity analyses.


Built by [Bailey Marsheck](https://www.linkedin.com/in/baileymarsheck/) using Claude Code and OpenAI Codex.

---

## What it does

CEA Visualizer renders each Cost-effectiveness analysis (CEA) as a directed graph — nodes represent inputs, intermediate calculations, adjustments, and final outputs, connected by edges that show the flow of calculations.

**Features:**
- **Flow diagram** — pan and zoom through the full causal graph, with nodes color-coded by type (inputs, calculations, adjustments, outputs)
- **Spreadsheet panel** — mirrors the original CEA structure section by section, with live computed values
- **Sensitivity analysis** — click any node, then drag sliders or type values to see how changes ripple through the entire model in real time
- **Tooltips** — hover any node for its description, formula, and current value
- **Focus mode** — click a node to highlight it and its direct dependencies, dimming everything else

---

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

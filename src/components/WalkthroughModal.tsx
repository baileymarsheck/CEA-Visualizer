import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface WalkthroughModalProps {
  onClose: () => void;
}

// ── Visual mockups ────────────────────────────────────────────────────────────

function NodeBadge({ color, label, kind }: { color: string; label: string; kind: string }) {
  return (
    <div className={`rounded-lg border-2 px-3 py-2 text-center w-36 ${color}`}>
      <div className="text-[9px] uppercase tracking-wider font-semibold opacity-60 mb-0.5">{kind}</div>
      <div className="text-xs font-semibold leading-tight">{label}</div>
    </div>
  );
}

function SlideNodeColors() {
  return (
    <div className="flex flex-wrap justify-center gap-3 py-2">
      <NodeBadge color="border-emerald-400 bg-emerald-50 text-emerald-800" label="Mortality rate (under-5)" kind="Input" />
      <NodeBadge color="border-blue-400 bg-blue-50 text-blue-800" label="Deaths averted (under-5)" kind="Calculation" />
      <NodeBadge color="border-amber-400 bg-amber-50 text-amber-800" label="Adj: leverage" kind="Adjustment" />
      <NodeBadge color="border-violet-400 bg-violet-50 text-violet-800" label="Final cost-effectiveness" kind="Output" />
    </div>
  );
}

function SlideFlowDiagram() {
  const nodes = [
    { id: 'grant', label: 'Grant size', color: 'border-emerald-400 bg-emerald-50 text-emerald-800', x: 0, y: 0 },
    { id: 'cost', label: 'Cost per U5 reached', color: 'border-emerald-400 bg-emerald-50 text-emerald-800', x: 0, y: 60 },
    { id: 'num', label: 'People reached', color: 'border-blue-400 bg-blue-50 text-blue-800', x: 180, y: 30 },
    { id: 'deaths', label: 'Deaths averted', color: 'border-blue-400 bg-blue-50 text-blue-800', x: 360, y: 30 },
    { id: 'final', label: 'Cost-effectiveness', color: 'border-violet-400 bg-violet-50 text-violet-800', x: 530, y: 30 },
  ];
  return (
    <div className="relative mx-auto" style={{ width: 660, height: 120 }}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 660 120">
        <defs>
          <marker id="wt-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
          </marker>
        </defs>
        {/* grant → num */}
        <line x1="112" y1="24" x2="178" y2="54" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#wt-arrow)" />
        {/* cost → num */}
        <line x1="112" y1="84" x2="178" y2="66" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#wt-arrow)" />
        {/* num → deaths */}
        <line x1="292" y1="60" x2="358" y2="60" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#wt-arrow)" />
        {/* deaths → final */}
        <line x1="472" y1="60" x2="528" y2="60" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#wt-arrow)" />
      </svg>
      {nodes.map((n) => (
        <div
          key={n.id}
          className={`absolute rounded-lg border-2 px-2 py-1.5 text-center ${n.color}`}
          style={{ left: n.x, top: n.y, width: 112 }}
        >
          <div className="text-[10px] font-semibold leading-tight">{n.label}</div>
        </div>
      ))}
    </div>
  );
}

function SlideFocusMode() {
  return (
    <div className="relative mx-auto flex items-center justify-center" style={{ height: 160 }}>
      {/* dimmed background nodes */}
      {[{ l: 20, t: 10 }, { l: 20, t: 90 }, { l: 500, t: 50 }].map((pos, i) => (
        <div
          key={i}
          className="absolute rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 opacity-20"
          style={{ left: pos.l, top: pos.t, width: 110 }}
        >
          <div className="text-[10px] text-gray-400 text-center">Node</div>
        </div>
      ))}

      {/* arc lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 640 160">
        <path d="M175,54 C240,54 240,80 300,80" stroke="#10b981" strokeWidth="2" strokeDasharray="5 3" fill="none" />
        <path d="M175,114 C240,114 240,80 300,80" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 3" fill="none" />
        <path d="M400,80 C450,80 450,80 500,80" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5 3" fill="none" />
      </svg>

      {/* upstream input */}
      <div className="absolute rounded-lg border-2 border-emerald-400 bg-emerald-50 px-3 py-2 text-center" style={{ left: 60, top: 20, width: 116 }}>
        <div className="text-[9px] uppercase text-emerald-600 font-semibold">Input</div>
        <div className="text-[10px] font-semibold text-emerald-800">Mortality rate</div>
      </div>
      <div className="absolute rounded-lg border-2 border-amber-400 bg-amber-50 px-3 py-2 text-center" style={{ left: 60, top: 95, width: 116 }}>
        <div className="text-[9px] uppercase text-amber-600 font-semibold">Input</div>
        <div className="text-[10px] font-semibold text-amber-800">Effect on deaths</div>
      </div>

      {/* selected node */}
      <div className="absolute rounded-xl border-2 border-blue-500 bg-blue-50 shadow-lg px-4 py-3 text-center ring-4 ring-blue-100" style={{ left: 240, top: 55, width: 160 }}>
        <div className="text-[9px] uppercase text-blue-500 font-semibold tracking-wider">Selected</div>
        <div className="text-sm font-bold text-blue-900">Deaths averted</div>
        <div className="text-xs text-blue-600 font-mono mt-0.5">170.4</div>
      </div>

      {/* downstream output */}
      <div className="absolute rounded-lg border-2 border-violet-400 bg-violet-50 px-3 py-2 text-center" style={{ left: 440, top: 60, width: 116 }}>
        <div className="text-[9px] uppercase text-violet-600 font-semibold">Output</div>
        <div className="text-[10px] font-semibold text-violet-800">Cost per life</div>
      </div>
    </div>
  );
}

function SlideTooltip() {
  return (
    <div className="flex justify-center items-start gap-6 py-2">
      {/* Node being hovered */}
      <div className="relative">
        <div className="rounded-lg border-2 border-blue-400 bg-blue-50 px-4 py-3 text-center w-44 shadow-sm">
          <div className="text-[9px] uppercase text-blue-500 font-semibold tracking-wider mb-0.5">Calculation</div>
          <div className="text-sm font-bold text-blue-900">Deaths averted</div>
          <div className="text-base font-mono font-bold text-blue-700">170.4</div>
        </div>
      </div>

      {/* Tooltip */}
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-56 text-left">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">calculation</span>
        </div>
        <div className="text-xs font-semibold text-gray-900 mb-0.5">Deaths averted (under-5)</div>
        <div className="text-sm font-bold text-gray-900 mb-1">170.4</div>
        <p className="text-[10px] text-gray-500 leading-relaxed mb-2">The number of child deaths prevented by this grant.</p>
        <div className="text-[9px] bg-gray-50 rounded px-2 py-1 font-mono text-gray-600 mb-2">
          Reached × Years × Rate × Effect
        </div>
        <div className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Inputs from</div>
        <div className="flex justify-between text-[10px]"><span className="text-gray-500">People reached</span><span className="font-mono">65,834</span></div>
        <div className="flex justify-between text-[10px]"><span className="text-gray-500">Years coverage</span><span className="font-mono">1.97</span></div>
      </div>
    </div>
  );
}

function SlideSensitivity() {
  return (
    <div className="mx-auto w-72 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
        <div className="text-[10px] uppercase tracking-wider font-semibold opacity-80">Sensitivity Analysis</div>
        <div className="text-sm font-medium mt-0.5">Deaths averted (under-5)</div>
        <div className="text-xl font-bold">170.4</div>
      </div>
      <div className="px-4 py-3 space-y-4">
        {[
          { label: 'Mortality rate (under-5)', val: '0.1508%', pct: 30 },
          { label: 'Effect of ITNs on deaths', val: '24.0%', pct: 48 },
          { label: 'Years of coverage', val: '1.97', pct: 40 },
        ].map((item) => (
          <div key={item.label}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-gray-600">{item.label}</span>
              <span className="text-[10px] font-mono font-semibold text-gray-800">{item.val}</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${item.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideChangeSummary() {
  return (
    <div className="mx-auto w-full max-w-lg bg-amber-50 border border-amber-200 rounded-lg p-3">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="text-amber-700 font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            2 inputs changed
          </span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-700 text-xs">
            Final CE: <span className="font-mono">10.4x</span> → <span className="font-mono font-semibold">8.1x</span>{' '}
            <span className="text-red-600 font-medium">(−22.1%)</span>
          </span>
        </div>
        <button className="text-xs text-red-400 border border-red-200 px-2 py-1 rounded">Reset</button>
      </div>
      <div className="pl-4 border-l-2 border-amber-200 space-y-1">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="text-gray-500">Effect of ITNs on malaria deaths:</span>
          <span className="font-mono">24.0%</span>
          <span className="text-gray-400">→</span>
          <span className="font-mono font-semibold text-gray-900">18.0%</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="text-gray-500">Grant size:</span>
          <span className="font-mono">$1,000,000</span>
          <span className="text-gray-400">→</span>
          <span className="font-mono font-semibold text-gray-900">$750,000</span>
        </div>
      </div>
    </div>
  );
}

// ── Slide definitions ─────────────────────────────────────────────────────────

const slides = [
  {
    title: 'What is this tool?',
    description:
      "GiveWell's cost-effectiveness analyses (CEAs) answer one question: for every dollar donated, how much good is done? Their models live in complex spreadsheets. This tool turns them into interactive diagrams — so you can see every assumption and trace exactly how a dollar becomes a life saved.",
    visual: (
      <div className="py-4">
        <SlideFlowDiagram />
        <p className="text-center text-[10px] text-gray-400 mt-3">Every arrow is a mathematical relationship. Every node is a number that can be explored.</p>
      </div>
    ),
  },
  {
    title: 'Four kinds of nodes',
    description:
      'Each node has a color that tells you what role it plays. Green inputs are base data and assumptions drawn from research. Blue calculations are derived mathematically from other nodes. Amber adjustments nudge the result up or down. Purple outputs are the final numbers GiveWell reports.',
    visual: <SlideNodeColors />,
  },
  {
    title: 'Hover to see details',
    description:
      'Hover over any node or spreadsheet row to open a tooltip with its description, current value, formula, and the values flowing into it. This is the quickest way to understand what any number means without having to read GiveWell\'s full documentation.',
    visual: <SlideTooltip />,
  },
  {
    title: 'Click a node to focus',
    description:
      "Click any node to enter focus mode. Its direct inputs appear above it, its direct outputs below — everything else dims. Colored arcs trace the connections. This makes it easy to understand exactly what a single node depends on and what depends on it.",
    visual: (
      <div className="py-2">
        <SlideFocusMode />
        <p className="text-center text-[10px] text-gray-400 mt-2">Click the background or "Clear selection" to exit focus mode.</p>
      </div>
    ),
  },
  {
    title: 'Test your assumptions',
    description:
      "With a node selected, click the blue 'Sensitivity Analysis' button. You'll get a slider for each upstream input. Drag a slider — or click the value to type an exact number — and every downstream number updates instantly. This shows you which assumptions the final result is most sensitive to.",
    visual: (
      <div className="py-2">
        <SlideSensitivity />
      </div>
    ),
  },
  {
    title: 'Track what you changed',
    description:
      "Whenever you edit an input, an amber banner appears at the top of the diagram. It shows exactly which values you changed and their before/after, and tells you the net effect on the final cost-effectiveness estimate. Hit 'Reset to defaults' to undo everything at once.",
    visual: (
      <div className="py-4">
        <SlideChangeSummary />
      </div>
    ),
  },
];

// ── Modal ─────────────────────────────────────────────────────────────────────

export function WalkthroughModal({ onClose }: WalkthroughModalProps) {
  const [slide, setSlide] = useState(0);
  const total = slides.length;
  const current = slides[slide];

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-900">How to use the CEA Visualizer</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Slide content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mb-4">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === slide ? 'bg-blue-600 w-6' : 'bg-gray-200 w-1.5 hover:bg-gray-300'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
            <span className="ml-2 text-[11px] text-gray-400">{slide + 1} / {total}</span>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">{current.title}</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-5">{current.description}</p>

          {/* Visual */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-4 overflow-x-auto">
            {current.visual}
          </div>
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={() => setSlide((s) => Math.max(0, s - 1))}
            disabled={slide === 0}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          {slide < total - 1 ? (
            <button
              onClick={() => setSlide((s) => s + 1)}
              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              Next
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors"
            >
              Start exploring
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

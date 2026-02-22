import { createPortal } from 'react-dom';
import { formatValue, formatSignedPercentage } from '../engine/formatters';
import type { CEANode } from '../types/cea';

interface NodeTooltipProps {
  node: CEANode;
  value: number;
  values: Record<string, number>;
  ceaNodes: CEANode[];
  rect: { x: number; y: number; width: number; height: number };
}

const kindColors: Record<string, string> = {
  input: 'bg-emerald-100 text-emerald-800',
  derived: 'bg-blue-100 text-blue-800',
  adjustment: 'bg-amber-100 text-amber-800',
  output: 'bg-violet-100 text-violet-800',
};

export function NodeTooltip({ node, value, values, ceaNodes, rect }: NodeTooltipProps) {
  const upstream = ceaNodes.filter((n) => node.dependencies.includes(n.id));
  const downstream = ceaNodes.filter((n) => n.dependencies.includes(node.id));

  // Position tooltip above the element, centered horizontally
  const tooltipWidth = 320;
  const gap = 8;

  // Calculate left position, clamped to viewport
  let left = rect.x + rect.width / 2 - tooltipWidth / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8));

  // Place above by default; if too close to top, place below
  const placeBelow = rect.y < 200;
  const top = placeBelow ? rect.y + rect.height + gap : undefined;
  const bottom = placeBelow ? undefined : window.innerHeight - rect.y + gap;

  return createPortal(
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{
        left,
        top,
        bottom,
        width: tooltipWidth,
      }}
    >
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-3 text-left">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded ${kindColors[node.nodeKind]}`}
          >
            {node.nodeKind}
          </span>
        </div>

        <div className="text-sm font-semibold text-gray-900 mb-1">{node.label}</div>

        <div className="text-lg font-bold text-gray-900 mb-1.5">
          {node.nodeKind === 'adjustment'
            ? formatSignedPercentage(value)
            : formatValue(value, node.format)}
        </div>

        <p className="text-xs text-gray-500 leading-relaxed mb-2">{node.description}</p>

        {node.formula && (
          <div className="text-[10px] text-gray-500 bg-gray-50 rounded px-2 py-1 font-mono mb-2">
            {node.formula}
          </div>
        )}

        {upstream.length > 0 && (
          <div className="mb-1.5">
            <div className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
              Inputs from
            </div>
            {upstream.map((n) => (
              <div key={n.id} className="flex justify-between text-[11px] py-0.5">
                <span className="text-gray-500">{n.label}</span>
                <span className="text-gray-800 font-medium ml-2 whitespace-nowrap">
                  {n.nodeKind === 'adjustment'
                    ? formatSignedPercentage(values[n.id])
                    : formatValue(values[n.id], n.format)}
                </span>
              </div>
            ))}
          </div>
        )}

        {downstream.length > 0 && (
          <div>
            <div className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
              Feeds into
            </div>
            {downstream.map((n) => (
              <div key={n.id} className="text-[11px] text-gray-500 py-0.5">
                {n.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

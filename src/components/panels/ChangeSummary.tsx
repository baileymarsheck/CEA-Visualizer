import { useState } from 'react';
import type { CEANode } from '../../types/cea';
import { formatValue, formatSignedPercentage } from '../../engine/formatters';

interface ChangeSummaryProps {
  overrides: Record<string, number>;
  baseValues: Record<string, number>;
  baseComputedValues: Record<string, number>;
  computedValues: Record<string, number>;
  ceaNodes: CEANode[];
  onReset: () => void;
}

export function ChangeSummary({
  overrides,
  baseValues,
  baseComputedValues,
  computedValues,
  ceaNodes,
  onReset,
}: ChangeSummaryProps) {
  const [expanded, setExpanded] = useState(true);

  const overrideEntries = Object.entries(overrides);
  if (overrideEntries.length === 0) return null;

  const nodeMap = new Map(ceaNodes.map((n) => [n.id, n]));

  const baseFinalCE = baseComputedValues['final_ce'] ?? 0;
  const currentFinalCE = computedValues['final_ce'] ?? 0;
  const pctChange = baseFinalCE !== 0 ? ((currentFinalCE - baseFinalCE) / baseFinalCE) * 100 : 0;
  const pctSign = pctChange >= 0 ? '+' : '';

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm">
      {/* Summary line */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-amber-700 hover:text-amber-900 font-medium flex items-center gap-1"
          >
            <svg
              className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            {overrideEntries.length} input{overrideEntries.length > 1 ? 's' : ''} changed
          </button>
          <span className="text-gray-400">·</span>
          <span className="text-gray-700">
            Final CE:{' '}
            <span className="font-mono">{formatValue(baseFinalCE, 'multiplier')}</span>
            {' → '}
            <span className="font-mono font-semibold">{formatValue(currentFinalCE, 'multiplier')}</span>
            {' '}
            <span className={pctChange >= 0 ? 'text-emerald-700 font-medium' : 'text-red-600 font-medium'}>
              ({pctSign}{pctChange.toFixed(1)}%)
            </span>
          </span>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded border border-red-200 hover:bg-red-50 whitespace-nowrap flex-shrink-0"
        >
          Reset to defaults
        </button>
      </div>

      {/* Expanded per-input details */}
      {expanded && (
        <div className="mt-2 flex flex-col gap-1 pl-4 border-l-2 border-amber-200">
          {overrideEntries.map(([nodeId, toValue]) => {
            const node = nodeMap.get(nodeId);
            if (!node) return null;
            const fromValue = baseValues[nodeId] ?? baseComputedValues[nodeId];
            const formatFn = node.nodeKind === 'adjustment'
              ? (v: number) => formatSignedPercentage(v)
              : (v: number) => formatValue(v, node.format);
            return (
              <div key={nodeId} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="text-gray-500">{node.label}:</span>
                <span className="font-mono">{formatFn(fromValue)}</span>
                <span className="text-gray-400">→</span>
                <span className="font-mono font-semibold text-gray-900">{formatFn(toValue)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState, useRef } from 'react';
import { formatValue, formatSignedPercentage } from '../../engine/formatters';
import type { CEANode } from '../../types/cea';

interface SensitivityPanelProps {
  ceaNodes: CEANode[];
  selectedNodeId: string;
  computedValues: Record<string, number>;
  countryValues: Record<string, number>;
  overrides: Record<string, number>;
  onInputChange: (nodeId: string, value: number) => void;
  onClose: () => void;
}

/** Get the range for a slider based on the base value */
function getSliderRange(baseValue: number, format: string, nodeKind: string) {
  if (nodeKind === 'adjustment' || format === 'percentage') {
    // Percentages: allow -100% to +200% (stored as decimals)
    return { min: -1, max: 2, step: 0.001, displayMul: 100 };
  }
  if (format === 'currency') {
    const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(baseValue || 1))));
    return { min: 0, max: baseValue * 5, step: magnitude / 100, displayMul: 1 };
  }
  if (format === 'multiplier' || format === 'uov') {
    return { min: 0, max: baseValue * 5, step: 0.01, displayMul: 1 };
  }
  // number
  return { min: 0, max: Math.max(baseValue * 5, 1), step: baseValue > 10 ? 0.1 : 0.001, displayMul: 1 };
}

export function SensitivityPanel({
  ceaNodes,
  selectedNodeId,
  computedValues,
  countryValues,
  overrides,
  onInputChange,
  onClose,
}: SensitivityPanelProps) {
  const nodeMap = new Map<string, CEANode>(ceaNodes.map((n) => [n.id, n]));
  const selectedNode = nodeMap.get(selectedNodeId);
  if (!selectedNode) return null;

  // Split dependencies into adjustable (input/adjustment) and calculated (derived)
  const allDeps = selectedNode.dependencies
    .map((id) => nodeMap.get(id))
    .filter((n): n is CEANode => n !== undefined);
  const adjustableDeps = allDeps.filter((n) => n.nodeKind === 'input' || n.nodeKind === 'adjustment');
  const calculatedDeps = allDeps.filter((n) => n.nodeKind === 'derived' || n.nodeKind === 'output');

  const selectedValue = computedValues[selectedNodeId] ?? 0;

  return (
    <div className="absolute top-3 right-3 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-wider font-semibold opacity-80">
            Sensitivity Analysis
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-lg leading-none"
          >
            &times;
          </button>
        </div>
        <div className="text-sm font-medium mt-1">{selectedNode.label}</div>
        <div className="text-xl font-bold mt-0.5">
          {selectedNode.nodeKind === 'adjustment'
            ? formatSignedPercentage(selectedValue)
            : formatValue(selectedValue, selectedNode.format)}
        </div>
      </div>

      {/* Input sliders */}
      <div className="px-4 py-3 max-h-[50vh] overflow-y-auto">
        {allDeps.length === 0 ? (
          <div className="text-xs text-gray-400 italic">
            This node has no upstream dependencies to adjust.
          </div>
        ) : (
          <div className="space-y-4">
            {adjustableDeps.map((dep) => (
              <SensitivitySlider
                key={dep.id}
                node={dep}
                currentValue={computedValues[dep.id] ?? 0}
                baseValue={countryValues[dep.id] ?? computedValues[dep.id] ?? 0}
                isOverridden={dep.id in overrides}
                onValueChange={(val) => onInputChange(dep.id, val)}
              />
            ))}
            {calculatedDeps.length > 0 && (
              <div className="space-y-2">
                {adjustableDeps.length > 0 && (
                  <div className="border-t border-gray-100 pt-3">
                    <div className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
                      Calculated inputs
                    </div>
                  </div>
                )}
                {calculatedDeps.map((dep) => {
                  const val = computedValues[dep.id] ?? 0;
                  const isPercentLike = dep.nodeKind === 'adjustment' || dep.format === 'percentage';
                  const displayVal = isPercentLike
                    ? formatSignedPercentage(val)
                    : formatValue(val, dep.format);
                  return (
                    <div key={dep.id} className="flex items-center justify-between opacity-60">
                      <div className="text-[11px] text-gray-500 leading-tight flex-1 pr-2">
                        {dep.label}
                      </div>
                      <div className="text-xs font-mono text-gray-500 flex-shrink-0">
                        {displayVal}
                      </div>
                    </div>
                  );
                })}
                <div className="text-[9px] text-gray-400 italic pt-1">
                  Calculated values update automatically — adjust their upstream inputs to change them.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <div className="text-[10px] text-gray-400">
          Drag sliders or type values to see how changes propagate through the model.
        </div>
      </div>
    </div>
  );
}

interface SensitivitySliderProps {
  node: CEANode;
  currentValue: number;
  baseValue: number;
  isOverridden: boolean;
  onValueChange: (value: number) => void;
}

function SensitivitySlider({
  node,
  currentValue,
  baseValue,
  isOverridden,
  onValueChange,
}: SensitivitySliderProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [dragValue, setDragValue] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const range = getSliderRange(baseValue, node.format, node.nodeKind);

  const isPercentLike = node.nodeKind === 'adjustment' || node.format === 'percentage';

  // Use local drag value while dragging for immediate response, prop otherwise
  const sliderValue = dragValue ?? currentValue;
  const pct = Math.min(100, Math.max(0, ((sliderValue - range.min) / (range.max - range.min)) * 100));

  const displayValue = isPercentLike
    ? formatSignedPercentage(currentValue)
    : formatValue(currentValue, node.format);

  const startEdit = () => {
    setEditing(true);
    if (isPercentLike) {
      setEditText(String(parseFloat((currentValue * 100).toFixed(4))));
    } else {
      setEditText(String(parseFloat(currentValue.toFixed(6))));
    }
    setTimeout(() => {
      inputRef.current?.select();
    }, 0);
  };

  const commitEdit = () => {
    const parsed = parseFloat(editText.replace(/[,$%x]/g, ''));
    if (!isNaN(parsed)) {
      const val = isPercentLike ? parsed / 100 : parsed;
      onValueChange(val);
    }
    setEditing(false);
  };

  // Color based on node type
  const accentColor =
    node.nodeKind === 'input'
      ? 'accent-emerald-600'
      : node.nodeKind === 'adjustment'
        ? 'accent-amber-600'
        : node.nodeKind === 'output'
          ? 'accent-violet-600'
          : 'accent-blue-600';
  const trackColor =
    node.nodeKind === 'input'
      ? '#059669'
      : node.nodeKind === 'adjustment'
        ? '#d97706'
        : node.nodeKind === 'output'
          ? '#7c3aed'
          : '#2563eb';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="text-[11px] text-gray-600 leading-tight flex-1 pr-2">
          {node.label}
          {isOverridden && (
            <span className="ml-1 text-[9px] text-blue-500">(edited)</span>
          )}
        </div>
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') setEditing(false);
            }}
            onBlur={commitEdit}
            className="w-20 text-xs font-mono text-right border border-blue-400 rounded px-1 py-0.5 outline-none bg-blue-50"
            autoFocus
          />
        ) : (
          <button
            onClick={startEdit}
            className="text-xs font-mono font-semibold text-gray-800 hover:text-blue-600 cursor-text"
          >
            {displayValue}
          </button>
        )}
      </div>
      <input
        type="range"
        min={range.min}
        max={range.max}
        step={range.step}
        value={sliderValue}
        onPointerDown={() => setDragValue(currentValue)}
        onChange={(e) => {
          const val = parseFloat(e.target.value);
          setDragValue(val);
          onValueChange(val);
        }}
        onPointerUp={() => setDragValue(null)}
        className={`w-full h-1.5 rounded-full appearance-none cursor-pointer ${accentColor}`}
        style={{ background: `linear-gradient(to right, ${trackColor} ${pct}%, #e5e7eb ${pct}%)` }}
      />
    </div>
  );
}

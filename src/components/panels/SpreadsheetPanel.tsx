import { useEffect, useRef, useState } from 'react';
import { formatValue, formatSignedPercentage } from '../../engine/formatters';
import type { CEANode, SpreadsheetSection } from '../../types/cea';

interface SpreadsheetPanelProps {
  ceaNodes: CEANode[];
  sections: SpreadsheetSection[];
  values: Record<string, number>;
  activeNodeId: string | null;
  selectedNodeId: string | null;
  highlightedIds: Set<string>;
  onRowClick: (nodeId: string) => void;
  onRowHover: (nodeId: string | null, rect?: { x: number; y: number; width: number; height: number }) => void;
  onInputChange: (nodeId: string, value: number) => void;
  overrides: Record<string, number>;
  countryName: string;
  spreadsheetTitle: string;
  width?: number;
}

export function SpreadsheetPanel({
  ceaNodes,
  sections,
  values,
  activeNodeId,
  selectedNodeId,
  highlightedIds,
  onRowClick,
  onRowHover,
  onInputChange,
  overrides,
  countryName,
  spreadsheetTitle,
  width,
}: SpreadsheetPanelProps) {
  const nodeMap = new Map<string, CEANode>(ceaNodes.map((n) => [n.id, n]));
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll only when a node is clicked (selected), not on hover
  useEffect(() => {
    if (!selectedNodeId) return;
    const rowEl = rowRefs.current[selectedNodeId];
    if (rowEl) {
      rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedNodeId]);

  return (
    <div className="h-full flex flex-col bg-white flex-shrink-0" style={{ width: width ?? 420 }}>
      {/* Header */}
      <div className="bg-gray-800 text-white px-4 py-3 flex-shrink-0">
        <div className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">
          {spreadsheetTitle}
        </div>
        <div className="text-sm font-medium mt-0.5">{countryName}</div>
      </div>

      {/* Column headers */}
      <div className="flex items-center px-4 py-1.5 bg-gray-50 border-b border-gray-200 text-[10px] uppercase tracking-wider text-gray-400 font-semibold flex-shrink-0">
        <div className="flex-1">Parameter</div>
        <div className="w-8 text-center">Type</div>
        <div className="w-28 text-right">Value</div>
        <div className="w-14 text-center ml-1"></div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
        {sections.map((section) => (
          <div key={section.title}>
            {/* Section header */}
            <div className="bg-gray-50 px-4 py-2 border-y border-gray-200">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {section.title}
              </span>
            </div>

            {/* Rows */}
            {section.rows.map((row) => {
              const ceaNode = nodeMap.get(row.nodeId);
              const value = values[row.nodeId];
              if (!ceaNode || value === undefined) return null;

              const isActive = row.nodeId === activeNodeId;
              const isInPath = highlightedIds.has(row.nodeId);
              const isDimmed = !!selectedNodeId && !isInPath;

              // Format value
              let formatted: string;
              if (ceaNode.nodeKind === 'adjustment') {
                formatted = formatSignedPercentage(value);
              } else {
                formatted = formatValue(value, ceaNode.format);
              }

              // Type badge
              const typeBadge = ceaNode.nodeKind === 'input'
                ? { label: 'inp', bg: 'bg-emerald-100 text-emerald-700' }
                : ceaNode.nodeKind === 'adjustment'
                  ? { label: 'adj', bg: 'bg-amber-100 text-amber-700' }
                  : ceaNode.nodeKind === 'output'
                    ? { label: 'out', bg: 'bg-violet-100 text-violet-700' }
                    : { label: 'calc', bg: 'bg-blue-100 text-blue-700' };

              // Value color
              const valueColor = ceaNode.nodeKind === 'input'
                ? 'text-emerald-700'
                : ceaNode.nodeKind === 'adjustment'
                  ? value >= 0 ? 'text-green-700' : 'text-red-700'
                  : ceaNode.nodeKind === 'output'
                    ? 'text-violet-900 font-bold'
                    : 'text-blue-700';

              const isEditing = editingNodeId === row.nodeId;
              const isOverridden = row.nodeId in overrides;
              const isEditable = ceaNode.nodeKind === 'input' || ceaNode.nodeKind === 'adjustment';

              // Left border accent + hover color per node kind
              const kindBorderColor = ceaNode.nodeKind === 'input'
                ? 'border-l-emerald-300'
                : ceaNode.nodeKind === 'adjustment'
                  ? 'border-l-amber-300'
                  : ceaNode.nodeKind === 'output'
                    ? 'border-l-violet-400'
                    : 'border-l-blue-200';
              const kindActiveBg = ceaNode.nodeKind === 'input'
                ? 'bg-emerald-50'
                : ceaNode.nodeKind === 'adjustment'
                  ? 'bg-amber-50'
                  : ceaNode.nodeKind === 'output'
                    ? 'bg-violet-50'
                    : 'bg-blue-50';
              const kindActiveBorder = ceaNode.nodeKind === 'input'
                ? 'border-l-emerald-500'
                : ceaNode.nodeKind === 'adjustment'
                  ? 'border-l-amber-500'
                  : ceaNode.nodeKind === 'output'
                    ? 'border-l-violet-500'
                    : 'border-l-blue-500';

              const startEditing = (e: React.MouseEvent) => {
                e.stopPropagation();
                setEditingNodeId(row.nodeId);
                // Show user-friendly value (e.g. 29.7 for 0.297 percentage)
                if (ceaNode.nodeKind === 'adjustment' || ceaNode.format === 'percentage') {
                  setEditValue(String(parseFloat((value * 100).toFixed(4))));
                } else {
                  setEditValue(String(parseFloat(value.toFixed(6))));
                }
                setTimeout(() => editInputRef.current?.select(), 0);
              };

              const commitEdit = () => {
                const parsed = parseFloat(editValue.replace(/[,$%x]/g, ''));
                if (!isNaN(parsed)) {
                  // For percentage/adjustment nodes, store as decimal (e.g. 29.7% → 0.297)
                  const finalValue = ceaNode.nodeKind === 'adjustment' || ceaNode.format === 'percentage'
                    ? parsed / 100
                    : parsed;
                  onInputChange(row.nodeId, finalValue);
                }
                setEditingNodeId(null);
              };

              const cancelEdit = () => {
                setEditingNodeId(null);
              };

              return (
                <div
                  key={row.nodeId}
                  ref={(el) => { rowRefs.current[row.nodeId] = el; }}
                  className={`flex items-center px-4 py-2 cursor-pointer transition-all border-l-4
                    ${isActive
                      ? `${kindActiveBg} ${kindActiveBorder}`
                      : isInPath
                        ? 'bg-blue-50/50 border-l-blue-300'
                        : isDimmed
                          ? 'border-l-transparent opacity-15'
                          : kindBorderColor
                    }
                  `}
                  onClick={() => onRowClick(row.nodeId)}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    onRowHover(row.nodeId, { x: rect.x, y: rect.y, width: rect.width, height: rect.height });
                  }}
                  onMouseLeave={() => onRowHover(null)}
                >
                  <div className="flex-1 text-[11px] text-gray-600 leading-tight pr-2">
                    {row.label}
                  </div>
                  <div className="w-8 flex justify-center">
                    <span className={`text-[8px] font-bold uppercase px-1 py-0.5 rounded ${typeBadge.bg}`}>
                      {typeBadge.label}
                    </span>
                  </div>
                  {isEditing ? (
                    <div className="w-28 flex items-center gap-1">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        onBlur={commitEdit}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-sm font-mono text-right border border-blue-400 rounded px-1 py-0.5 outline-none bg-blue-50"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className={`w-28 text-right text-sm font-mono ${valueColor} ${isOverridden ? 'underline decoration-dotted' : ''}`}>
                      {formatted}
                    </div>
                  )}
                  <div className="w-14 flex justify-center ml-1">
                    {isEditable && !isEditing && (
                      <button
                        onClick={startEditing}
                        className="text-[10px] text-blue-500 hover:text-blue-700 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

import { Handle, Position } from '@xyflow/react';
import { formatValue } from '../../engine/formatters';
import { OperationBadge } from './OperationBadge';
import type { ValueFormat } from '../../types/cea';

interface CalculationNodeData {
  label: string;
  value: number;
  format: ValueFormat;
  formula?: string;
  highlighted: boolean;
  dimmed: boolean;
  glowing?: boolean;
  operation: string | null;
  onClick?: () => void;
}

export function CalculationNode({ data }: { data: CalculationNodeData }) {
  return (
    <div
      onClick={data.onClick}
      className={`relative px-4 py-3 rounded-lg border-2 bg-white shadow-sm cursor-pointer transition-all min-w-[180px] max-w-[200px]
        ${data.glowing ? 'border-blue-600 !opacity-100' : data.highlighted ? 'border-blue-500 shadow-md' : data.dimmed ? 'border-blue-200 opacity-15' : 'border-blue-300'}
      `}
      style={data.glowing ? { boxShadow: '0 0 16px 4px rgba(59, 130, 246, 0.5)', borderWidth: 3 } : undefined}
    >
      <OperationBadge operation={data.operation} />
      <Handle type="target" position={Position.Top} className="!bg-transparent !w-0 !h-0 !border-0 !min-w-0 !min-h-0" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-transparent !w-0 !h-0 !border-0 !min-w-0 !min-h-0" />
      <div className="text-[10px] uppercase tracking-wider text-blue-600 font-semibold mb-1">
        Calculation
      </div>
      <div className="text-[11px] text-gray-600 leading-tight mb-1">{data.label}</div>
      <div className="text-base font-bold text-blue-800">
        {formatValue(data.value, data.format)}
      </div>
      {data.formula && (
        <div className="text-[9px] text-gray-400 italic mt-1 leading-tight">{data.formula}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !w-0 !h-0 !border-0 !min-w-0 !min-h-0" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-transparent !w-0 !h-0 !border-0 !min-w-0 !min-h-0" />
    </div>
  );
}

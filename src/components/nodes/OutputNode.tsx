import { Handle, Position } from '@xyflow/react';
import { formatValue } from '../../engine/formatters';
import { OperationBadge } from './OperationBadge';
import type { ValueFormat } from '../../types/cea';

interface OutputNodeData {
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

export function OutputNode({ data }: { data: OutputNodeData }) {
  return (
    <div
      onClick={data.onClick}
      className={`relative px-5 py-4 rounded-xl border-2 bg-gradient-to-br from-violet-50 to-purple-50 shadow-md cursor-pointer transition-all min-w-[220px] max-w-[240px]
        ${data.glowing ? 'border-violet-700 !opacity-100' : data.highlighted ? 'border-violet-600 shadow-lg' : data.dimmed ? 'border-violet-300 opacity-15' : 'border-violet-400'}
      `}
      style={data.glowing ? { boxShadow: '0 0 16px 4px rgba(124, 58, 237, 0.4)', borderWidth: 3 } : undefined}
    >
      <OperationBadge operation={data.operation} />
      <Handle type="target" position={Position.Top} className="!bg-transparent !w-0 !h-0 !border-0 !min-w-0 !min-h-0" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-transparent !w-0 !h-0 !border-0 !min-w-0 !min-h-0" />
      <div className="text-[10px] uppercase tracking-wider text-violet-700 font-semibold mb-1">
        Result
      </div>
      <div className="text-sm text-gray-700 leading-tight mb-1">{data.label}</div>
      <div className="text-2xl font-bold text-violet-900">
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

import { Handle, Position } from '@xyflow/react';
import { formatSignedPercentage } from '../../engine/formatters';
import { OperationBadge } from './OperationBadge';

interface AdjustmentNodeData {
  label: string;
  value: number;
  highlighted: boolean;
  dimmed: boolean;
  glowing?: boolean;
  operation: string | null;
  onClick?: () => void;
}

export function AdjustmentNode({ data }: { data: AdjustmentNodeData }) {
  const isPositive = data.value >= 0;

  return (
    <div
      onClick={data.onClick}
      className={`relative px-3 py-2.5 rounded-lg border-2 bg-white shadow-sm cursor-pointer transition-all min-w-[160px] max-w-[180px]
        ${data.glowing ? 'border-amber-600 !opacity-100' : data.highlighted ? 'border-amber-500 shadow-md' : data.dimmed ? 'border-amber-200 opacity-15' : 'border-amber-300'}
      `}
      style={data.glowing ? { boxShadow: '0 0 16px 4px rgba(245, 158, 11, 0.5)', borderWidth: 3 } : undefined}
    >
      <OperationBadge operation={data.operation} />
      <Handle type="target" position={Position.Top} className="!bg-transparent !w-0 !h-0 !border-0 !min-w-0 !min-h-0" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-transparent !w-0 !h-0 !border-0 !min-w-0 !min-h-0" />
      <div className="text-[10px] uppercase tracking-wider text-amber-600 font-semibold mb-0.5">
        Adjustment
      </div>
      <div className="text-[11px] text-gray-600 leading-tight mb-1">{data.label}</div>
      <div
        className={`text-base font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}
      >
        {formatSignedPercentage(data.value)}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !w-0 !h-0 !border-0 !min-w-0 !min-h-0" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-transparent !w-0 !h-0 !border-0 !min-w-0 !min-h-0" />
    </div>
  );
}

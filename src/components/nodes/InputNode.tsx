import { Handle, Position } from '@xyflow/react';
import { useState, useRef, useEffect } from 'react';
import { formatValue } from '../../engine/formatters';
import { OperationBadge } from './OperationBadge';
import type { ValueFormat } from '../../types/cea';

interface InputNodeData {
  label: string;
  value: number;
  format: ValueFormat;
  editable: boolean;
  highlighted: boolean;
  dimmed: boolean;
  glowing?: boolean;
  operation: string | null;
  onChange?: (value: number) => void;
  onClick?: () => void;
}

export function InputNode({ data }: { data: InputNodeData }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleDoubleClick = () => {
    if (!data.editable) return;
    setEditValue(String(data.value));
    setEditing(true);
  };

  const handleBlur = () => {
    setEditing(false);
    const parsed = parseFloat(editValue.replace(/[,$]/g, ''));
    if (!isNaN(parsed) && data.onChange) {
      data.onChange(parsed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBlur();
    if (e.key === 'Escape') setEditing(false);
  };

  return (
    <div
      onClick={data.onClick}
      onDoubleClick={handleDoubleClick}
      className={`relative px-4 py-3 rounded-lg border-2 bg-white shadow-sm cursor-pointer transition-all min-w-[180px] max-w-[200px]
        ${data.glowing ? 'border-emerald-600 !opacity-100' : data.highlighted ? 'border-emerald-500 shadow-md' : data.dimmed ? 'border-emerald-200 opacity-15' : 'border-emerald-300'}
        ${data.editable ? 'hover:border-emerald-500' : ''}
      `}
      style={data.glowing ? { boxShadow: '0 0 16px 4px rgba(16, 185, 129, 0.5)', borderWidth: 3 } : undefined}
    >
      <OperationBadge operation={data.operation} />
      <Handle type="target" position={Position.Top} className="!bg-transparent !w-0 !h-0 !border-0 !min-w-0 !min-h-0" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-transparent !w-0 !h-0 !border-0 !min-w-0 !min-h-0" />
      <div className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold mb-1">
        Input
      </div>
      <div className="text-[11px] text-gray-600 leading-tight mb-1">{data.label}</div>
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="text-base font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded px-1 w-full outline-none"
        />
      ) : (
        <div className="text-base font-bold text-emerald-800">
          {formatValue(data.value, data.format)}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !w-0 !h-0 !border-0 !min-w-0 !min-h-0" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-transparent !w-0 !h-0 !border-0 !min-w-0 !min-h-0" />
    </div>
  );
}

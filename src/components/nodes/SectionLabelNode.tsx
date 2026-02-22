interface SectionLabelNodeData {
  label: string;
  width: number;
  height: number;
}

export function SectionLabelNode({ data }: { data: SectionLabelNodeData }) {
  return (
    <div
      style={{ width: data.width, height: data.height }}
      className="pointer-events-none"
    >
      <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-2 px-1">
        {data.label}
      </div>
      <div
        className="w-full h-full rounded-lg"
        style={{
          border: '1.5px dashed #d1d5db',
          background: 'transparent',
        }}
      />
    </div>
  );
}

interface GraphTitleNodeData {
  label: string;
  width: number;
}

export function GraphTitleNode({ data }: { data: GraphTitleNodeData }) {
  return (
    <div
      style={{ width: data.width }}
      className="pointer-events-none text-center"
    >
      <div className="text-3xl font-extrabold text-gray-600 tracking-wide">
        {data.label}
      </div>
    </div>
  );
}

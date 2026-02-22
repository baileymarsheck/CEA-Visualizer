interface NarrativeSummaryNodeData {
  text: string;
  width: number;
}

export function NarrativeSummaryNode({ data }: { data: NarrativeSummaryNodeData }) {
  return (
    <div
      style={{ width: data.width }}
      className="pointer-events-none text-center px-8"
    >
      <p className="text-sm text-gray-400 italic leading-relaxed">
        {data.text}
      </p>
    </div>
  );
}

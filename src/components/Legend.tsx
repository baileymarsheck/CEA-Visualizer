const items = [
  { label: 'Input', color: 'bg-emerald-300', border: 'border-emerald-300' },
  { label: 'Calculation', color: 'bg-blue-300', border: 'border-blue-300' },
  { label: 'Adjustment', color: 'bg-amber-300', border: 'border-amber-300' },
  { label: 'Result', color: 'bg-violet-300', border: 'border-violet-400' },
];

export function Legend() {
  return (
    <div className="flex gap-4 items-center">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`w-3 h-3 rounded border-2 ${item.border} ${item.color}`} />
          <span className="text-xs text-gray-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

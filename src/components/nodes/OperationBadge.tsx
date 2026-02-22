interface OperationBadgeProps {
  operation: string | null;
}

export function OperationBadge({ operation }: OperationBadgeProps) {
  if (!operation) return null;

  return (
    <div className="absolute -top-2.5 -right-2.5 bg-blue-600 text-white rounded-full min-w-[22px] h-[22px] flex items-center justify-center text-[10px] font-bold shadow-md border-2 border-white px-1">
      {operation}
    </div>
  );
}

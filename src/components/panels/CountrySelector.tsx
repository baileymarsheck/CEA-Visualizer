import type { CountryData } from '../../types/cea';

interface CountrySelectorProps {
  regions: CountryData[];
  selectedId: string;
  onChange: (id: string) => void;
}

export function CountrySelector({ regions, selectedId, onChange }: CountrySelectorProps) {
  return (
    <div className="flex gap-1 flex-wrap">
      {regions.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={`px-3 py-1.5 text-sm rounded-md transition-all font-medium
            ${
              selectedId === c.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}

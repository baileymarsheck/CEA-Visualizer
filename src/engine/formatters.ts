import type { ValueFormat } from '../types/cea';

export function formatValue(value: number, format: ValueFormat): string {
  switch (format) {
    case 'currency':
      if (Math.abs(value) >= 1_000_000) {
        return '$' + (value / 1_000_000).toFixed(2) + 'M';
      }
      if (Math.abs(value) >= 10_000) {
        return '$' + Math.round(value).toLocaleString();
      }
      return '$' + value.toFixed(2);

    case 'number':
      if (Math.abs(value) >= 10_000) {
        return Math.round(value).toLocaleString();
      }
      if (Math.abs(value) >= 1) {
        return value.toFixed(1);
      }
      return value.toFixed(4);

    case 'percentage':
      if (Math.abs(value) < 0.01) {
        return (value * 100).toFixed(3) + '%';
      }
      return (value * 100).toFixed(1) + '%';

    case 'multiplier':
      return value.toFixed(1) + 'x';

    case 'uov':
      return value.toFixed(2) + ' UoV';

    default:
      return String(value);
  }
}

export function formatSignedPercentage(value: number): string {
  const pct = (value * 100).toFixed(1);
  return value >= 0 ? '+' + pct + '%' : pct + '%';
}

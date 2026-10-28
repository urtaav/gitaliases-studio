import { copy } from '../copy';
import type { Risk } from '../core/types';

export function RiskChip({ risk }: { risk?: Risk }) {
  if (!risk) return null;
  return risk === 'destructive' ? (
    <span className="chip chip-danger">{copy.risk.destructive}</span>
  ) : (
    <span className="chip chip-warn">{copy.risk.careful}</span>
  );
}

import { useId } from 'react';
import { copy } from '../copy';
import type { Risk } from '../core/types';

interface Props {
  risk?: Risk;
  checked: boolean;
  onChange(v: boolean): void;
  /** What exactly can be lost, in plain words. */
  message: string;
}

/** Red warning plus the "at my own risk" checkbox for destructive aliases; a note for careful ones. */
export function RiskAck({ risk, checked, onChange, message }: Props) {
  const id = useId();
  if (!risk) return null;
  if (risk === 'careful') {
    return <p className="notice notice-warn">{message || copy.risk.carefulNote}</p>;
  }
  return (
    <div className="notice notice-danger" role="group" aria-labelledby={`${id}-msg`}>
      <p id={`${id}-msg`} style={{ margin: '0 0 8px' }}>
        <b>{copy.risk.destructive}.</b> {message}
      </p>
      <label className="check">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        {copy.risk.ack}
      </label>
    </div>
  );
}

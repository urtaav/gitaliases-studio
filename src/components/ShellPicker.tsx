import { copy } from '../copy';
import type { Shell } from '../core/types';

const SHELLS: Shell[] = ['powershell', 'bash', 'cmd'];

export function ShellPicker({ value, onChange }: { value: Shell; onChange(s: Shell): void }) {
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="label" style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
        {copy.shellLabel}
      </legend>
      <div className="btn-row" role="radiogroup">
        {SHELLS.map((s) => (
          <label key={s} className={`btn btn-small${value === s ? ' btn-primary' : ''}`}>
            <input
              type="radio"
              name="shell"
              value={s}
              checked={value === s}
              onChange={() => onChange(s)}
              className="sr-only"
            />
            {copy.shells[s]}
          </label>
        ))}
      </div>
      <details className="help-box">
        <summary>{copy.apply.whichTerminal}</summary>
        <ul>
          {copy.apply.terminalHelp.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>
    </fieldset>
  );
}

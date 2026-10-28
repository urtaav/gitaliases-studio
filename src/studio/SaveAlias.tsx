import { useState } from 'react';
import { copy } from '../copy';
import { Notice } from '../components/Notice';
import { validateName } from '../core/validate';
import { useWorkspace } from '../state/WorkspaceContext';
import type { Alias, AliasType, Issue } from '../core/types';

interface Props {
  name: string;
  onName(name: string): void;
  type: AliasType;
  /** Builds the alias to save; called on click. */
  build(name: string): Alias;
  extraIssues?: Issue[];
  disabled?: boolean;
  /** Existing aliases of this type, offered for loading. */
  onLoad?(a: Alias): string | null;
}

/** Name field + save button + "load existing", shared by the designers. */
export function SaveAlias({ name, onName, type, build, extraIssues = [], disabled, onLoad }: Props) {
  const { state, dispatch } = useWorkspace();
  const [saved, setSaved] = useState('');
  const [loadMsg, setLoadMsg] = useState('');
  const existing = state.aliases.find((a) => a.name === name.toLowerCase());
  const issues = [
    ...validateName(name, state.aliases.map((a) => a.name), existing?.type === type ? existing.name : undefined),
    ...extraIssues,
  ];
  const sameType = state.aliases.filter((a) => a.type === type);

  return (
    <section className="panel" aria-labelledby={`save-${type}`}>
      <h2 id={`save-${type}`}>{copy.log.save}</h2>
      <div className="field">
        <label htmlFor={`name-${type}`}>{copy.log.aliasName}</label>
        <div className="inline-field">
          <span className="muted">git</span>
          <input
            id={`name-${type}`}
            type="text"
            value={name}
            spellCheck={false}
            onChange={(e) => onName(e.target.value)}
          />
        </div>
      </div>
      {issues.length > 0 && (
        <ul className="issues">
          {issues.map((i) => (
            <li key={i.code + i.message}>{i.message}</li>
          ))}
        </ul>
      )}
      <div className="btn-row" style={{ marginTop: 10 }}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={issues.length > 0 || disabled}
          onClick={() => {
            const alias = build(name.toLowerCase());
            dispatch({ type: 'upsert', alias, originalName: existing ? existing.name : undefined });
            setSaved(alias.name);
          }}
        >
          {copy.log.save}
        </button>
      </div>
      {saved && <Notice tone="ok">{copy.log.saved(saved)}</Notice>}

      {onLoad && (
        <div className="field" style={{ marginTop: 16 }}>
          <label htmlFor={`load-${type}`}>{copy.loadExisting[type as keyof typeof copy.loadExisting] ?? copy.log.load}</label>
          <select
            id={`load-${type}`}
            value=""
            disabled={!sameType.length}
            onChange={(e) => {
              const a = sameType.find((x) => x.name === e.target.value);
              if (a) setLoadMsg(onLoad(a) ?? '');
            }}
          >
            <option value="">{sameType.length ? '—' : copy.log.loadNone}</option>
            {sameType.map((a) => (
              <option key={a.name} value={a.name}>
                git {a.name}
              </option>
            ))}
          </select>
          {loadMsg && <span className="help">{loadMsg}</span>}
        </div>
      )}
    </section>
  );
}

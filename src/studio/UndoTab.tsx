import { copy } from '../copy';
import { RiskAck } from '../components/RiskAck';
import { RiskChip } from '../components/RiskChip';
import { CommandBlock } from '../components/CopyButton';
import { buildUndoAliasValue, undoRisk, undoSituation, UNDO_SITUATIONS } from '../core/undo';
import { useWorkspace } from '../state/WorkspaceContext';
import { SaveAlias } from './SaveAlias';

export function UndoTab() {
  const { state, dispatch } = useWorkspace();
  const d = state.undoDraft;
  const s = undoSituation(d.situationId) ?? UNDO_SITUATIONS[0]!;
  const risk = undoRisk(s.id);
  const destructive = risk === 'destructive';
  const value = buildUndoAliasValue({ situationId: s.id, confirm: destructive && d.confirm });

  const pick = (id: string) => {
    const next = undoSituation(id)!;
    // Asking first is on by default for anything that can delete work.
    dispatch({
      type: 'setUndoDraft',
      draft: { situationId: id, name: next.alias, confirm: next.risk === 'destructive', acknowledged: false },
    });
  };

  return (
    <>
      <header className="page-head">
        <h1>Undo something</h1>
        <p>Tell us what happened. You get the right command, what it does and what it does not do.</p>
      </header>

      <div className="designer">
        <fieldset className="panel undo-list">
          <legend className="sr-only">What happened?</legend>
          <h2>What happened?</h2>
          {UNDO_SITUATIONS.map((x) => (
            <label key={x.id} className={`undo-option${x.id === s.id ? ' is-selected' : ''}`}>
              <input type="radio" name="undo" checked={x.id === s.id} onChange={() => pick(x.id)} />
              <span>
                {x.title}
                <span className="alias-meta">
                  <code>git {x.alias}</code>
                  <RiskChip risk={undoRisk(x.id)} />
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        <div>
          <section className="panel" aria-labelledby="undo-detail">
            <h2 id="undo-detail">{s.title}</h2>
            <dl className="undo-facts">
              <dt>What it does</dt>
              <dd>{s.does}</dd>
              <dt>What it does not do</dt>
              <dd>{s.doesNot}</dd>
              <dt>Don't use it when</dt>
              <dd>{s.avoidWhen}</dd>
              <dt>Example</dt>
              <dd>
                <code>{s.example}</code>
              </dd>
            </dl>
            {destructive && (
              <label className="check" style={{ margin: '10px 0' }}>
                <input
                  type="checkbox"
                  checked={d.confirm}
                  onChange={(e) => dispatch({ type: 'setUndoDraft', draft: { confirm: e.target.checked } })}
                />
                Ask "Continue? [y/N]" before running (recommended)
              </label>
            )}
            <p className="help">The alias will run:</p>
            <CommandBlock text={value.startsWith('!') ? value : `git ${value}`} />
            <RiskAck
              risk={risk}
              checked={d.acknowledged}
              onChange={(v) => dispatch({ type: 'setUndoDraft', draft: { acknowledged: v } })}
              message={s.risk === 'destructive' ? s.does : s.avoidWhen}
            />
          </section>

          <SaveAlias
            name={d.name}
            onName={(n) => dispatch({ type: 'setUndoDraft', draft: { name: n } })}
            type="undo"
            disabled={destructive && !d.acknowledged}
            build={(name) => ({
              name,
              value,
              type: 'undo',
              description: s.title,
              ...(risk ? { risk } : {}),
              recipe: { kind: 'undo', undo: { situationId: s.id, confirm: destructive && d.confirm } },
            })}
          />
          {destructive && !d.acknowledged && <p className="help">{copy.risk.ack}</p>}
        </div>
      </div>
    </>
  );
}

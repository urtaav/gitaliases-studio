import { copy } from '../copy';
import { RiskAck } from '../components/RiskAck';
import { RiskChip } from '../components/RiskChip';
import { CommandBlock } from '../components/CopyButton';
import { buildUndoAliasValue, undoRisk, undoSituation, undoText, UNDO_SITUATIONS } from '../core/undo';
import { explainAlias } from '../core/explainAlias';
import { useWorkspace } from '../state/WorkspaceContext';
import { SaveAlias } from './SaveAlias';

export function UndoTab() {
  const { state, dispatch } = useWorkspace();
  const d = state.undoDraft;
  const s = undoSituation(d.situationId) ?? UNDO_SITUATIONS[0]!;
  const text = undoText(s.id);
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
        <h1>{copy.undoUi.title}</h1>
        <p>{copy.undoUi.intro}</p>
      </header>

      <div className="designer">
        <fieldset className="panel undo-list">
          <legend className="sr-only">{copy.undoUi.question}</legend>
          <h2>{copy.undoUi.question}</h2>
          {UNDO_SITUATIONS.map((x) => (
            <label key={x.id} className={`undo-option${x.id === s.id ? ' is-selected' : ''}`}>
              <input type="radio" name="undo" checked={x.id === s.id} onChange={() => pick(x.id)} />
              <span>
                {undoText(x.id).title}
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
            <h2 id="undo-detail">{text.title}</h2>
            <dl className="undo-facts">
              <dt>{copy.undoUi.does}</dt>
              <dd>{text.does}</dd>
              <dt>{copy.undoUi.doesNot}</dt>
              <dd>{text.doesNot}</dd>
              <dt>{copy.undoUi.avoid}</dt>
              <dd>{text.avoidWhen}</dd>
              <dt>{copy.undoUi.example}</dt>
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
                {copy.undoUi.ask}
              </label>
            )}
            <p className="help">{copy.undoUi.willRun}</p>
            <CommandBlock text={value.startsWith('!') ? value : `git ${value}`} parts={explainAlias({ value })} />
            <RiskAck
              risk={risk}
              checked={d.acknowledged}
              onChange={(v) => dispatch({ type: 'setUndoDraft', draft: { acknowledged: v } })}
              message={destructive ? text.does : text.avoidWhen}
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
              description: text.title,
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

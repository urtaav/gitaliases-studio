import { useState } from 'react';
import { copy } from '../copy';
import { CommandBlock } from '../components/CopyButton';
import { Notice } from '../components/Notice';
import { ShellPicker } from '../components/ShellPicker';
import { serializeAliasFile } from '../core/aliasFile';
import { ALIAS_FILE_NAME, buildApplyAllSteps, buildSetCommand, buildUnsetCommand } from '../core/shell';
import { navigate } from '../app/router';
import { detectRisk } from '../core/risk';
import { RiskChip } from '../components/RiskChip';
import { useWorkspace } from '../state/WorkspaceContext';
import type { Change } from '../core/types';

function download(text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = ALIAS_FILE_NAME;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const KIND_LABEL = { added: copy.apply.added, edited: copy.apply.edited, removed: copy.apply.removed };

function ChangeList({ changes }: { changes: Change[] }) {
  return (
    <ul className="changes">
      {changes.map((c) => (
        <li key={c.kind + c.name}>
          <span className={`chip chip-${c.kind}`}>{KIND_LABEL[c.kind]}</span>
          <b className="alias-name">git {c.name}</b>
          {c.kind !== 'removed' && <RiskChip risk={c.after!.risk ?? detectRisk(c.after!.value)} />}
          {c.kind === 'edited' ? (
            <span className="alias-cmd">
              <s>{c.before!.value}</s> → {c.after!.value}
            </span>
          ) : (
            <span className="alias-cmd">{(c.after ?? c.before)!.value}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function ApplyTab() {
  const { state, dispatch, changes } = useWorkspace();
  const [method, setMethod] = useState<'all' | 'one'>('all');
  const [done, setDone] = useState(false);
  const shell = state.shell;

  if (!changes.length) {
    return (
      <>
        <header className="page-head">
          <h1>{copy.apply.title}</h1>
        </header>
        {done && <Notice tone="ok">{copy.apply.appliedDone}</Notice>}
        <div className="panel">
          <h2>{copy.apply.nothing}</h2>
          <p className="muted">{copy.apply.nothingBody}</p>
          <div className="btn-row">
            <button type="button" className="btn" onClick={() => navigate({ page: 'studio', tab: 'aliases' })}>
              {copy.tabs.aliases}
            </button>
            <button type="button" className="btn" onClick={() => navigate({ page: 'studio', tab: 'catalog' })}>
              {copy.tabs.catalog}
            </button>
          </div>
        </div>
      </>
    );
  }

  const testAlias =
    state.aliases.find((a) => a.name === 'st')?.name ?? changes.find((c) => c.kind !== 'removed')?.name;
  const steps = buildApplyAllSteps(shell, { imported: state.imported, testAlias });
  const oneByOne = changes.map((c) =>
    c.kind === 'removed'
      ? { change: c, result: { text: buildUnsetCommand(c.name), supported: true as const } }
      : { change: c, result: buildSetCommand(shell, c.name, c.after!.value) },
  );
  const allCommands = oneByOne
    .filter((x) => x.result.supported)
    .map((x) => x.result.text)
    .join('\n');

  return (
    <>
      <header className="page-head">
        <h1>{copy.apply.title}</h1>
        <p>{copy.apply.intro}</p>
      </header>

      <section className="panel" aria-labelledby="pending-title">
        <h2 id="pending-title">{copy.apply.pending(changes.length)}</h2>
        <ChangeList changes={changes} />
      </section>

      <div className="panel" style={{ marginTop: 16 }}>
        <ShellPicker value={shell} onChange={(s) => dispatch({ type: 'setShell', shell: s })} />
      </div>

      <div className="methods" role="group" aria-label="Method">
        <button type="button" className="btn method" aria-pressed={method === 'all'} onClick={() => setMethod('all')}>
          {copy.apply.methodAll} <span className="chip">{copy.apply.methodAllTag}</span>
          <small>{copy.apply.methodAllHelp}</small>
        </button>
        <button type="button" className="btn method" aria-pressed={method === 'one'} onClick={() => setMethod('one')}>
          {copy.apply.methodOne}
          <small>{copy.apply.methodOneHelp}</small>
        </button>
      </div>

      {method === 'all' ? (
        <section className="panel" aria-label={copy.apply.methodAll}>
          {!state.imported && <Notice>{copy.apply.noImportNote}</Notice>}
          <ol className="steps" style={{ marginTop: 14 }}>
            {steps.map((s) => (
              <li key={s.id}>
                <h3>{copy.apply.steps[s.id].title}</h3>
                <p className="help">{copy.apply.steps[s.id].body}</p>
                {s.id === 'download' ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => download(serializeAliasFile(state.aliases))}
                  >
                    {copy.apply.downloadButton}
                  </button>
                ) : (
                  s.command && <CommandBlock text={s.command} />
                )}
              </li>
            ))}
          </ol>
          <p className="help">
            <b>{copy.apply.restoreTitle}</b> {copy.apply.restoreBody}
          </p>
        </section>
      ) : (
        <section className="panel" aria-label={copy.apply.methodOne}>
          {oneByOne.map(({ change, result }) => (
            <div key={change.kind + change.name} style={{ marginBottom: 14 }}>
              <div className="btn-row">
                <span className={`chip chip-${change.kind}`}>{KIND_LABEL[change.kind]}</span>
                <b>git {change.name}</b>
              </div>
              {result.supported ? <CommandBlock text={result.text} /> : null}
              {'notice' in result && result.notice === 'cmd-unsafe' && (
                <Notice tone="warn">{copy.apply.cmdNotice}</Notice>
              )}
            </div>
          ))}
          {allCommands && <CommandBlock text={allCommands} label={copy.apply.copyAll} />}
        </section>
      )}

      <div className="btn-row" style={{ marginTop: 18 }}>
        <button
          type="button"
          className="btn"
          onClick={() => {
            dispatch({ type: 'markApplied' });
            setDone(true);
          }}
        >
          {copy.apply.markApplied}
        </button>
      </div>
    </>
  );
}

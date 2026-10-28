import { useRef, useState } from 'react';
import { copy } from '../copy';
import { AliasForm } from '../components/AliasForm';
import { CommandBlock } from '../components/CopyButton';
import { Notice } from '../components/Notice';
import { parseGitconfig, parseRegexpOutput, toAliases, type ImportResult } from '../core/import';
import { describeAlias } from '../core/validate';
import { openInDesigner } from './openInDesigner';
import { navigate } from '../app/router';
import { useWorkspace } from '../state/WorkspaceContext';
import type { Alias, ChangeKind } from '../core/types';

const TYPE_LABEL: Record<Alias['type'], string> = {
  shortcut: 'shortcut',
  shell: 'shell',
  log: 'log view',
  branches: 'branch list',
  chart: 'chart',
  undo: 'undo',
};

function ImportPanel({ onDone }: { onDone(): void }) {
  const { state, dispatch, changes } = useWorkspace();
  const [text, setText] = useState('');
  const [over, setOver] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const finish = (r: ImportResult) => {
    setResult(r);
    if (!r.aliases.length) return;
    // Keep aliases the user added before importing.
    const added = changes.filter((c) => c.kind === 'added').map((c) => c.after!);
    const imported = toAliases(r.aliases);
    dispatch({ type: 'import', aliases: imported });
    added
      .filter((a) => !imported.some((i) => i.name === a.name.toLowerCase()))
      .forEach((a) => dispatch({ type: 'upsert', alias: a }));
    setText('');
    onDone();
  };

  const readFile = (file: File) => {
    // Only the [alias] section survives parsing; the raw text is never stored.
    file.text().then((t) => finish(parseGitconfig(t)));
  };

  return (
    <div className="grid-2">
      <section className="panel" aria-labelledby="imp-paste">
        <h3 id="imp-paste">{copy.aliases.importPasteTitle}</h3>
        <p className="help">{copy.aliases.importPasteHelp}</p>
        <CommandBlock text={copy.aliases.importPasteCommand} />
        <label htmlFor="imp-text" className="sr-only">
          {copy.aliases.importPasteTitle}
        </label>
        <textarea
          id="imp-text"
          value={text}
          spellCheck={false}
          placeholder={copy.aliases.importPastePlaceholder}
          onChange={(e) => setText(e.target.value)}
          style={{ marginTop: 8 }}
        />
        <div className="btn-row" style={{ marginTop: 8 }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!text.trim()}
            onClick={() => finish(/^\s*\[/m.test(text) ? parseGitconfig(text) : parseRegexpOutput(text))}
          >
            {copy.aliases.importPasteButton}
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="imp-file">
        <h3 id="imp-file">{copy.aliases.importFileTitle}</h3>
        <p className="help">{copy.aliases.importFileHelp}</p>
        <div
          className={`dropzone${over ? ' is-over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            const f = e.dataTransfer.files[0];
            if (f) readFile(f);
          }}
        >
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            {copy.aliases.importFileButton}
          </button>
          <input
            ref={fileRef}
            type="file"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) readFile(f);
              e.target.value = '';
            }}
          />
        </div>
        <p className="help" style={{ marginTop: 10 }}>{copy.aliases.importFileWhere}</p>
      </section>

      {result && !result.aliases.length && (
        <Notice tone="warn">{copy.aliases.importNothing}</Notice>
      )}
      {result && result.skipped.length > 0 && state.imported && (
        <Notice>
          {copy.aliases.importSkipped} {result.skipped.slice(0, 5).join(' ')}
        </Notice>
      )}
    </div>
  );
}

function ChangeChip({ kind }: { kind?: ChangeKind }) {
  if (!kind) return null;
  const label = { added: 'new', edited: 'edited', removed: 'removed' }[kind];
  return <span className={`chip chip-${kind}`}>{label}</span>;
}

export function AliasesTab() {
  const { state, dispatch, changes } = useWorkspace();
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState<string | null>(null); // alias name, or '' for new
  const [notice, setNotice] = useState('');

  const changeOf = new Map(changes.map((c) => [c.name.toLowerCase(), c.kind]));
  const removed = changes.filter((c) => c.kind === 'removed').map((c) => c.before!);
  const rows = [...state.aliases, ...removed].sort((a, b) => a.name.localeCompare(b.name));
  const names = state.aliases.map((a) => a.name);
  const empty = rows.length === 0;

  const openDesigner = (a: Alias) => {
    openInDesigner(a, dispatch);
  };

  const save = (a: Alias, originalName?: string) => {
    dispatch({ type: 'upsert', alias: a, originalName });
    setEditing(null);
  };

  return (
    <>
      <header className="page-head">
        <h1>{copy.aliases.title}</h1>
        <p>{copy.aliases.intro}</p>
      </header>

      {empty && !showImport && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <h2>{copy.aliases.emptyTitle}</h2>
          <p className="muted">{copy.aliases.emptyBody}</p>
        </div>
      )}

      {(empty || showImport) && (
        <ImportPanel
          onDone={() => {
            setShowImport(false);
            setNotice('imported');
          }}
        />
      )}

      {notice === 'imported' && state.imported && (
        <Notice tone="ok">{copy.aliases.importDone(state.baseline.length)}</Notice>
      )}

      <div className="list-head" style={{ marginTop: 20 }}>
        <span className="muted">{copy.aliases.count(state.aliases.length)}</span>
        <div className="btn-row">
          {!empty && (
            <button type="button" className="btn" onClick={() => setShowImport((v) => !v)}>
              {copy.aliases.importAgain}
            </button>
          )}
          <button type="button" className="btn" onClick={() => navigate({ page: 'studio', tab: 'catalog' })}>
            {copy.aliases.pickCatalog}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setEditing('')}>
            {copy.aliases.newAlias}
          </button>
        </div>
      </div>

      {editing === '' && (
        <div style={{ margin: '12px 0' }}>
          <AliasForm existingNames={names} onSave={save} onCancel={() => setEditing(null)} />
        </div>
      )}

      {!empty && (
        <ul className="alias-list">
          {rows.map((a) => {
            const kind = changeOf.get(a.name.toLowerCase());
            if (editing === a.name) {
              return (
                <li key={a.name} style={{ padding: '12px 0' }}>
                  <AliasForm
                    initial={a}
                    existingNames={names}
                    onSave={save}
                    onCancel={() => setEditing(null)}
                    onOpenInDesigner={openDesigner}
                  />
                </li>
              );
            }
            const isRemoved = kind === 'removed';
            return (
              <li key={a.name} className={`alias-row${isRemoved ? ' is-removed' : ''}`}>
                <div className="alias-name">{a.name}</div>
                <div>
                  <p className="alias-desc">{describeAlias(a)}</p>
                  <div className="alias-cmd">
                    {copy.aliases.youType}: <code>git {a.name}</code> → <code>{a.value}</code>
                  </div>
                  <div className="alias-meta">
                    <span className="chip">{TYPE_LABEL[a.type]}</span>
                    <ChangeChip kind={kind} />
                    {isRemoved && <span className="help">{copy.aliases.removedNote}</span>}
                  </div>
                </div>
                <div className="btn-row">
                  {isRemoved ? (
                    <button type="button" className="btn btn-small" onClick={() => dispatch({ type: 'restore', name: a.name })}>
                      {copy.aliases.restore}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn btn-small"
                        onClick={() => setEditing(a.name)}
                        aria-label={`${copy.aliases.edit} ${a.name}`}
                      >
                        {copy.aliases.edit}
                      </button>
                      <button
                        type="button"
                        className="btn btn-small"
                        onClick={() => dispatch({ type: 'remove', name: a.name })}
                        aria-label={`${copy.aliases.delete} ${a.name}`}
                      >
                        {copy.aliases.delete}
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

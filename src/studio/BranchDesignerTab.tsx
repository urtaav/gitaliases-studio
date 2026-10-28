import { useState } from 'react';
import { copy } from '../copy';
import { CommandExplain } from '../components/CommandExplain';
import { TermPreview } from '../components/TermPreview';
import { COLOR_ATTRS, cssColor, GIT_NAMED_COLORS, isHex, type ColorAttr } from '../core/colors';
import {
  BRANCH_FIELD_KEYS,
  BRANCH_SCOPES,
  BRANCH_SORTS,
  branchFieldText,
  buildBranchAliasValue,
  explainBranch,
  makeBranchField,
  renderBranchPreview,
  scopeLabel,
  sortLabel,
  validateBranchSeparator,
  type BranchField,
  type BranchFieldKey,
  type BranchRecipe,
  type BranchScope,
  type BranchSort,
} from '../core/branchFormat';
import { SAMPLE_BRANCHES } from '../data/sampleBranches';
import { useWorkspace } from '../state/WorkspaceContext';
import { SaveAlias } from './SaveAlias';
import { recipeOf } from './openInDesigner';
import { useTerminalColors } from './useTerminal';

const SEPARATORS = [' ', '', '│', '|', '»'];

function FieldEditor({ f, onChange }: { f: BranchField; onChange(f: BranchField): void }) {
  const mode = f.color === '' ? 'terminal' : isHex(f.color) ? 'custom' : f.color;
  const toggle = (a: ColorAttr) =>
    onChange({ ...f, attrs: f.attrs.includes(a) ? f.attrs.filter((x) => x !== a) : [...f.attrs, a] });
  return (
    <div className="field-body">
      <div className="field">
        <label htmlFor={`bc-${f.uid}`}>{copy.log.color}</label>
        <div className="inline-field">
          <select
            id={`bc-${f.uid}`}
            value={mode}
            onChange={(e) => onChange({ ...f, color: e.target.value === 'terminal' ? '' : e.target.value === 'custom' ? '#E5C07B' : e.target.value })}
          >
            <option value="terminal">{copy.log.terminalColor}</option>
            <option value="custom">{copy.custom}</option>
            {GIT_NAMED_COLORS.filter((c) => c !== 'normal').map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {mode === 'custom' && (
            <input type="color" aria-label={`${copy.log.color} (custom)`} value={f.color} onChange={(e) => onChange({ ...f, color: e.target.value.toUpperCase() })} />
          )}
        </div>
      </div>
      <div className="field">
        <span className="label">{copy.log.style}</span>
        <div className="attr-toggles">
          {COLOR_ATTRS.map((a) => (
            <button key={a} type="button" className="btn btn-small" aria-pressed={f.attrs.includes(a)} onClick={() => toggle(a)}>
              {a}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label htmlFor={`bw-${f.uid}`}>{copy.log.width}</label>
        <input id={`bw-${f.uid}`} type="number" min={0} max={120} value={f.width} title={copy.log.widthHelp}
          onChange={(e) => onChange({ ...f, width: Math.max(0, Math.min(120, Number(e.target.value) || 0)) })} />
      </div>
      {f.width > 0 && (
        <div className="field">
          <label htmlFor={`ba-${f.uid}`}>{copy.log.align}</label>
          <select id={`ba-${f.uid}`} value={f.align} onChange={(e) => onChange({ ...f, align: e.target.value as BranchField['align'] })}>
            <option value="left">{copy.align.left}</option>
            <option value="right">{copy.align.right}</option>
            <option value="middle">{copy.align.center}</option>
          </select>
        </div>
      )}
      {f.key === 'date' && (
        <div className="field">
          <label htmlFor={`bd-${f.uid}`}>{copy.log.dateFormat}</label>
          <select id={`bd-${f.uid}`} value={f.dateFormat} onChange={(e) => onChange({ ...f, dateFormat: e.target.value as BranchField['dateFormat'] })}>
            <option value="short">2026-10-27</option>
            <option value="relative">2 days ago</option>
            <option value="iso">2026-10-27 18:02:00 -0600</option>
          </select>
        </div>
      )}
    </div>
  );
}

export function BranchDesignerTab() {
  const { state, dispatch } = useWorkspace();
  const r = state.branchDraft;
  const set = (draft: BranchRecipe, name?: string) => dispatch({ type: 'setBranchDraft', draft, name });
  const term = useTerminalColors();
  const [focus, setFocus] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [toAdd, setToAdd] = useState<BranchFieldKey>('author');

  const fields = r.fields;
  const setFields = (next: BranchField[]) => set({ ...r, fields: next });
  const move = (from: number, to: number) => {
    if (to < 0 || to >= fields.length || from === to) return;
    const next = [...fields];
    const [f] = next.splice(from, 1);
    next.splice(to, 0, f!);
    setFields(next);
  };
  const sepIsPreset = SEPARATORS.includes(r.separator);

  return (
    <>
      <header className="page-head">
        <h1>{copy.branchesUi.title}</h1>
        <p>{copy.branchesUi.intro}</p>
      </header>

      <TermPreview
        lines={renderBranchPreview(r, SAMPLE_BRANCHES)}
        title={`$ git ${state.branchDraftName || 'alias'}`}
        note={copy.branchesUi.sample}
        bg={term.bg}
        fg={term.fg}
        focus={focus}
      />
      <CommandExplain parts={explainBranch(r)} focus={focus} onFocus={setFocus} />

      <div className="designer">
        <div>
          <section className="panel" aria-labelledby="bfields">
            <h2 id="bfields">{copy.log.fields}</h2>
            <ol className="field-list">
              {fields.map((f, i) => (
                <li
                  key={f.uid}
                  className="field-item"
                  draggable
                  onDragStart={() => setDragIdx(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIdx !== null) move(dragIdx, i);
                    setDragIdx(null);
                  }}
                  onMouseEnter={() => setFocus(f.uid)}
                  onMouseLeave={() => setFocus(null)}
                  onFocus={() => setFocus(f.uid)}
                >
                  <div className="field-head">
                    <span className="grip" aria-hidden="true">⋮⋮</span>
                    <span className="swatch" style={{ background: cssColor(f.color) ?? 'var(--fg)' }} aria-hidden="true" />
                    <button type="button" className="btn-link field-label" aria-expanded={open === f.uid} onClick={() => setOpen(open === f.uid ? null : f.uid)}>
                      {branchFieldText(f.key).label}
                    </button>
                    <button type="button" className="btn btn-small btn-icon" aria-label={`${copy.log.moveUp}: ${branchFieldText(f.key).label}`} disabled={i === 0} onClick={() => move(i, i - 1)}>↑</button>
                    <button type="button" className="btn btn-small btn-icon" aria-label={`${copy.log.moveDown}: ${branchFieldText(f.key).label}`} disabled={i === fields.length - 1} onClick={() => move(i, i + 1)}>↓</button>
                    <button type="button" className="btn btn-small btn-icon" aria-label={`${copy.log.removeField}: ${branchFieldText(f.key).label}`} onClick={() => setFields(fields.filter((x) => x.uid !== f.uid))}>×</button>
                  </div>
                  {open === f.uid && <FieldEditor f={f} onChange={(nf) => setFields(fields.map((x) => (x.uid === f.uid ? nf : x)))} />}
                </li>
              ))}
            </ol>
            <div className="inline-field">
              <label htmlFor="badd" className="sr-only">{copy.log.addField}</label>
              <select id="badd" value={toAdd} onChange={(e) => setToAdd(e.target.value as BranchFieldKey)}>
                {BRANCH_FIELD_KEYS.map((k) => (
                  <option key={k} value={k}>{branchFieldText(k).label}</option>
                ))}
              </select>
              <button type="button" className="btn" onClick={() => setFields([...fields, makeBranchField(toAdd)])}>{copy.log.addField}</button>
            </div>
          </section>

          <SaveAlias
            name={state.branchDraftName}
            onName={(n) => set(r, n)}
            type="branches"
            extraIssues={validateBranchSeparator(r.separator)}
            disabled={fields.length === 0}
            build={(name) => ({ name, value: buildBranchAliasValue(r), type: 'branches', recipe: { kind: 'branches', branches: r } })}
            onLoad={(a) => {
              const rec = recipeOf(a);
              if (rec?.kind !== 'branches') return copy.log.loadFailed;
              set(rec.branches, a.name);
              return null;
            }}
          />
        </div>

        <section className="panel" aria-labelledby="bopts">
          <h2 id="bopts">{copy.log.options}</h2>
          <div className="field" onMouseEnter={() => setFocus('sort')} onMouseLeave={() => setFocus(null)}>
            <label htmlFor="bsort">{copy.branchesUi.order}</label>
            <select id="bsort" value={r.sort} onChange={(e) => set({ ...r, sort: e.target.value as BranchSort })}>
              {BRANCH_SORTS.map((s) => <option key={s} value={s}>{sortLabel(s)}</option>)}
            </select>
          </div>
          <div className="field" onMouseEnter={() => setFocus('scope')} onMouseLeave={() => setFocus(null)}>
            <label htmlFor="bscope">{copy.branchesUi.which}</label>
            <select id="bscope" value={r.scope} onChange={(e) => set({ ...r, scope: e.target.value as BranchScope })}>
              {BRANCH_SCOPES.map((s) => <option key={s} value={s}>{scopeLabel(s)}</option>)}
            </select>
          </div>
          <label className="inline-field field" htmlFor="bcount" onMouseEnter={() => setFocus('count')} onMouseLeave={() => setFocus(null)}>
            {copy.log.maxCount}
            <input id="bcount" type="number" min={0} value={r.count} onChange={(e) => set({ ...r, count: Math.max(0, Number(e.target.value) || 0) })} />
          </label>
          <div className="opt-grid">
            <div className="field">
              <label htmlFor="bsep">{copy.log.separator}</label>
              <select id="bsep" value={sepIsPreset ? r.separator : 'custom'} onChange={(e) => set({ ...r, separator: e.target.value === 'custom' ? '·' : e.target.value })}>
                {SEPARATORS.map((s) => <option key={s} value={s}>{s === ' ' ? copy.separators.single : s === '' ? copy.separators.two : s}</option>)}
                <option value="custom">{copy.custom}</option>
              </select>
              {!sepIsPreset && (
                <input type="text" aria-label={`${copy.log.separator} (custom)`} value={r.separator} maxLength={6} onChange={(e) => set({ ...r, separator: e.target.value })} />
              )}
            </div>
            <div className="field">
              <label htmlFor="bsepc">{copy.log.separatorColor}</label>
              <input id="bsepc" type="color" value={isHex(r.separatorColor) ? r.separatorColor : '#666666'} onChange={(e) => set({ ...r, separatorColor: e.target.value.toUpperCase() })} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="bterm">{copy.log.terminalBg}</label>
            <input id="bterm" type="color" value={state.terminalBg} onChange={(e) => dispatch({ type: 'setTerminalBg', color: e.target.value.toUpperCase() })} />
          </div>
        </section>
      </div>
    </>
  );
}

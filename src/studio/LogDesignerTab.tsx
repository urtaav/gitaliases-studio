import { useState } from 'react';
import { copy } from '../copy';
import { Notice } from '../components/Notice';
import { contrastRatio } from '../core/contrast';
import { cssColor } from '../core/colors';
import { CommandExplain } from '../components/CommandExplain';
import {
  buildLogAliasValue,
  explainLog,
  MARKERS,
  validateDateFormat,
  validateSeparator,
  type LogRecipe,
  type Marker,
} from '../core/logFormat';
import { recipeOf } from './openInDesigner';
import { validateName } from '../core/validate';
import { fieldDef } from '../data/fields';
import { applyThemeToRecipe, getTheme } from '../data/themes';
import { useWorkspace } from '../state/WorkspaceContext';
import { ThemeSelect } from './StudioLayout';
import { FieldList } from './log/FieldList';
import { PreviewPane } from './log/PreviewPane';

const SEPARATORS = ['│', '|', '»', '::', '/', ''];
const DATES = [
  ['short', '2026-10-15'],
  ['relative', '13 days ago'],
  ['iso', '2026-10-15 16:54:00 -0600'],
  ['rfc', 'Thu, 15 Oct 2026 16:54:00 -0600'],
  ['default', 'Thu Oct 15 16:54:00 2026 -0600'],
] as const;

export function LogDesignerTab() {
  const { state, dispatch } = useWorkspace();
  const r = state.draft;
  const set = (draft: LogRecipe) => dispatch({ type: 'setDraft', draft });
  const [focusUid, setFocusUid] = useState<string | null>(null);
  const [saved, setSaved] = useState('');
  const [loadMsg, setLoadMsg] = useState('');

  const theme = getTheme(state.themeId);
  const isCustom = JSON.stringify(applyThemeToRecipe(r, theme)) !== JSON.stringify(r);
  // Text in the terminal's own color must stay readable whatever background the user picks.
  const validBg = /^#[0-9A-F]{6}$/i.test(state.terminalBg);
  const terminalFg =
    !validBg || contrastRatio(theme.colors.fg, state.terminalBg) >= 4.5
      ? theme.colors.fg
      : contrastRatio('#FFFFFF', state.terminalBg) > contrastRatio('#111111', state.terminalBg)
        ? '#FFFFFF'
        : '#111111';

  // Field colors that would be hard to read on the user's real terminal.
  const warnings = new Map<string, string>();
  for (const f of r.fields) {
    const c = cssColor(f.color);
    if (!c || !/^#[0-9A-F]{6}$/i.test(state.terminalBg)) continue;
    const ratio = contrastRatio(c, state.terminalBg);
    if (ratio < 3) warnings.set(f.uid, copy.log.lowContrast(ratio.toFixed(1)));
  }

  const customDate = r.dateFormat.startsWith('format:');
  const sepIsPreset = SEPARATORS.includes(r.separator);
  const name = state.draftName;
  const existing = state.aliases.find((a) => a.name === name.toLowerCase());
  const issues = [
    ...validateName(name, state.aliases.map((a) => a.name), existing?.type === 'log' ? existing.name : undefined),
    ...validateSeparator(r.separator),
    ...validateDateFormat(r.dateFormat),
  ];
  const logAliases = state.aliases.filter((a) => a.type === 'log');

  return (
    <>
      <header className="page-head">
        <h1>{copy.log.title}</h1>
        <p>{copy.log.intro}</p>
      </header>

      <PreviewPane recipe={r} meName={state.meName} terminalBg={state.terminalBg} terminalFg={terminalFg} aliasName={name} focusUid={focusUid} />
      <CommandExplain parts={explainLog(r)} focus={focusUid} onFocus={setFocusUid} />

      <div className="designer">
        <div>
          <FieldList recipe={r} onChange={set} onFocusField={setFocusUid} warnings={warnings} />

          <section className="panel" aria-labelledby="save-title">
            <h2 id="save-title">{copy.log.save}</h2>
            <div className="field">
              <label htmlFor="log-name">{copy.log.aliasName}</label>
              <div className="inline-field">
                <span className="muted">git</span>
                <input
                  id="log-name"
                  type="text"
                  value={name}
                  spellCheck={false}
                  onChange={(e) => dispatch({ type: 'setDraft', draft: r, name: e.target.value })}
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
                disabled={issues.length > 0 || r.fields.length === 0}
                onClick={() => {
                  const alias = name.toLowerCase();
                  dispatch({
                    type: 'upsert',
                    alias: { name: alias, value: buildLogAliasValue(r), type: 'log', recipe: { kind: 'log', log: r } },
                    originalName: existing ? existing.name : undefined,
                  });
                  setSaved(alias);
                }}
              >
                {copy.log.save}
              </button>
            </div>
            {saved && <Notice tone="ok">{copy.log.saved(saved)}</Notice>}

            <div className="field" style={{ marginTop: 16 }}>
              <label htmlFor="log-load">{copy.log.load}</label>
              <select
                id="log-load"
                value=""
                disabled={!logAliases.length}
                onChange={(e) => {
                  const a = logAliases.find((x) => x.name === e.target.value);
                  if (!a) return;
                  const recipe = recipeOf(a);
                  if (recipe?.kind !== 'log') {
                    setLoadMsg(copy.log.loadFailed);
                    return;
                  }
                  setLoadMsg('');
                  dispatch({ type: 'setDraft', draft: recipe.log, name: a.name });
                }}
              >
                <option value="">{logAliases.length ? '—' : copy.log.loadNone}</option>
                {logAliases.map((a) => (
                  <option key={a.name} value={a.name}>
                    git {a.name}
                  </option>
                ))}
              </select>
              {loadMsg && <span className="help">{loadMsg}</span>}
            </div>
          </section>
        </div>

        <section className="panel" aria-labelledby="opts-title">
          <h2 id="opts-title">{copy.log.options}</h2>

          <div className="field">
            <ThemeSelect id="designer-theme" />
            {isCustom && <span className="help">{copy.log.themeCustom}: your changes are kept until you pick a theme again.</span>}
          </div>

          <div className="opt-grid">
            <div className="field">
              <label htmlFor="sep">{copy.log.separator}</label>
              <select
                id="sep"
                value={sepIsPreset ? r.separator : 'custom'}
                onChange={(e) => set({ ...r, separator: e.target.value === 'custom' ? '·' : e.target.value })}
              >
                {SEPARATORS.map((s) => (
                  <option key={s} value={s}>
                    {s === '' ? 'Two spaces' : s}
                  </option>
                ))}
                <option value="custom">Custom…</option>
              </select>
              {!sepIsPreset && (
                <input
                  type="text"
                  aria-label={`${copy.log.separator} (custom)`}
                  value={r.separator}
                  maxLength={6}
                  onChange={(e) => set({ ...r, separator: e.target.value })}
                />
              )}
            </div>
            <div className="field">
              <label htmlFor="sep-color">{copy.log.separatorColor}</label>
              <input
                id="sep-color"
                type="color"
                value={/^#/.test(r.separatorColor) ? r.separatorColor : '#666666'}
                onChange={(e) => set({ ...r, separatorColor: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="date-fmt">{copy.log.dateFormat}</label>
            <select
              id="date-fmt"
              value={customDate ? 'custom' : r.dateFormat}
              onChange={(e) =>
                set({ ...r, dateFormat: e.target.value === 'custom' ? 'format:%d-%b %H:%M' : e.target.value })
              }
            >
              {DATES.map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
              <option value="custom">{copy.log.customDate}</option>
            </select>
            {customDate && (
              <input
                type="text"
                aria-label={copy.log.customDate}
                value={r.dateFormat.slice(7)}
                onChange={(e) => set({ ...r, dateFormat: 'format:' + e.target.value })}
              />
            )}
          </div>

          <div className="field">
            <label className="check">
              <input type="checkbox" checked={r.graph} onChange={(e) => set({ ...r, graph: e.target.checked })} />
              {copy.log.graph}
            </label>
            <label className="check">
              <input type="checkbox" checked={r.all} onChange={(e) => set({ ...r, all: e.target.checked })} />
              {copy.log.all}
            </label>
            <label className="inline-field" htmlFor="max-count">
              {copy.log.maxCount}
              <input
                id="max-count"
                type="number"
                min={0}
                value={r.maxCount}
                onChange={(e) => set({ ...r, maxCount: Math.max(0, Number(e.target.value) || 0) })}
              />
            </label>
          </div>

          <div className="field">
            <label className="check">
              <input
                type="checkbox"
                checked={r.highlight.enabled}
                onChange={(e) => set({ ...r, highlight: { ...r.highlight, enabled: e.target.checked } })}
              />
              {copy.log.highlight}
            </label>
            <span className="help">{copy.log.highlightHelp}</span>
          </div>
          {r.highlight.enabled && (
            <div className="sub">
              <div className="btn-row" style={{ marginBottom: 10 }}>
                <label className="inline-field">
                  {copy.log.marker}
                  <select
                    value={r.highlight.marker}
                    onChange={(e) => set({ ...r, highlight: { ...r.highlight, marker: e.target.value as Marker } })}
                  >
                    {MARKERS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>
                <input
                  type="color"
                  aria-label={`${copy.log.highlight}: ${copy.log.color}`}
                  value={r.highlight.color}
                  onChange={(e) => set({ ...r, highlight: { ...r.highlight, color: e.target.value.toUpperCase() } })}
                />
                <label className="check">
                  <input
                    type="checkbox"
                    checked={r.highlight.bold}
                    onChange={(e) => set({ ...r, highlight: { ...r.highlight, bold: e.target.checked } })}
                  />
                  {copy.log.bold}
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={r.highlight.pager}
                    onChange={(e) => set({ ...r, highlight: { ...r.highlight, pager: e.target.checked } })}
                  />
                  {copy.log.pager}
                </label>
              </div>
              <div className="field">
                <label htmlFor="me-name">{copy.log.meName}</label>
                <input
                  id="me-name"
                  type="text"
                  value={state.meName}
                  onChange={(e) => dispatch({ type: 'setMeName', name: e.target.value })}
                />
              </div>
              {!r.fields.some((f) => fieldDef(f.placeholder)?.role === 'author') && (
                <span className="help">The marker goes at the start of each line because there is no author field.</span>
              )}
            </div>
          )}

          <div className="field">
            <label htmlFor="term-bg">{copy.log.terminalBg}</label>
            <input
              id="term-bg"
              type="color"
              value={state.terminalBg}
              onChange={(e) => dispatch({ type: 'setTerminalBg', color: e.target.value.toUpperCase() })}
            />
          </div>
        </section>
      </div>
    </>
  );
}

import { useState } from 'react';
import { copy } from '../copy';
import { CommandExplain } from '../components/CommandExplain';
import { TermPreview } from '../components/TermPreview';
import {
  BAR_CHARS,
  buildChartAliasValue,
  CHART_PRESETS,
  explainChart,
  isRanked,
  CHART_METRICS,
  metricLabel,
  PERIODS,
  renderChartPreview,
  type BarChar,
  type ChartMetric,
  type ChartPeriod,
  type ChartRecipe,
} from '../core/chartFormat';
import { applyThemeToChartRecipe, getTheme } from '../data/themes';
import { SAMPLE_CHART } from '../data/sampleChart';
import { useWorkspace } from '../state/WorkspaceContext';
import { SaveAlias } from './SaveAlias';
import { recipeOf } from './openInDesigner';
import { useTerminalColors } from './useTerminal';

const periodLabel = (d: ChartPeriod) =>
  d === 0 ? copy.chartUi.allHistory : d === 365 ? copy.chartUi.lastYear : copy.chartUi.lastDays(d);

export function ChartDesignerTab() {
  const { state, dispatch } = useWorkspace();
  const r = state.chartDraft;
  const set = (draft: ChartRecipe, name?: string) => dispatch({ type: 'setChartDraft', draft, name });
  const term = useTerminalColors();
  const [focus, setFocus] = useState<string | null>(null);
  const hover = (id: string) => ({ onMouseEnter: () => setFocus(id), onMouseLeave: () => setFocus(null) });

  return (
    <>
      <header className="page-head">
        <h1>{copy.chartUi.title}</h1>
        <p>{copy.chartUi.intro}</p>
      </header>

      <div className="btn-row" style={{ marginBottom: 12 }} role="group" aria-label={copy.chartUi.presets}>
        {(Object.keys(CHART_PRESETS) as (keyof typeof CHART_PRESETS)[]).map((k) => (
          <button
            key={k}
            type="button"
            className="btn btn-small"
            onClick={() => set(applyThemeToChartRecipe(CHART_PRESETS[k], getTheme(state.themeId)), k)}
          >
            {copy.chartUi.presetLabels[k]}
          </button>
        ))}
      </div>

      <TermPreview
        lines={renderChartPreview(r, SAMPLE_CHART[r.metric])}
        title={`$ git ${state.chartDraftName || 'alias'}`}
        note={copy.chartUi.sample}
        bg={term.bg}
        fg={term.fg}
        focus={focus}
      />
      <CommandExplain parts={explainChart(r)} focus={focus} onFocus={setFocus} />

      <div className="designer">
        <section className="panel" aria-labelledby="copts">
          <h2 id="copts">{copy.log.options}</h2>
          <div className="field" {...hover('metric')}>
            <label htmlFor="cmetric">{copy.chartUi.metric}</label>
            <select id="cmetric" value={r.metric} onChange={(e) => set({ ...r, metric: e.target.value as ChartMetric })}>
              {CHART_METRICS.map((m) => <option key={m} value={m}>{metricLabel(m)}</option>)}
            </select>
          </div>
          <div className="field" {...hover('period')}>
            <label htmlFor="cperiod">{copy.chartUi.period}</label>
            <select id="cperiod" value={r.periodDays} onChange={(e) => set({ ...r, periodDays: Number(e.target.value) as ChartPeriod })}>
              {PERIODS.map((p) => <option key={p} value={p}>{periodLabel(p)}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="check" {...hover('merges')}>
              <input type="checkbox" checked={!r.merges} onChange={(e) => set({ ...r, merges: !e.target.checked })} />
              {copy.chartUi.noMerges}
            </label>
            <label className="check" {...hover('allBranches')}>
              <input type="checkbox" checked={r.allBranches} onChange={(e) => set({ ...r, allBranches: e.target.checked })} />
              {copy.log.all}
            </label>
          </div>
          {isRanked(r.metric) && (
            <label className="inline-field field" htmlFor="ctop" {...hover('top')}>
              {copy.chartUi.top}
              <input id="ctop" type="number" min={0} max={200} value={r.top} onChange={(e) => set({ ...r, top: Math.max(0, Math.min(200, Number(e.target.value) || 0)) })} />
            </label>
          )}
          <div className="opt-grid" {...hover('bar')}>
            <div className="field">
              <label htmlFor="cbar">{copy.chartUi.bar}</label>
              <select id="cbar" value={r.bar} onChange={(e) => set({ ...r, bar: e.target.value as BarChar })}>
                {BAR_CHARS.map((b) => <option key={b} value={b}>{b.repeat(4)}{b === '#' ? ' ' + copy.chartUi.worksEverywhere : ''}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="ccolor">{copy.log.color}</label>
              <div className="inline-field">
                <input id="ccolor" type="color" value={r.color || '#888888'} onChange={(e) => set({ ...r, color: e.target.value.toUpperCase() })} />
                <label className="check">
                  <input type="checkbox" checked={!r.color} onChange={(e) => set({ ...r, color: e.target.checked ? '' : '#8FE3B5' })} />
                  {copy.log.terminalColor}
                </label>
              </div>
            </div>
          </div>
          <label className="inline-field field" htmlFor="cwidth" {...hover('bar')}>
            {copy.chartUi.maxWidth}
            <input id="cwidth" type="number" min={10} max={80} value={r.maxWidth} onChange={(e) => set({ ...r, maxWidth: Math.max(10, Math.min(80, Number(e.target.value) || 40)) })} />
          </label>
          <div className="field">
            <label htmlFor="cterm">{copy.log.terminalBg}</label>
            <input id="cterm" type="color" value={state.terminalBg} onChange={(e) => dispatch({ type: 'setTerminalBg', color: e.target.value.toUpperCase() })} />
          </div>
        </section>

        <SaveAlias
          name={state.chartDraftName}
          onName={(n) => set(r, n)}
          type="chart"
          build={(name) => ({ name, value: buildChartAliasValue(r), type: 'chart', recipe: { kind: 'chart', chart: r } })}
          onLoad={(a) => {
            const rec = recipeOf(a);
            if (rec?.kind !== 'chart') return copy.log.loadFailed;
            set(rec.chart, a.name);
            return null;
          }}
        />
      </div>
    </>
  );
}

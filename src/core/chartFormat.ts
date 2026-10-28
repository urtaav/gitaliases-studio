import { cssColor, toSgr } from './colors';
import { copy } from '../i18n';
import type { CommandPart } from './explain';
import type { Segment } from './preview';
import type { ChartRow } from '../data/sampleChart';

export type ChartMetric = 'day' | 'week' | 'author' | 'file';
export type BarChar = '▇' | '█' | '■' | '#';
export type ChartPeriod = 0 | 7 | 30 | 60 | 90 | 365;

export const BAR_CHARS: readonly BarChar[] = ['▇', '█', '■', '#'];
export const PERIODS: readonly ChartPeriod[] = [7, 30, 60, 90, 365, 0];

export interface ChartRecipe {
  metric: ChartMetric;
  /** 0 = all history. */
  periodDays: ChartPeriod;
  merges: boolean;
  allBranches: boolean;
  /** Rows to keep for author/file charts; 0 = all. */
  top: number;
  bar: BarChar;
  /** '' terminal default or '#RRGGBB'. */
  color: string;
  maxWidth: number;
}

export const CHART_METRICS: readonly ChartMetric[] = ['day', 'week', 'author', 'file'];
export const metricLabel = (m: ChartMetric) => copy.core.chart.metrics[m];

const base: ChartRecipe = {
  metric: 'day',
  periodDays: 60,
  merges: true,
  allBranches: false,
  top: 0,
  bar: '▇',
  color: '#8FE3B5',
  maxWidth: 40,
};

export const CHART_PRESETS: { activity: ChartRecipe; authors: ChartRecipe; churn: ChartRecipe } = {
  activity: { ...base },
  authors: { ...base, metric: 'author', periodDays: 0, merges: false, top: 15 },
  churn: { ...base, metric: 'file', periodDays: 0, merges: true, top: 20 },
};

export const isRanked = (m: ChartMetric) => m === 'author' || m === 'file';

function gitOptions(r: ChartRecipe): string[] {
  return [
    r.allBranches && '--all',
    !r.merges && '--no-merges',
    r.periodDays > 0 && `--since=${r.periodDays}.days.ago`,
  ].filter(Boolean) as string[];
}

const SOURCE: Record<ChartMetric, string> = {
  day: '--date=short --format=%ad',
  week: '--date=format:%G-W%V --format=%ad',
  author: '--format=%an',
  file: '--name-only --format=',
};

function rankTail(r: ChartRecipe): string {
  if (!isRanked(r.metric)) return '';
  return ' | sort -rn' + (r.top > 0 ? ` | head -n ${r.top}` : '');
}

/**
 * Stores every row, then scales bars to maxWidth in END so big repos never overflow.
 * Only POSIX awk features and octal escapes, so it runs on gawk, mawk and BSD awk.
 */
function awkProgram(r: ChartRecipe): string {
  const sgr = r.color ? toSgr(r.color, []) : '';
  const bar = sgr ? String.raw`\033[${sgr}m%s\033[0m` : '%s';
  return (
    String.raw`{ c=$1; $1=""; sub(/^ +/, ""); n++; cnt[n]=c; lab[n]=$0; if (c>m) m=c; if (length($0)>w) w=length($0) } ` +
    // The empty-period message is written in the language active when the alias is built.
    `END { if (n==0) { print "${copy.core.chart.noCommits.replace(/["\\']/g, '')}"; exit } ` +
    // One block per commit while it fits; only scale down when the biggest row is wider than maxWidth.
    `for (i=1; i<=n; i++) { b=(m>${r.maxWidth}) ? int(cnt[i]*${r.maxWidth}/m) : cnt[i]; if (b<1) b=1; s=""; for (j=0; j<b; j++) s=s "${r.bar}"; ` +
    String.raw`printf "%-" w "s %5d ${bar}\n", lab[i], cnt[i], s } }`
  );
}

export function buildChartPipeline(r: ChartRecipe): string {
  const opts = gitOptions(r);
  const log = ['git log', ...opts, SOURCE[r.metric]].join(' ');
  const clean = r.metric === 'file' ? " | grep -v '^$'" : '';
  return `${log}${clean} | sort | uniq -c${rankTail(r)} | awk '${awkProgram(r)}'`;
}

export function buildChartAliasValue(r: ChartRecipe): string {
  return `!${buildChartPipeline(r)}`;
}

export function explainChart(r: ChartRecipe): CommandPart[] {
  const t = copy.core.chart;
  const parts: CommandPart[] = [{ text: 'git log', explanation: t.command, source: 'command' }];
  if (r.allBranches) parts.push({ text: '--all', explanation: t.all, source: 'allBranches' });
  if (!r.merges) parts.push({ text: '--no-merges', explanation: t.noMerges, source: 'merges' });
  if (r.periodDays > 0) {
    parts.push({ text: `--since=${r.periodDays}.days.ago`, explanation: t.since(r.periodDays), source: 'period' });
  }
  parts.push({ text: SOURCE[r.metric], explanation: t.what[r.metric], source: 'metric' });
  if (r.metric === 'file') parts.push({ text: "grep -v '^$'", explanation: t.dropEmpty, source: 'metric' });
  parts.push({ text: 'sort | uniq -c', explanation: t.group, source: 'metric' });
  if (isRanked(r.metric)) {
    parts.push({ text: 'sort -rn', explanation: t.biggest, source: 'metric' });
    if (r.top > 0) parts.push({ text: `head -n ${r.top}`, explanation: t.top(r.top), source: 'top' });
  }
  parts.push({ text: 'awk …', explanation: t.bars(r.bar, r.maxWidth), source: 'bar' });
  return parts;
}

/** Same scaling as the awk program, for the preview. */
export function renderChartPreview(r: ChartRecipe, rows: readonly ChartRow[]): Segment[][] {
  let list = [...rows];
  if (isRanked(r.metric)) {
    list.sort((a, b) => b.count - a.count);
    if (r.top > 0) list = list.slice(0, r.top);
  }
  if (!list.length) return [[{ text: copy.core.chart.noCommits, attrs: [] }]];
  const max = Math.max(...list.map((x) => x.count));
  const width = Math.max(...list.map((x) => x.label.length));
  return list.map((row) => {
    const len = Math.max(1, max > r.maxWidth ? Math.floor((row.count * r.maxWidth) / max) : row.count);
    return [
      { text: row.label.padEnd(width) + ' ', attrs: [], uid: 'metric' },
      { text: String(row.count).padStart(5) + ' ', attrs: [], uid: 'metric' },
      { text: r.bar.repeat(len), color: cssColor(r.color), attrs: [], uid: 'bar' },
    ];
  });
}

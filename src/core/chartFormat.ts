import { cssColor, toSgr } from './colors';
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

export const METRIC_LABELS: Record<ChartMetric, string> = {
  day: 'Commits per day',
  week: 'Commits per week',
  author: 'Commits per author',
  file: 'Most changed files',
};

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
    String.raw`END { if (n==0) { print "No commits in this period."; exit } ` +
    `for (i=1; i<=n; i++) { b=int(cnt[i]*${r.maxWidth}/m); if (b<1) b=1; s=""; for (j=0; j<b; j++) s=s "${r.bar}"; ` +
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
  const parts: CommandPart[] = [{ text: 'git log', explanation: 'Read the commit history', source: 'command' }];
  if (r.allBranches) parts.push({ text: '--all', explanation: 'Count commits on every branch', source: 'allBranches' });
  if (!r.merges) parts.push({ text: '--no-merges', explanation: 'Leave merge commits out', source: 'merges' });
  if (r.periodDays > 0) {
    parts.push({ text: `--since=${r.periodDays}.days.ago`, explanation: `Only the last ${r.periodDays} days`, source: 'period' });
  }
  const what: Record<ChartMetric, string> = {
    day: 'Print the date of each commit',
    week: 'Print the year and week number of each commit',
    author: 'Print the author of each commit',
    file: 'Print the files each commit changed',
  };
  parts.push({ text: SOURCE[r.metric], explanation: what[r.metric], source: 'metric' });
  if (r.metric === 'file') parts.push({ text: "grep -v '^$'", explanation: 'Drop empty lines', source: 'metric' });
  parts.push({ text: 'sort | uniq -c', explanation: 'Group equal lines and count them', source: 'metric' });
  if (isRanked(r.metric)) {
    parts.push({ text: 'sort -rn', explanation: 'Biggest counts first', source: 'metric' });
    if (r.top > 0) parts.push({ text: `head -n ${r.top}`, explanation: `Keep the top ${r.top}`, source: 'top' });
  }
  parts.push({
    text: 'awk …',
    explanation: `Draw one bar per row with "${r.bar}", scaled to at most ${r.maxWidth} characters`,
    source: 'bar',
  });
  return parts;
}

/** Same scaling as the awk program, for the preview. */
export function renderChartPreview(r: ChartRecipe, rows: readonly ChartRow[]): Segment[][] {
  let list = [...rows];
  if (isRanked(r.metric)) {
    list.sort((a, b) => b.count - a.count);
    if (r.top > 0) list = list.slice(0, r.top);
  }
  if (!list.length) return [[{ text: 'No commits in this period.', attrs: [] }]];
  const max = Math.max(...list.map((x) => x.count));
  const width = Math.max(...list.map((x) => x.label.length));
  return list.map((row) => {
    const len = Math.max(1, Math.floor((row.count * r.maxWidth) / max));
    return [
      { text: row.label.padEnd(width) + ' ', attrs: [], uid: 'metric' },
      { text: String(row.count).padStart(5) + ' ', attrs: [], uid: 'metric' },
      { text: r.bar.repeat(len), color: cssColor(r.color), attrs: [], uid: 'bar' },
    ];
  });
}

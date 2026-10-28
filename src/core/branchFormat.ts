import { cssColor, type ColorAttr } from './colors';
import { formatDate, fit, type Segment } from './preview';
import { newUid } from './logFormat';
import type { CommandPart } from './explain';
import type { Issue } from './types';
import type { SampleBranch } from '../data/sampleBranches';

export type BranchFieldKey = 'head' | 'name' | 'date' | 'author' | 'subject' | 'hash' | 'upstream' | 'track';
export type BranchDateFormat = 'short' | 'relative' | 'iso';

export const BRANCH_FIELDS: Record<BranchFieldKey, { label: string; explain: string }> = {
  head: { label: 'Current branch marker', explain: 'A * next to the branch you are on' },
  name: { label: 'Branch name', explain: 'The short branch name' },
  date: { label: 'Last commit date', explain: 'When the last commit on the branch was made' },
  author: { label: 'Last commit author', explain: 'Who made the last commit' },
  subject: { label: 'Last commit message', explain: 'The first line of the last commit message' },
  hash: { label: 'Last commit hash', explain: 'Short id of the last commit' },
  upstream: { label: 'Remote branch', explain: 'The remote branch it tracks, if any' },
  track: { label: 'Ahead / behind remote', explain: 'How many commits it is ahead of or behind its remote' },
};

export interface BranchField {
  uid: string;
  key: BranchFieldKey;
  color: string;
  attrs: ColorAttr[];
  width: number;
  align: 'left' | 'right' | 'middle';
  dateFormat: BranchDateFormat;
}

export type BranchSort = '-committerdate' | 'committerdate' | 'refname' | '-authordate';
export type BranchScope = 'local' | 'remote' | 'both';

export interface BranchRecipe {
  fields: BranchField[];
  /** ' ' means a single space with nothing around it. */
  separator: string;
  separatorColor: string;
  sort: BranchSort;
  scope: BranchScope;
  count: number;
}

export const SORT_LABELS: Record<BranchSort, string> = {
  '-committerdate': 'Most recent commit first',
  committerdate: 'Oldest commit first',
  refname: 'Name, A to Z',
  '-authordate': 'Most recently authored first',
};

export const SCOPE_LABELS: Record<BranchScope, string> = {
  local: 'My local branches',
  remote: 'Remote branches',
  both: 'Local and remote',
};

const SCOPE_REFS: Record<BranchScope, string> = {
  local: 'refs/heads/',
  remote: 'refs/remotes/',
  both: 'refs/heads/ refs/remotes/',
};

export function makeBranchField(key: BranchFieldKey, overrides: Partial<BranchField> = {}): BranchField {
  return { uid: newUid(), key, color: '', attrs: [], width: 0, align: 'left', dateFormat: 'short', ...overrides };
}

/** Same output as the classic `recent` alias. */
export const DEFAULT_BRANCH_RECIPE: BranchRecipe = {
  fields: [
    { uid: 'b-date', key: 'date', color: '', attrs: [], width: 0, align: 'left', dateFormat: 'short' },
    { uid: 'b-name', key: 'name', color: '', attrs: [], width: 0, align: 'left', dateFormat: 'short' },
  ],
  separator: ' ',
  separatorColor: '',
  sort: '-committerdate',
  scope: 'local',
  count: 0,
};

export function validateBranchSeparator(sep: string): Issue[] {
  return sep.includes("'")
    ? [{ code: 'invalid-separator', message: "The separator can't contain a single quote (')." }]
    : [];
}

function atom(f: BranchField): string {
  switch (f.key) {
    case 'head': return '%(HEAD)';
    case 'name': return '%(refname:short)';
    case 'date': return `%(committerdate:${f.dateFormat})`;
    case 'author': return '%(authorname)';
    case 'subject': return '%(contents:subject)';
    case 'hash': return '%(objectname:short)';
    case 'upstream': return '%(upstream:short)';
    case 'track': return '%(upstream:track)';
  }
}

function colorAtom(color: string, attrs: ColorAttr[]): string {
  const spec = [...attrs, ...(color && color !== 'normal' ? [color] : [])].join(' ');
  return spec ? `%(color:${spec})` : '';
}

function fieldFormat(f: BranchField): string {
  const color = colorAtom(f.color, f.attrs);
  let body = atom(f);
  if (f.width > 0) body = `%(align:${f.width},${f.align})${body}%(end)`;
  return color ? `${color}${body}%(color:reset)` : body;
}

function separatorFormat(r: BranchRecipe): string {
  if (r.separator === ' ') return ' ';
  if (r.separator === '') return '  ';
  const text = r.separator.replace(/%/g, '%%');
  const color = colorAtom(r.separatorColor, []);
  return ' ' + (color ? `${color}${text}%(color:reset)` : text) + ' ';
}

export function buildBranchFormat(r: BranchRecipe): string {
  return r.fields.map(fieldFormat).join(separatorFormat(r));
}

const usesColor = (r: BranchRecipe): boolean =>
  r.fields.some((f) => f.color || f.attrs.length) || (r.separatorColor !== '' && !['', ' '].includes(r.separator));

export function buildBranchAliasValue(r: BranchRecipe): string {
  // for-each-ref drops %(color:…) unless asked, even with color.ui=always; auto keeps pipes plain.
  const color = usesColor(r) ? ' --color=auto' : '';
  const count = r.count > 0 ? ` --count=${r.count}` : '';
  return `for-each-ref${color} --sort=${r.sort}${count} --format='${buildBranchFormat(r)}' ${SCOPE_REFS[r.scope]}`;
}

export function explainBranch(r: BranchRecipe): CommandPart[] {
  const parts: CommandPart[] = [
    { text: 'for-each-ref', explanation: 'List branches, one line each, in the format below', source: 'command' },
    ...(usesColor(r) ? [{ text: '--color=auto', explanation: 'Use the colors below when printing to a terminal', source: 'command' }] : []),
    { text: `--sort=${r.sort}`, explanation: `Order: ${SORT_LABELS[r.sort].toLowerCase()}`, source: 'sort' },
  ];
  if (r.count > 0) parts.push({ text: `--count=${r.count}`, explanation: `Show at most ${r.count} branches`, source: 'count' });
  for (const f of r.fields) {
    const extras = [
      f.color && `in ${f.color}`,
      f.attrs.length > 0 && f.attrs.join(' '),
      f.width > 0 && `${f.width} characters wide, aligned ${f.align}`,
    ].filter(Boolean);
    parts.push({
      text: fieldFormat(f),
      explanation: BRANCH_FIELDS[f.key].explain + (extras.length ? ` (${extras.join(', ')})` : ''),
      source: f.uid,
    });
  }
  parts.push({ text: SCOPE_REFS[r.scope], explanation: `Which branches: ${SCOPE_LABELS[r.scope].toLowerCase()}`, source: 'scope' });
  return parts;
}

function trackText(b: SampleBranch): string {
  const parts = [b.ahead && `ahead ${b.ahead}`, b.behind && `behind ${b.behind}`].filter(Boolean);
  return parts.length ? `[${parts.join(', ')}]` : '';
}

function fieldText(f: BranchField, b: SampleBranch): string {
  switch (f.key) {
    case 'head': return b.current ? '*' : ' ';
    case 'name': return b.name;
    case 'date': return formatDate(b.date, f.dateFormat === 'iso' ? 'iso' : f.dateFormat);
    case 'author': return b.author;
    case 'subject': return b.subject;
    case 'hash': return b.hash;
    case 'upstream': return b.upstream;
    case 'track': return trackText(b);
  }
}

const SORTERS: Record<BranchSort, (a: SampleBranch, b: SampleBranch) => number> = {
  '-committerdate': (a, b) => b.date.localeCompare(a.date),
  committerdate: (a, b) => a.date.localeCompare(b.date),
  refname: (a, b) => a.name.localeCompare(b.name),
  '-authordate': (a, b) => b.date.localeCompare(a.date),
};

export function renderBranchPreview(r: BranchRecipe, branches: readonly SampleBranch[]): Segment[][] {
  let list = branches.filter((b) => (r.scope === 'both' ? true : r.scope === 'remote' ? b.remote : !b.remote));
  list = [...list].sort(SORTERS[r.sort]);
  if (r.count > 0) list = list.slice(0, r.count);

  return list.map((b) => {
    const line: Segment[] = [];
    r.fields.forEach((f, i) => {
      if (i > 0) {
        if (r.separator === ' ' || r.separator === '') line.push({ text: r.separator === ' ' ? ' ' : '  ', attrs: [] });
        else {
          line.push({ text: ' ', attrs: [] });
          line.push({ text: r.separator, color: cssColor(r.separatorColor), attrs: [], uid: 'sep' });
          line.push({ text: ' ', attrs: [] });
        }
      }
      const align = f.align === 'middle' ? 'center' : f.align;
      line.push({ text: fit(fieldText(f, b), f.width, align, 'none'), color: cssColor(f.color), attrs: f.attrs, uid: f.uid });
    });
    return line;
  });
}

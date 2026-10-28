import { cssColor, type ColorAttr } from './colors';
import { formatDate, fit, type Segment } from './preview';
import { newUid } from './logFormat';
import { copy } from '../i18n';
import type { CommandPart } from './explain';
import type { Issue } from './types';
import type { SampleBranch } from '../data/sampleBranches';

export type BranchFieldKey = 'head' | 'name' | 'date' | 'author' | 'subject' | 'hash' | 'upstream' | 'track';
export type BranchDateFormat = 'short' | 'relative' | 'iso';

export const BRANCH_FIELD_KEYS: readonly BranchFieldKey[] = ['head', 'name', 'date', 'author', 'subject', 'hash', 'upstream', 'track'];
export const branchFieldText = (k: BranchFieldKey) => copy.core.branch.fields[k];

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

export const BRANCH_SORTS: readonly BranchSort[] = ['-committerdate', 'committerdate', 'refname', '-authordate'];
export const BRANCH_SCOPES: readonly BranchScope[] = ['local', 'remote', 'both'];
export const sortLabel = (s: BranchSort) => copy.core.branch.sorts[s];
export const scopeLabel = (s: BranchScope) => copy.core.branch.scopes[s];

export interface BranchRecipe {
  fields: BranchField[];
  /** ' ' means a single space with nothing around it. */
  separator: string;
  separatorColor: string;
  sort: BranchSort;
  scope: BranchScope;
  count: number;
}

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
  return sep.includes("'") ? [{ code: 'invalid-separator', message: copy.core.issues.separatorQuote }] : [];
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
  const t = copy.core.branch;
  const parts: CommandPart[] = [
    { text: 'for-each-ref', explanation: t.command, source: 'command' },
    ...(usesColor(r) ? [{ text: '--color=auto', explanation: t.color, source: 'command' }] : []),
    { text: `--sort=${r.sort}`, explanation: t.order(sortLabel(r.sort)), source: 'sort' },
  ];
  if (r.count > 0) parts.push({ text: `--count=${r.count}`, explanation: t.count(r.count), source: 'count' });
  for (const f of r.fields) {
    const extras = [
      f.color && copy.core.log.inColor(f.color),
      f.attrs.length > 0 && f.attrs.join(' '),
      f.width > 0 && t.alignedAs(f.width, f.align),
    ].filter(Boolean);
    parts.push({
      text: fieldFormat(f),
      explanation: t.fields[f.key].explain + (extras.length ? ` (${extras.join(', ')})` : ''),
      source: f.uid,
    });
  }
  parts.push({ text: SCOPE_REFS[r.scope], explanation: t.which(scopeLabel(r.scope)), source: 'scope' });
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
    case 'date': return formatDate(b.date, f.dateFormat);
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

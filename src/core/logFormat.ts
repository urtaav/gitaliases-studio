import { gitColorSpec, toSgr, type ColorAttr } from './colors';
import { fieldDef } from '../data/fields';
import type { Issue } from './types';

export type Align = 'left' | 'right' | 'center';
export type Trunc = 'none' | 'trunc' | 'ltrunc' | 'mtrunc';
export type Marker = '▶' | '●' | '★' | '»' | '*';

export const MARKERS: readonly Marker[] = ['▶', '●', '★', '»', '*'];

export interface LogField {
  uid: string;
  placeholder: string;
  /** '' terminal default, '#RRGGBB', a git named color, or 'auto'. */
  color: string;
  attrs: ColorAttr[];
  width: number;
  align: Align;
  trunc: Trunc;
}

export interface Highlight {
  enabled: boolean;
  marker: Marker;
  color: string;
  bold: boolean;
  pager: boolean;
}

export interface LogRecipe {
  fields: LogField[];
  separator: string;
  separatorColor: string;
  /** 'short' | 'relative' | 'iso' | 'rfc' | 'format:<strftime>' */
  dateFormat: string;
  graph: boolean;
  all: boolean;
  maxCount: number;
  highlight: Highlight;
}

let uidCounter = 0;
export const newUid = (): string => `f${Date.now().toString(36)}${(uidCounter++).toString(36)}`;

export function makeField(placeholder: string, overrides: Partial<LogField> = {}): LogField {
  return {
    uid: newUid(),
    placeholder,
    color: placeholder === '%d' || placeholder === '%D' ? 'auto' : '',
    attrs: [],
    width: 0,
    align: 'left',
    trunc: 'none',
    ...overrides,
  };
}

export const DEFAULT_RECIPE: LogRecipe = {
  fields: [
    { uid: 'hash', placeholder: '%h', color: '#E5C07B', attrs: [], width: 0, align: 'left', trunc: 'none' },
    { uid: 'date', placeholder: '%ad', color: '#8A919E', attrs: [], width: 0, align: 'left', trunc: 'none' },
    { uid: 'author', placeholder: '%an', color: '#61AFEF', attrs: [], width: 18, align: 'left', trunc: 'trunc' },
    { uid: 'subject', placeholder: '%s', color: '', attrs: [], width: 0, align: 'left', trunc: 'none' },
    { uid: 'refs', placeholder: '%d', color: 'auto', attrs: [], width: 0, align: 'left', trunc: 'none' },
  ],
  separator: '│',
  separatorColor: '#4B5263',
  dateFormat: 'short',
  graph: false,
  all: false,
  maxCount: 0,
  highlight: { enabled: true, marker: '▶', color: '#98C379', bold: true, pager: true },
};

export function validateSeparator(sep: string): Issue[] {
  return sep.includes("'")
    ? [{ code: 'invalid-separator', message: "The separator can't contain a single quote (')." }]
    : [];
}

export function validateDateFormat(fmt: string): Issue[] {
  return fmt.includes("'")
    ? [{ code: 'invalid-separator', message: "The date format can't contain a single quote (')." }]
    : [];
}

const ALIGN_PREFIX: Record<Align, string> = { left: '%<', right: '%>', center: '%><' };

function widthSpec(f: LogField): string {
  if (f.width <= 0) return '';
  return `${ALIGN_PREFIX[f.align]}(${f.width}${f.trunc === 'none' ? '' : ',' + f.trunc})`;
}

/** Field that receives the "my commits" marker: the first author-like field. */
export function markerField(r: LogRecipe): LogField | undefined {
  return r.fields.find((f) => fieldDef(f.placeholder)?.role === 'author');
}

/** %d brings its own leading space and %n breaks the line: no separator around them. */
export function needsSeparator(prev: LogField, next: LogField): boolean {
  return next.placeholder !== '%d' && next.placeholder !== '%n' && prev.placeholder !== '%n';
}

export function buildFormatString(r: LogRecipe): string {
  const mark = r.highlight.enabled ? markerField(r) : undefined;
  const sepText = r.separator.replace(/%/g, '%%');
  const sep = sepText
    ? ' ' + (r.separatorColor ? `%C(${r.separatorColor})${sepText}%C(reset)` : sepText) + ' '
    : '  ';

  let out = r.highlight.enabled && !mark ? '~~%ae~~' : '';
  r.fields.forEach((f, i) => {
    if (i > 0 && needsSeparator(r.fields[i - 1]!, f)) out += sep;
    if (f === mark) {
      // sed swaps the marker token for the right color at run time.
      out += '~~%ae~~' + widthSpec(f) + f.placeholder + '%C(reset)';
      return;
    }
    const color = gitColorSpec(f.color, f.attrs);
    const reset = color && f.color !== 'auto' ? '%C(reset)' : '';
    out += color + widthSpec(f) + f.placeholder + reset;
  });
  return out;
}

export function dateOption(dateFormat: string): string {
  return dateFormat.startsWith('format:')
    ? `--date=format:'${dateFormat.slice(7)}'`
    : `--date=${dateFormat}`;
}

export function logOptions(r: LogRecipe): string {
  return [
    r.graph && '--graph',
    r.all && '--all',
    r.maxCount > 0 && `-n ${r.maxCount}`,
    dateOption(r.dateFormat),
  ]
    .filter(Boolean)
    .join(' ');
}

export function buildLogAliasValue(r: LogRecipe): string {
  const fmt = buildFormatString(r);
  const opts = logOptions(r);
  if (!r.highlight.enabled) return `log ${opts} --pretty=format:'${fmt}'`;

  const h = r.highlight;
  const mark = markerField(r);
  const gap = ' '.repeat(h.marker.length + 1);
  // ESC is built with printf because "\x1b" in a sed replacement only works in GNU sed.
  const mine = `\${e}[${toSgr(h.color, h.bold ? ['bold'] : [])}m${h.marker} ` + (mark ? '' : '${e}[m');
  const others = mark ? `\${e}[${toSgr(mark.color, mark.attrs)}m${gap}` : gap;
  const pager = h.pager ? ' | less -RFX' : '';

  return (
    `!f() { e=$(printf '\\033'); me=$(git config user.email); ` +
    `git log --color=always ${opts} --pretty=format:'${fmt}' "$@" | ` +
    `sed -e "s/~~$me~~/${mine}/" -e "s/~~[^~]*~~/${others}/"${pager}; }; f`
  );
}

import { COLOR_ATTRS, fromSgr, type ColorAttr } from './colors';
import { FIELD_DEFS } from '../data/fields';
import {
  buildLogAliasValue,
  MARKERS,
  newUid,
  type Align,
  type LogField,
  type LogRecipe,
  type Marker,
  type Trunc,
} from './logFormat';

type Token =
  | { kind: 'color'; spec: string }
  | { kind: 'width'; align: Align; width: number; trunc: Trunc }
  | { kind: 'ph'; placeholder: string }
  | { kind: 'mark' }
  | { kind: 'text'; text: string };

// Longest first so '%G?' and '%an' win over shorter prefixes.
const PLACEHOLDERS = FIELD_DEFS.map((f) => f.placeholder).sort((a, b) => b.length - a.length);

function tokenize(fmt: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  const pushText = (t: string) => {
    const last = tokens[tokens.length - 1];
    if (last?.kind === 'text') last.text += t;
    else tokens.push({ kind: 'text', text: t });
  };
  while (i < fmt.length) {
    const rest = fmt.slice(i);
    if (rest.startsWith('~~%ae~~')) {
      tokens.push({ kind: 'mark' });
      i += 7;
    } else if (rest.startsWith('%C(')) {
      const end = rest.indexOf(')');
      if (end < 0) return null;
      tokens.push({ kind: 'color', spec: rest.slice(3, end) });
      i += end + 1;
    } else if (/^%(<|>|><)\(/.test(rest)) {
      const m = /^%(<|><|>)\((\d+)(?:,(trunc|ltrunc|mtrunc))?\)/.exec(rest);
      if (!m) return null;
      const align: Align = m[1] === '<' ? 'left' : m[1] === '>' ? 'right' : 'center';
      tokens.push({ kind: 'width', align, width: Number(m[2]), trunc: (m[3] as Trunc) ?? 'none' });
      i += m[0].length;
    } else if (rest.startsWith('%%')) {
      pushText('%');
      i += 2;
    } else if (rest.startsWith('%')) {
      const ph = PLACEHOLDERS.find((p) => rest.startsWith(p));
      if (!ph) return null;
      tokens.push({ kind: 'ph', placeholder: ph });
      i += ph.length;
    } else {
      pushText(rest[0]!);
      i += 1;
    }
  }
  return tokens;
}

function parseSpec(spec: string): { color: string; attrs: ColorAttr[] } {
  if (spec === 'auto') return { color: 'auto', attrs: [] };
  const attrs: ColorAttr[] = [];
  let color = '';
  for (const part of spec.split(/\s+/).filter(Boolean)) {
    if ((COLOR_ATTRS as readonly string[]).includes(part)) attrs.push(part as ColorAttr);
    else color = part;
  }
  return { color, attrs };
}

/** Reads a designer-built alias back into a recipe. Returns null for anything else. */
export function parseLogAliasValue(value: string): LogRecipe | null {
  try {
    return parse(value.trim());
  } catch {
    return null;
  }
}

function parse(v: string): LogRecipe | null {
  const highlight = v.startsWith('!');
  const fmtMatch = /--pretty=format:'([^']*)'/.exec(v);
  if (!fmtMatch) return null;

  const head = highlight
    ? /git log --color=always (.*?) --pretty=format:/.exec(v)?.[1]
    : /^log (.*?) --pretty=format:/.exec(v)?.[1];
  if (head === undefined) return null;

  // Options
  let opts = head;
  let dateFormat = 'default';
  const fmtDate = /--date=format:'([^']*)'/.exec(opts);
  if (fmtDate) {
    dateFormat = 'format:' + fmtDate[1];
    opts = opts.replace(fmtDate[0], '');
  }
  const plainDate = /--date=(\S+)/.exec(opts);
  if (plainDate) {
    dateFormat = plainDate[1]!;
    opts = opts.replace(plainDate[0], '');
  }
  const maxMatch = /-n (\d+)/.exec(opts);
  const maxCount = maxMatch ? Number(maxMatch[1]) : 0;
  if (maxMatch) opts = opts.replace(maxMatch[0], '');
  const graph = /(^|\s)--graph(\s|$)/.test(opts);
  const all = /(^|\s)--all(\s|$)/.test(opts);
  opts = opts.replace('--graph', '').replace('--all', '').trim();
  if (opts !== '') return null; // options we don't model

  const tokens = tokenize(fmtMatch[1]!);
  if (!tokens) return null;

  // Highlight settings come from the sed replacements.
  let marker: Marker = '▶';
  let hlColor = '';
  let hlBold = false;
  let othersStyle: { color: string; attrs: ColorAttr[] } = { color: '', attrs: [] };
  if (highlight) {
    const mine = /s\/~~\$me~~\/\$\{e\}\[([0-9;]*)m(.) /.exec(v);
    const others = /s\/~~\[\^~\]\*~~\/(?:\$\{e\}\[([0-9;]*)m)? *\//.exec(v);
    if (!mine) return null;
    const mineStyle = fromSgr(mine[1]!);
    hlColor = mineStyle.color;
    hlBold = mineStyle.attrs.includes('bold');
    if (!MARKERS.includes(mine[2] as Marker)) return null;
    marker = mine[2] as Marker;
    if (others?.[1] !== undefined) othersStyle = fromSgr(others[1]);
  }

  const fields: LogField[] = [];
  let separator = '';
  let separatorColor = '';
  let sepFound = false;
  let pending: Partial<LogField> = {};
  let marked = false;
  let between: Token[] = [];

  const flushBetween = () => {
    // Text between two fields: " %C(color)SEP%C(reset) " or two spaces.
    const text = between.filter((t) => t.kind === 'text').map((t) => (t as { text: string }).text).join('');
    const color = between.find((t) => t.kind === 'color' && t.spec !== 'reset') as { spec: string } | undefined;
    if (text !== '' && !sepFound) {
      separator = text.trim();
      separatorColor = separator ? (color?.spec ?? '') : '';
      sepFound = true;
    }
    between = [];
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    const next = tokens[i + 1];
    if (t.kind === 'mark') {
      marked = true;
    } else if (t.kind === 'color') {
      if (t.spec === 'reset') {
        if (fields.length && between.length === 0 && !pending.placeholder) continue; // end of a field
        between.push(t);
      } else if (next && (next.kind === 'width' || next.kind === 'ph')) {
        pending = { ...pending, ...parseSpec(t.spec) };
      } else {
        between.push(t);
      }
    } else if (t.kind === 'width') {
      pending = { ...pending, width: t.width, align: t.align, trunc: t.trunc };
    } else if (t.kind === 'text') {
      between.push(t);
    } else {
      if (fields.length) flushBetween();
      else between = [];
      const field: LogField = {
        uid: newUid(),
        placeholder: t.placeholder,
        color: pending.color ?? '',
        attrs: pending.attrs ?? [],
        width: pending.width ?? 0,
        align: pending.align ?? 'left',
        trunc: pending.trunc ?? 'none',
      };
      if (marked && FIELD_DEFS.find((d) => d.placeholder === t.placeholder)?.role === 'author') {
        field.color = othersStyle.color;
        field.attrs = othersStyle.attrs;
        marked = false;
      }
      fields.push(field);
      pending = {};
    }
  }
  if (!fields.length) return null;

  const recipe: LogRecipe = {
    fields,
    separator,
    separatorColor,
    dateFormat,
    graph,
    all,
    maxCount,
    highlight: {
      enabled: highlight,
      marker,
      color: hlColor || '#98C379',
      bold: hlBold,
      pager: highlight ? / \| less -RFX; \}; f$/.test(v) : true,
    },
  };

  // Only accept what we can reproduce exactly; anything else is edited as raw text.
  return buildLogAliasValue(recipe) === v ? recipe : null;
}

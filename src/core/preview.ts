import { cssColor, type ColorAttr } from './colors';
import { markerField, needsSeparator, type LogField, type LogRecipe } from './logFormat';
import { PREVIEW_NOW, type SampleCommit } from '../data/sampleCommits';

export interface Segment {
  text: string;
  color?: string;
  attrs: ColorAttr[];
  /** Field uid, or 'sep' for separators; used to highlight a field on hover. */
  uid?: string;
}

/** Same rules as git's %<(N,trunc) family: cut with "..", pad with spaces. */
export function fit(text: string, width: number, align: LogField['align'], trunc: LogField['trunc']): string {
  if (width <= 0) return text;
  if (text.length > width) {
    if (trunc === 'none') return text;
    const keep = Math.max(0, width - 2);
    if (trunc === 'ltrunc') return '..' + text.slice(text.length - keep);
    if (trunc === 'mtrunc') {
      const left = Math.floor(keep / 2);
      return text.slice(0, left) + '..' + text.slice(text.length - (keep - left));
    }
    return text.slice(0, keep) + '..';
  }
  const gap = width - text.length;
  if (align === 'right') return ' '.repeat(gap) + text;
  if (align === 'center') {
    const left = Math.floor(gap / 2);
    return ' '.repeat(left) + text + ' '.repeat(gap - left);
  }
  return text + ' '.repeat(gap);
}

const pad = (n: number) => String(n).padStart(2, '0');
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function relative(d: Date): string {
  const days = Math.round((new Date(PREVIEW_NOW).getTime() - d.getTime()) / 86_400_000);
  if (days < 1) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 14) return `${days} days ago`;
  if (days < 70) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

function strftime(fmt: string, d: Date): string {
  const map: Record<string, string> = {
    Y: String(d.getFullYear()), y: String(d.getFullYear()).slice(2), m: pad(d.getMonth() + 1),
    d: pad(d.getDate()), e: String(d.getDate()), H: pad(d.getHours()), M: pad(d.getMinutes()),
    S: pad(d.getSeconds()), b: MONTHS[d.getMonth()]!, a: DAYS[d.getDay()]!, '%': '%',
  };
  return fmt.replace(/%(.)/g, (m, k: string) => map[k] ?? m);
}

export function formatDate(iso: string, dateFormat: string): string {
  const d = new Date(iso);
  const ymd = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const hms = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  if (dateFormat.startsWith('format:')) return strftime(dateFormat.slice(7), d);
  switch (dateFormat) {
    case 'short': return ymd;
    case 'relative': return relative(d);
    case 'iso': return `${ymd} ${hms} -0600`;
    case 'rfc': return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} ${hms} -0600`;
    default: return `${DAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()} ${hms} ${d.getFullYear()} -0600`;
  }
}

function fieldText(ph: string, c: SampleCommit, r: LogRecipe, meName: string): string {
  const name = c.isMe ? meName || 'you' : c.authorName;
  switch (ph) {
    case '%h': return c.hash;
    case '%H': return c.fullHash;
    case '%p': return c.parents.join(' ');
    case '%P': return c.parents.map((p) => p + c.fullHash.slice(7)).join(' ');
    case '%t': return c.tree.slice(0, 7);
    case '%T': return c.tree;
    case '%an': case '%cn': return name;
    case '%ae': case '%ce': return c.authorEmail;
    case '%al': case '%cl': return c.authorEmail.split('@')[0]!;
    case '%ad': case '%cd': return formatDate(c.date, r.dateFormat);
    case '%ar': case '%cr': return formatDate(c.date, 'relative');
    case '%as': case '%cs': return formatDate(c.date, 'short');
    case '%s': return c.subject;
    case '%f': return c.subject.replace(/[^A-Za-z0-9.]+/g, '-').replace(/^-|-$/g, '');
    case '%b': return c.body;
    case '%B': return c.body ? `${c.subject}\n\n${c.body}` : c.subject;
    case '%d': return c.refs.length ? ` (${c.refs.join(', ')})` : '';
    case '%D': return c.refs.join(', ');
    case '%G?': return 'N';
    case '%n': return '\n';
    default: return ph;
  }
}

// Colors git uses for decorations with %C(auto).
const REF_PUNCT = '#C9A227';
function autoRefs(text: string, uid: string): Segment[] {
  if (!text) return [];
  const segs: Segment[] = [];
  const open = text.startsWith(' (');
  const inner = open ? text.slice(2, -1) : text;
  if (open) segs.push({ text: ' (', color: REF_PUNCT, attrs: [], uid });
  inner.split(', ').forEach((ref, i) => {
    if (i) segs.push({ text: ', ', color: REF_PUNCT, attrs: [], uid });
    if (ref.startsWith('HEAD -> ')) {
      segs.push({ text: 'HEAD', color: '#3FB8C9', attrs: ['bold'], uid });
      segs.push({ text: ' -> ', color: REF_PUNCT, attrs: [], uid });
      segs.push({ text: ref.slice(8), color: '#4FBF5F', attrs: ['bold'], uid });
    } else if (ref.startsWith('tag: ')) {
      segs.push({ text: ref, color: '#D9B84A', attrs: ['bold'], uid });
    } else {
      segs.push({ text: ref, color: '#E05561', attrs: ['bold'], uid });
    }
  });
  if (open) segs.push({ text: ')', color: REF_PUNCT, attrs: [], uid });
  return segs;
}

/** One array of segments per terminal line. */
export function renderPreview(r: LogRecipe, commits: readonly SampleCommit[], meName: string): Segment[][] {
  const lines: Segment[][] = [];
  const mark = r.highlight.enabled ? markerField(r) : undefined;
  const hl = r.highlight;
  const hlAttrs: ColorAttr[] = hl.bold ? ['bold'] : [];
  const gap = ' '.repeat(hl.marker.length + 1);

  for (const c of commits) {
    let line: Segment[] = [];
    const push = (s: Segment) => {
      // Split on newlines so %n and multi-line bodies start new terminal lines.
      const parts = s.text.split('\n');
      parts.forEach((p, i) => {
        if (i > 0) {
          lines.push(line);
          line = [];
        }
        if (p) line.push({ ...s, text: p });
      });
    };

    if (r.graph) push({ text: '* ', color: '#E05561', attrs: [] });
    if (hl.enabled && !mark) {
      push(c.isMe ? { text: hl.marker + ' ', color: cssColor(hl.color), attrs: hlAttrs } : { text: gap, attrs: [] });
    }

    r.fields.forEach((f, i) => {
      if (i > 0 && needsSeparator(r.fields[i - 1]!, f)) {
        if (r.separator) {
          push({ text: ' ', attrs: [] });
          push({ text: r.separator, color: cssColor(r.separatorColor), attrs: [], uid: 'sep' });
          push({ text: ' ', attrs: [] });
        } else {
          push({ text: '  ', attrs: [] });
        }
      }
      const raw = fieldText(f.placeholder, c, r, meName);
      const text = raw.includes('\n') ? raw : fit(raw, f.width, f.align, f.trunc);

      if (f === mark) {
        if (c.isMe) push({ text: hl.marker + ' ' + text, color: cssColor(hl.color), attrs: hlAttrs, uid: f.uid });
        else push({ text: gap + text, color: cssColor(f.color), attrs: f.attrs, uid: f.uid });
      } else if (f.color === 'auto' && (f.placeholder === '%d' || f.placeholder === '%D')) {
        autoRefs(text, f.uid).forEach(push);
      } else {
        push({ text, color: cssColor(f.color), attrs: f.attrs, uid: f.uid });
      }
    });
    lines.push(line);
  }
  return lines;
}

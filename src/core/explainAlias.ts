import { copy } from '../i18n';
import { explainBranch, branchFieldText, type BranchFieldKey } from './branchFormat';
import { explainChart } from './chartFormat';
import { explainLog } from './logFormat';
import { undoSituation, undoText } from './undo';
import { fieldLabel } from '../data/fields';
import type { CommandPart } from './explain';
import type { Recipe } from './types';

/** Splits on spaces outside quotes; quotes stay in the tokens. */
export function tokenize(s: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quote: string | null = null;
  for (const ch of s) {
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
    } else if (ch === "'" || ch === '"') {
      quote = ch;
      cur += ch;
    } else if (/\s/.test(ch)) {
      if (cur) out.push(cur);
      cur = '';
    } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

const unquote = (t: string) => t.replace(/^(['"])([\s\S]*)\1$/, '$2');
const short = (t: string) => (t.length > 70 ? t.slice(0, 67) + '…' : t);

const REF_ATOMS: [RegExp, BranchFieldKey][] = [
  [/^HEAD$/, 'head'],
  [/^refname/, 'name'],
  [/^(committer|author|creator)date/, 'date'],
  [/^authorname/, 'author'],
  [/^contents:subject|^subject/, 'subject'],
  [/^objectname/, 'hash'],
  [/^upstream:track/, 'track'],
  [/^upstream/, 'upstream'],
];

/** Plain names of the placeholders in a format string, or '' when it has none. */
export function describePlaceholders(fmt: string): string {
  const names: string[] = [];
  for (const m of fmt.matchAll(/%\(([^)]+)\)/g)) {
    const key = REF_ATOMS.find(([re]) => re.test(m[1]!))?.[1];
    if (key) names.push(branchFieldText(key).label);
  }
  for (const m of fmt.replace(/%\([^)]*\)/g, '').matchAll(/%([a-zA-Z][a-zA-Z?]?)/g)) {
    const two = '%' + m[1];
    const one = '%' + m[1]![0];
    const label = copy.core.fields[two] ? fieldLabel(two) : copy.core.fields[one] ? fieldLabel(one) : null;
    if (label) names.push(label);
  }
  return [...new Set(names)].join(', ');
}

let n = 0;
const part = (text: string, explanation: string): CommandPart => ({ text, explanation, source: `p${n++}` });

/** Explains `git <sub> <args…>` given the tokens after "git". */
export function explainGitTokens(tokens: string[]): CommandPart[] {
  const d = copy.dict;
  const [sub, ...rest] = tokens;
  if (!sub) return [];
  const flags = { ...d.flags['*'], ...(d.flags[sub] ?? {}) };
  const parts = [part(sub, d.sub[sub] ?? d.words.unknownSub(sub))];
  for (const tok of rest) {
    if (tok === '"$@"' || tok === '$@') {
      parts.push(part(tok, d.words.args));
      continue;
    }
    const eq = tok.indexOf('=');
    const key = tok.startsWith('-') && eq > 0 ? tok.slice(0, eq) : tok;
    const val = tok.startsWith('-') && eq > 0 ? unquote(tok.slice(eq + 1)) : '';
    let expl = flags[tok] ?? flags[key];
    const shows = describePlaceholders(val || unquote(tok));
    if (!expl) expl = tok.startsWith('-') ? d.words.option(key) : shows ? d.words.shows(shows) : d.words.argument(short(unquote(tok)));
    else if (shows) expl += ` — ${d.words.shows(shows)}`;
    parts.push(part(short(tok), expl));
  }
  return parts;
}

/** Splits a shell line on |, ||, && and ; outside quotes. */
function splitShell(s: string): { seg: string; op?: string }[] {
  const out: { seg: string; op?: string }[] = [];
  let cur = '';
  let quote: string | null = null;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!;
    if (quote) {
      if (ch === quote) quote = null;
      cur += ch;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      cur += ch;
      continue;
    }
    const two = s.slice(i, i + 2);
    const op = two === '&&' || two === '||' ? two : ch === '|' || ch === ';' ? ch : null;
    if (op) {
      out.push({ seg: cur.trim(), op });
      cur = '';
      i += op.length - 1;
    } else cur += ch;
  }
  if (cur.trim()) out.push({ seg: cur.trim() });
  return out.filter((x) => x.seg || x.op);
}

function explainSegment(seg: string): CommandPart[] {
  const d = copy.dict;
  const toks = tokenize(seg);
  if (toks[0] === 'git') {
    const parts = explainGitTokens(toks.slice(1));
    if (parts[0]) parts[0] = { ...parts[0], text: `git ${parts[0].text}` };
    return parts;
  }
  const pair = `${toks[0]} ${toks[1] ?? ''}`.trim();
  const tool = d.tools[pair] ?? d.tools[toks[0] ?? ''];
  return [part(short(seg), tool ?? d.words.runs(short(toks[0] ?? seg)))];
}

export function explainShellLine(cmd: string): CommandPart[] {
  const d = copy.dict;
  const fn = /^f\(\)\s*\{\s*([\s\S]*?);?\s*\}\s*;?\s*f\s*$/.exec(cmd.trim());
  if (fn) return [part('f() { … }; f', d.words.fn), ...explainShellLine(fn[1]!)];
  const parts: CommandPart[] = [];
  for (const { seg, op } of splitShell(cmd)) {
    if (seg) parts.push(...explainSegment(seg));
    if (op) parts.push(part(op, op === '|' ? d.words.pipe : op === '&&' ? d.words.and : op === '||' ? d.words.or : d.words.then));
  }
  return parts;
}

function explainRecipe(r: Recipe): CommandPart[] {
  switch (r.kind) {
    case 'log': return explainLog(r.log);
    case 'branches': return explainBranch(r.branches);
    case 'chart': return explainChart(r.chart);
    case 'undo': {
      const s = undoSituation(r.undo.situationId);
      return s ? [part(s.command, undoText(s.id).does)] : [];
    }
  }
}

const CONFIG_LINE = /^git\s+config\s+(?:--global\s+)?alias\.([A-Za-z][\w-]*)\s+(['"])([\s\S]*)\2\s*$/;

/**
 * Explains an alias value, a git command, or a pasted `git config --global alias.x "…"` line.
 * Designer-made aliases use their recipe for a more precise explanation.
 */
export function explainAlias(input: { value: string; recipe?: Recipe }): CommandPart[] {
  n = 0;
  const d = copy.dict;
  if (input.recipe) return explainRecipe(input.recipe);
  let v = input.value.trim();
  const config = CONFIG_LINE.exec(v);
  const prefix: CommandPart[] = [];
  if (config) {
    prefix.push(part(`git config --global alias.${config[1]}`, d.words.configLine(config[1]!)));
    v = config[2] === '"' ? config[3]!.replace(/\\(["\\$`])/g, '$1') : config[3]!;
  }
  if (!v) return prefix;
  if (v.startsWith('!')) return [...prefix, part('!', d.words.shell), ...explainShellLine(v.slice(1))];
  const toks = tokenize(v);
  return [...prefix, ...explainGitTokens(toks[0] === 'git' ? toks.slice(1) : toks)];
}

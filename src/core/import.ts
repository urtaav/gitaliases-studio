import { copy } from '../i18n';
import { detectRisk } from './risk';
import { inferType } from './validate';
import type { Alias, ParsedAlias } from './types';

export interface ImportResult {
  aliases: ParsedAlias[];
  /** Human-readable reasons for lines that were ignored. */
  skipped: string[];
}

function normalize(text: string): string {
  return text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
}

/** Parses the output of `git config --get-regexp alias` (one `alias.<name> <value>` per line). */
export function parseRegexpOutput(text: string): ImportResult {
  const aliases: ParsedAlias[] = [];
  const skipped: string[] = [];

  normalize(text)
    .split('\n')
    .forEach((raw, i) => {
      const line = raw.trim();
      if (!line) return;
      const match = /^alias\.([^\s]+)\s+(.*)$/i.exec(line);
      if (match) {
        aliases.push({ name: match[1]!, value: match[2]! });
      } else if (/^alias\.[^\s]+$/i.test(line)) {
        skipped.push(copy.core.importLines.noValue(i + 1, line.slice(6)));
      } else {
        skipped.push(copy.core.importLines.notAlias(i + 1));
      }
    });

  return { aliases, skipped };
}

const ESCAPES: Record<string, string> = { n: '\n', t: '\t', b: '\b', '"': '"', '\\': '\\' };

/**
 * Reads a value following git's config grammar: quotes toggle, backslash escapes,
 * `;`/`#` start a comment outside quotes, trailing backslash continues the line.
 * Returns the value and how many extra lines it consumed.
 */
function readValue(lines: string[], start: number, rest: string): { value: string; used: number } {
  let out = '';
  let pendingSpace = '';
  let quoted = false;
  let used = 0;
  let text = rest;

  for (;;) {
    let continued = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]!;
      if (ch === '\\') {
        const next = text[i + 1];
        if (next === undefined) {
          continued = true;
          break;
        }
        out += pendingSpace + (ESCAPES[next] ?? next);
        pendingSpace = '';
        i++;
      } else if (ch === '"') {
        out += pendingSpace;
        pendingSpace = '';
        quoted = !quoted;
      } else if (!quoted && (ch === ';' || ch === '#')) {
        break;
      } else if (!quoted && (ch === ' ' || ch === '\t')) {
        // Whitespace outside quotes is kept only between words.
        if (out !== '') pendingSpace += ch;
      } else {
        out += pendingSpace + ch;
        pendingSpace = '';
      }
    }
    if (!continued || start + used + 1 >= lines.length) break;
    used++;
    text = lines[start + used]!;
  }

  return { value: out, used };
}

/** Parses a .gitconfig file and keeps ONLY [alias] entries; other sections may hold secrets. */
export function parseGitconfig(text: string): ImportResult {
  const lines = normalize(text).split('\n');
  const aliases: ParsedAlias[] = [];
  const skipped: string[] = [];
  let inAlias = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) continue;

    const section = /^\[\s*([A-Za-z0-9.-]+)(\s+"[^"]*")?\s*\]/.exec(line);
    if (section) {
      inAlias = section[1]!.toLowerCase() === 'alias' && !section[2];
      continue;
    }
    if (!inAlias) continue;

    const entry = /^([A-Za-z][A-Za-z0-9-]*)\s*(=\s*(.*))?$/.exec(line);
    if (!entry) {
      skipped.push(copy.core.importLines.unreadable(i + 1));
      continue;
    }
    if (entry[2] === undefined) {
      skipped.push(copy.core.importLines.noValue(i + 1, entry[1]!));
      continue;
    }
    const { value, used } = readValue(lines, i, entry[3] ?? '');
    i += used;
    aliases.push({ name: entry[1]!, value });
  }

  return { aliases, skipped };
}

/** Turns parsed entries into workspace aliases. Later duplicates win, like in git. */
export function toAliases(parsed: ParsedAlias[]): Alias[] {
  const byName = new Map<string, Alias>();
  for (const p of parsed) {
    const name = p.name.toLowerCase();
    const risk = detectRisk(p.value);
    byName.set(name, { name, value: p.value, type: inferType(p.value), ...(risk ? { risk } : {}) });
  }
  return [...byName.values()];
}

import { describe, expect, test } from 'vitest';
import { parseGitconfig, parseRegexpOutput, toAliases } from '../../src/core/import';

describe('parseRegexpOutput', () => {
  const expected = [
    { name: 'st', value: 'status' },
    { name: 'lg', value: 'log --oneline --graph' },
  ];
  test('reads one alias per line', () => {
    expect(parseRegexpOutput('alias.st status\nalias.lg log --oneline --graph\n').aliases).toEqual(expected);
  });
  test('CRLF and blank lines', () => {
    expect(parseRegexpOutput('alias.st status\r\n\r\nalias.lg log --oneline --graph\r\n').aliases).toEqual(expected);
  });
  test('skips lines without value or that are not aliases', () => {
    const r = parseRegexpOutput('alias.x\nuser.name Someone\nalias.st status');
    expect(r.aliases).toEqual([{ name: 'st', value: 'status' }]);
    expect(r.skipped).toHaveLength(2);
  });
});

describe('parseGitconfig', () => {
  const value = (text: string) => parseGitconfig(`[alias]\n\tx = ${text}\n`).aliases[0]?.value;

  test('plain value', () => expect(parseGitconfig('[alias]\n\tst = status\n').aliases).toEqual([{ name: 'st', value: 'status' }]));
  test('quoted value with escaped quotes', () => expect(value('"!f() { echo \\"hi\\"; }; f"')).toBe('!f() { echo "hi"; }; f'));
  test('escapes', () => expect(value('"a\\\\b\\tc\\nd"')).toBe('a\\b\tc\nd'));
  test('inline comments outside quotes', () => {
    expect(value('checkout ; note')).toBe('checkout');
    expect(value('checkout # note')).toBe('checkout');
    expect(value('"a ; b"')).toBe('a ; b');
  });
  test('line continuation keeps whitespace like git does', () => {
    // Verified against `git config --file`: "log \⏎  --oneline" reads as "log   --oneline".
    expect(parseGitconfig('[alias]\n\tlg = log \\\n  --oneline\n').aliases[0]?.value).toBe('log   --oneline');
  });
  test('section name is case-insensitive and may repeat', () => {
    const r = parseGitconfig('[Alias]\n\ta = one\n[user]\n\tname = x\n[alias]\n\tb = two\n');
    expect(r.aliases.map((a) => a.name)).toEqual(['a', 'b']);
  });
  test('never returns other sections', () => {
    const r = parseGitconfig('[user]\n\temail = a@b.c\n[credential]\n\thelper = store\n[alias]\n\tst = status\n');
    expect(r.aliases).toEqual([{ name: 'st', value: 'status' }]);
    expect(JSON.stringify(r)).not.toContain('a@b.c');
    expect(JSON.stringify(r)).not.toContain('store');
  });
  test('Windows file with BOM and CRLF', () => {
    const lf = '[alias]\n\tst = status\n\tlg = "log --oneline"\n';
    const win = '﻿' + lf.replace(/\n/g, '\r\n');
    expect(parseGitconfig(win)).toEqual(parseGitconfig(lf));
  });
  test('subsections like [alias "x"] are not aliases', () => {
    expect(parseGitconfig('[alias "x"]\n\ty = z\n').aliases).toEqual([]);
  });
});

test('toAliases lowercases names and the last duplicate wins', () => {
  const r = toAliases([
    { name: 'LG', value: 'a' },
    { name: 'lg', value: 'b' },
  ]);
  expect(r).toEqual([{ name: 'lg', value: 'b', type: 'shortcut' }]);
});

import { describe, expect, test } from 'vitest';
import { describeAlias, inferType, validateName, validateValue } from '../../src/core/validate';

const codes = (issues: { code: string }[]) => issues.map((i) => i.code);

describe('validateName', () => {
  test('accepts a simple name', () => expect(validateName('st', [])).toEqual([]));
  test('rejects a leading digit', () => expect(codes(validateName('1st', []))).toEqual(['invalid-name']));
  test('rejects underscores', () => expect(codes(validateName('my_alias', []))).toEqual(['invalid-name']));
  test('duplicates ignore case', () => expect(codes(validateName('LG', ['lg']))).toEqual(['duplicate']));
  test('editing itself is not a duplicate', () => expect(validateName('lg', ['lg'], 'lg')).toEqual([]));
  test('built-in commands are rejected', () => {
    expect(codes(validateName('commit', []))).toEqual(['builtin']);
    expect(codes(validateName('status', []))).toEqual(['builtin']);
  });
});

test('validateValue rejects blank values', () => {
  expect(codes(validateValue('  '))).toEqual(['empty-value']);
  expect(validateValue('status')).toEqual([]);
});

describe('inferType', () => {
  test('shortcut', () => expect(inferType('status')).toBe('shortcut'));
  test('shell', () => expect(inferType('!git log --oneline')).toBe('shell'));
  test('plain log format', () => expect(inferType("log --date=short --pretty=format:'%h %s'")).toBe('log'));
  test('foreign function stays shell', () => expect(inferType('!f() { echo hi; }; f')).toBe('shell'));
  test('designer highlight alias', () =>
    expect(
      inferType(
        "!f() { me=$(git config user.email); git log --color=always --pretty=format:'~~%ae~~%an' \"$@\" | sed -e x; }; f",
      ),
    ).toBe('log'));
});

describe('describeAlias', () => {
  test('shortcut', () => expect(describeAlias({ name: 'co', value: 'checkout', type: 'shortcut' })).toBe('Runs git checkout'));
  test('shell', () => expect(describeAlias({ name: 'x', value: '!ls', type: 'shell' })).toBe('Runs a shell command'));
  test('log', () => expect(describeAlias({ name: 'x', value: 'log', type: 'log' })).toBe('Custom log view'));
  test('custom description wins', () =>
    expect(describeAlias({ name: 'x', value: 'y', type: 'shortcut', description: 'Mine' })).toBe('Mine'));
});

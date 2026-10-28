import { expect, test } from 'vitest';
import { buildCheatAliasValue, cheatAlias } from '../../src/core/cheat';
import { serializeAliasFile } from '../../src/core/aliasFile';
import { parseGitconfig } from '../../src/core/import';

test('descriptions become "#:" lines right above their alias', () => {
  const file = serializeAliasFile(
    [
      { name: 'st', value: 'status', description: 'Short status' },
      { name: 'co', value: 'checkout' },
    ],
    new Date('2026-10-28T00:00:00Z'),
  );
  expect(file).toContain('\tco = "checkout"\n\t#: Short status\n\tst = "status"\n');
});

test('git ignores the description lines', () => {
  const file = serializeAliasFile([{ name: 'st', value: 'status', description: 'multi\nline ; # text' }]);
  expect(file).toContain('\t#: multi line ; # text\n');
  expect(parseGitconfig(file).aliases).toEqual([{ name: 'st', value: 'status' }]);
});

test('cheat reads the alias file, or lists aliases when there is none', () => {
  const v = buildCheatAliasValue();
  expect(v.startsWith('!f() { if [ -f ~/.gitaliases ]; then awk ')).toBe(true);
  expect(v).toContain("else git config --get-regexp '^alias[.]'");
  expect(cheatAlias()).toMatchObject({ name: 'cheat', type: 'shell', description: 'List my aliases with their descriptions' });
});

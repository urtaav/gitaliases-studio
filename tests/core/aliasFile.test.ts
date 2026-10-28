import { expect, test } from 'vitest';
import { quoteConfigValue, serializeAliasFile } from '../../src/core/aliasFile';
import { parseGitconfig } from '../../src/core/import';
import { TRICKY_VALUES } from '../fixtures/trickyValues';

test('quoteConfigValue', () => {
  expect(quoteConfigValue('status')).toBe('"status"');
  expect(quoteConfigValue('say "hi" \\ ok')).toBe('"say \\"hi\\" \\\\ ok"');
  expect(quoteConfigValue('a\tb\nc')).toBe('"a\\tb\\nc"');
});

test('file layout', () => {
  const out = serializeAliasFile(
    [
      { name: 'st', value: 'status' },
      { name: 'co', value: 'checkout' },
    ],
    new Date('2026-10-28T00:00:00Z'),
  );
  const lines = out.split('\n');
  expect(lines[0]).toMatch(/^# .*GitAliases Studio.*2026-10-28/);
  expect(lines).toContain('[alias]');
  expect(out.indexOf('\tco = "checkout"')).toBeLessThan(out.indexOf('\tst = "status"'));
  expect(out.endsWith('\n')).toBe(true);
});

test('every tricky value survives a round trip through the file', () => {
  const parsed = parseGitconfig(serializeAliasFile(TRICKY_VALUES)).aliases;
  const byName = Object.fromEntries(parsed.map((a) => [a.name, a.value]));
  for (const t of TRICKY_VALUES) expect(byName[t.name]).toBe(t.value);
});

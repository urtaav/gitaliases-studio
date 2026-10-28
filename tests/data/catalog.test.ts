import { expect, test } from 'vitest';
import { CATALOG } from '../../src/data/catalog';
import { validateName } from '../../src/core/validate';

const entries = CATALOG.flatMap((g) => g.entries);

test('size and required aliases', () => {
  expect(entries.length).toBeGreaterThanOrEqual(28);
  expect(entries.length).toBeLessThanOrEqual(35);
  const names = entries.map((e) => e.name);
  for (const n of ['st', 'co', 'cb', 'br', 'undo', 'amend', 'unstage', 'last', 'lg', 'aliases']) {
    expect(names).toContain(n);
  }
});

test('names are valid, unique and not git commands', () => {
  const seen: string[] = [];
  for (const e of entries) {
    expect(validateName(e.name, seen), e.name).toEqual([]);
    seen.push(e.name);
  }
});

test('every entry is complete', () => {
  for (const e of entries) {
    expect(e.value.trim(), e.name).not.toBe('');
    expect(e.description, e.name).not.toBe('');
    expect(e.example, e.name).toMatch(/^git /);
  }
});

test('destructive aliases are marked as destructive', () => {
  for (const e of entries.filter((x) => /reset --hard|clean -f|checkout -- \./.test(x.value))) {
    expect(e.risk, e.name).toBe('destructive');
  }
});

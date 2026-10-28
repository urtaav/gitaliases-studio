import { expect, test } from 'vitest';
import { CATALOG } from '../../src/data/catalog';
import { validateName } from '../../src/core/validate';
import { buildBranchAliasValue, DEFAULT_BRANCH_RECIPE } from '../../src/core/branchFormat';
import { detectRisk } from '../../src/core/risk';

const entries = CATALOG.flatMap((g) => g.entries);

test('size and required aliases', () => {
  expect(entries.length).toBeGreaterThanOrEqual(30);
  expect(entries.length).toBeLessThanOrEqual(45);
  const names = entries.map((e) => e.name);
  for (const n of ['st', 'co', 'cb', 'br', 'undo', 'amend', 'unstage', 'last', 'lg', 'aliases', 'recent', 'activity', 'authors', 'churn', 'hist', 'reword', 'revert-last', 'cleanup']) {
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

test('designer entries resolve to a recipe and value', () => {
  for (const e of entries.filter((x) => x.designer)) {
    expect(e.recipe?.kind, e.name).toBe(e.designer);
  }
  expect(entries.find((e) => e.name === 'recent')!.value).toBe(buildBranchAliasValue(DEFAULT_BRANCH_RECIPE));
});

test('risk labels agree with what the commands do', () => {
  for (const e of entries) {
    const detected = detectRisk(e.value);
    if (detected === 'destructive') expect(e.risk, e.name).toBe('destructive');
    if (e.risk === 'destructive') expect(detected, e.name).toBe('destructive');
  }
  // Destructive catalog entries ask before running.
  for (const e of entries.filter((x) => x.risk === 'destructive')) expect(e.value, e.name).toContain('[y/N]');
});

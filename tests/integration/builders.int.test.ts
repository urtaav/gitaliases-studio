import { expect, test } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildBranchAliasValue, DEFAULT_BRANCH_RECIPE } from '../../src/core/branchFormat';
import { buildChartAliasValue, CHART_PRESETS } from '../../src/core/chartFormat';
import { buildUndoAliasValue } from '../../src/core/undo';
import { applyThemeToBranchRecipe, DEFAULT_THEME_ID, getTheme } from '../../src/data/themes';
import { makeRepo } from './repo';

const ANA = { name: 'Ana Lucía Hernández', email: 'ana@example.com' };
const KENJI = { name: 'Kenji', email: 'kenji@example.com' };
// Strip color codes so assertions read plain text.
const plain = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');

test('branch alias lists branches newest first, with slashes and a detached HEAD', () => {
  const repo = makeRepo('branches');
  repo.commit('one', ANA, '2026-01-01T10:00:00');
  repo.git(['branch', 'fix/x']);
  repo.git(['switch', '-q', '-c', 'feature/login']);
  repo.commit('two', ANA, '2026-03-01T10:00:00');
  repo.git(['switch', '-q', 'main']);
  repo.commit('three', KENJI, '2026-02-01T10:00:00');
  repo.git(['checkout', '-q', '--detach', 'HEAD']);
  repo.alias('recent', buildBranchAliasValue(DEFAULT_BRANCH_RECIPE));

  const r = repo.git(['recent']);
  expect(r.status, r.stderr).toBe(0);
  expect(r.stdout.trim().split('\n')).toEqual(['2026-03-01 feature/login', '2026-02-01 main', '2026-01-01 fix/x']);
}, 60_000);

test('themed branch alias prints its colors', () => {
  const repo = makeRepo('branchcolor');
  repo.commit('one', ANA, '2026-01-01T10:00:00');
  const themed = applyThemeToBranchRecipe(DEFAULT_BRANCH_RECIPE, getTheme(DEFAULT_THEME_ID));
  repo.alias('recent', buildBranchAliasValue(themed));
  // --color=auto in the alias means plain text in a pipe; the user's terminal gets colors.
  expect(repo.git(['recent']).stdout).not.toContain('\x1b[');
  const forced = repo.git(['recent', '--color=always']);
  expect(forced.status, forced.stderr).toBe(0);
  expect(forced.stdout).toContain('\x1b[38;2;');
  expect(plain(forced.stdout).trim()).toBe('2026-01-01 main');
}, 60_000);

test('author chart keeps full names: one block per commit, scaled only past the max width', () => {
  const repo = makeRepo('authors');
  for (let i = 0; i < 6; i++) repo.commit(`a${i}`, ANA, `2026-01-0${i + 1}T10:00:00`);
  repo.commit('k', KENJI, '2026-01-09T10:00:00');
  repo.alias('authors', buildChartAliasValue({ ...CHART_PRESETS.authors, maxWidth: 12 }));
  repo.alias('tight', buildChartAliasValue({ ...CHART_PRESETS.authors, maxWidth: 3 }));

  const r = repo.git(['authors']);
  expect(r.status, r.stderr).toBe(0);
  expect(r.stdout).toContain('\x1b[38;2;');
  const lines = plain(r.stdout).trim().split('\n');
  expect(lines).toHaveLength(2);
  expect(lines[0]).toMatch(/^Ana Lucía Hernández\s+6 ▇{6}$/);
  expect(lines[1]).toMatch(/^Kenji\s+1 ▇{1}$/);

  const tight = plain(repo.git(['tight']).stdout).trim().split('\n');
  expect(tight[0]).toMatch(/ 6 ▇{3}$/);
  expect(tight[1]).toMatch(/ 1 ▇{1}$/);
}, 60_000);

test('activity chart on a period without commits says so', () => {
  const repo = makeRepo('empty');
  repo.commit('old', KENJI, '2020-01-01T10:00:00');
  repo.alias('activity', buildChartAliasValue(CHART_PRESETS.activity));
  const r = repo.git(['activity']);
  expect(r.status, r.stderr).toBe(0);
  expect(r.stdout.trim()).toBe('No commits in this period.');
}, 60_000);

test('weekly and file charts run', () => {
  const repo = makeRepo('weekly');
  repo.commit('a', ANA, '2026-01-05T10:00:00', ['a.txt', '1']);
  repo.commit('b', ANA, '2026-01-06T10:00:00', ['a.txt', '2']);
  repo.commit('c', KENJI, '2026-01-14T10:00:00', ['b.txt', '1']);
  repo.alias('weekly', buildChartAliasValue({ ...CHART_PRESETS.activity, metric: 'week', periodDays: 0 }));
  repo.alias('churn', buildChartAliasValue(CHART_PRESETS.churn));

  const weeks = plain(repo.git(['weekly']).stdout).trim().split('\n');
  expect(weeks.map((l) => l.split(/\s+/)[0])).toEqual(['2026-W02', '2026-W03']);
  const files = plain(repo.git(['churn']).stdout).trim().split('\n');
  expect(files[0]).toMatch(/^a\.txt\s+2 /);
}, 60_000);

test.each([
  ['n\n', true],
  ['', true],
  ['y\n', false],
])('wipe with confirmation, answer %j keeps changes: %s', (answer, keeps) => {
  const repo = makeRepo('confirm');
  repo.commit('base', KENJI, '2026-01-01T10:00:00', ['f.txt', 'original']);
  writeFileSync(join(repo.dir, 'f.txt'), 'changed');
  repo.alias('wipe', buildUndoAliasValue({ situationId: 'wipe', confirm: true }));

  const r = repo.git(['wipe'], { input: answer });
  expect(r.stdout).toContain('[y/N]');
  expect(readFileSync(join(repo.dir, 'f.txt'), 'utf8')).toBe(keeps ? 'changed' : 'original');
}, 60_000);

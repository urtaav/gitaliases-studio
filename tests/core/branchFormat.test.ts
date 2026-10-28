import { describe, expect, test } from 'vitest';
import {
  buildBranchAliasValue,
  buildBranchFormat,
  DEFAULT_BRANCH_RECIPE,
  explainBranch,
  makeBranchField,
  renderBranchPreview,
  validateBranchSeparator,
  type BranchRecipe,
} from '../../src/core/branchFormat';
import { SAMPLE_BRANCHES } from '../../src/data/sampleBranches';

test('the default recipe is exactly the classic recent alias', () => {
  expect(buildBranchAliasValue(DEFAULT_BRANCH_RECIPE)).toBe(
    "for-each-ref --sort=-committerdate --format='%(committerdate:short) %(refname:short)' refs/heads/",
  );
});

describe('format atoms', () => {
  const one = (o: Parameters<typeof makeBranchField>[1], key: Parameters<typeof makeBranchField>[0] = 'name') =>
    buildBranchFormat({ ...DEFAULT_BRANCH_RECIPE, fields: [makeBranchField(key, o)] });
  test('color and attributes', () => expect(one({ color: '#E5C07B', attrs: ['bold'] })).toBe('%(color:bold #E5C07B)%(refname:short)%(color:reset)'));
  test('width and alignment', () => expect(one({ width: 20, align: 'right' })).toBe('%(align:20,right)%(refname:short)%(end)'));
  test('relative date', () => expect(one({ dateFormat: 'relative' }, 'date')).toBe('%(committerdate:relative)'));
  test('ahead/behind', () => expect(one({}, 'track')).toBe('%(upstream:track)'));
});

test('colored recipes ask for color, plain ones stay exactly the classic alias', () => {
  // for-each-ref ignores %(color:…) unless --color is given, even with color.ui=always.
  const colored = { ...DEFAULT_BRANCH_RECIPE, fields: [makeBranchField('name', { color: '#FF9EBE' })] };
  expect(buildBranchAliasValue(colored)).toMatch(/^for-each-ref --color=auto --sort=-committerdate /);
  const sepColored = { ...DEFAULT_BRANCH_RECIPE, separator: '│', separatorColor: '#4B5263' };
  expect(buildBranchAliasValue(sepColored)).toContain('--color=auto');
  expect(buildBranchAliasValue(DEFAULT_BRANCH_RECIPE)).not.toContain('--color');
});

test('options: sort, count and scope', () => {
  const r: BranchRecipe = { ...DEFAULT_BRANCH_RECIPE, sort: 'refname', count: 5, scope: 'both' };
  expect(buildBranchAliasValue(r)).toMatch(/^for-each-ref --sort=refname --count=5 --format='.*' refs\/heads\/ refs\/remotes\/$/);
});

test('separators: escaped %, colored, and quotes rejected', () => {
  const r = { ...DEFAULT_BRANCH_RECIPE, separator: '%', separatorColor: '#4B5263' };
  expect(buildBranchFormat(r)).toContain(' %(color:#4B5263)%%%(color:reset) ');
  expect(validateBranchSeparator("'")).toHaveLength(1);
});

test('explanation covers every field and option', () => {
  const sources = explainBranch(DEFAULT_BRANCH_RECIPE).map((p) => p.source);
  expect(sources).toEqual(['command', 'sort', 'b-date', 'b-name', 'scope']);
});

test('preview follows scope, order and count', () => {
  const lines = renderBranchPreview({ ...DEFAULT_BRANCH_RECIPE, count: 3 }, SAMPLE_BRANCHES);
  expect(lines).toHaveLength(3);
  expect(lines.map((l) => l.at(-1)!.text)).toEqual(['feature/search', 'main', 'fix/export-csv']);
  const remote = renderBranchPreview({ ...DEFAULT_BRANCH_RECIPE, scope: 'remote' }, SAMPLE_BRANCHES);
  expect(remote.every((l) => l.at(-1)!.text.startsWith('origin/'))).toBe(true);
});

import { describe, expect, test } from 'vitest';
import {
  buildFormatString,
  buildLogAliasValue,
  DEFAULT_RECIPE,
  makeField,
  validateSeparator,
  type LogRecipe,
} from '../../src/core/logFormat';

const noHl: LogRecipe = { ...DEFAULT_RECIPE, highlight: { ...DEFAULT_RECIPE.highlight, enabled: false } };

test('default format matches the original ltable prototype', () => {
  expect(buildFormatString(DEFAULT_RECIPE)).toBe(
    '%C(#E5C07B)%h%C(reset) %C(#4B5263)│%C(reset) %C(#8A919E)%ad%C(reset) %C(#4B5263)│%C(reset) ' +
      '~~%ae~~%<(18,trunc)%an%C(reset) %C(#4B5263)│%C(reset) %s%C(auto)%d',
  );
});

describe('width, alignment and truncation', () => {
  const fmt = (o: Parameters<typeof makeField>[1]) =>
    buildFormatString({ ...noHl, fields: [makeField('%an', o)] });
  test('left trunc', () => expect(fmt({ width: 18, trunc: 'trunc' })).toBe('%<(18,trunc)%an'));
  test('right', () => expect(fmt({ width: 18, align: 'right', trunc: 'trunc' })).toBe('%>(18,trunc)%an'));
  test('center', () => expect(fmt({ width: 18, align: 'center', trunc: 'mtrunc' })).toBe('%><(18,mtrunc)%an'));
  test('no truncation', () => expect(fmt({ width: 18 })).toBe('%<(18)%an'));
  test('width 0 adds nothing', () => expect(fmt({ width: 0 })).toBe('%an'));
  test('attributes and named colors', () => expect(fmt({ color: 'red', attrs: ['bold', 'ul'] })).toBe('%C(bold ul red)%an%C(reset)'));
});

test('separator: % is escaped and quotes are rejected', () => {
  expect(buildFormatString({ ...noHl, separator: '%', separatorColor: '' })).toContain(' %% ');
  expect(validateSeparator("'")).toHaveLength(1);
  expect(validateSeparator('|')).toEqual([]);
});

test('options and date formats', () => {
  expect(buildLogAliasValue(noHl)).toMatch(/^log --date=short --pretty=format:'/);
  const v = buildLogAliasValue({ ...noHl, graph: true, all: true, maxCount: 20, dateFormat: 'format:%d-%b %H:%M' });
  expect(v).toMatch(/^log --graph --all -n 20 --date=format:'%d-%b %H:%M' --pretty=format:'/);
  expect(v.startsWith('!')).toBe(false);
});

describe('highlight my commits', () => {
  test('uses a portable escape character, never \\x1b', () => {
    const v = buildLogAliasValue(DEFAULT_RECIPE);
    expect(v).toMatch(/^!f\(\) \{ e=\$\(printf '\\033'\); me=\$\(git config user\.email\); git log --color=always/);
    expect(v).toContain('${e}[1;38;2;152;195;121m▶ ');
    expect(v).not.toContain('\\x1b');
    expect(v.endsWith('| less -RFX; }; f')).toBe(true);
  });
  test('pager off', () => {
    const v = buildLogAliasValue({ ...DEFAULT_RECIPE, highlight: { ...DEFAULT_RECIPE.highlight, pager: false } });
    expect(v.endsWith('/"; }; f')).toBe(true);
  });
  test('without an author field the marker goes first', () => {
    const r = { ...DEFAULT_RECIPE, fields: DEFAULT_RECIPE.fields.filter((f) => f.placeholder !== '%an') };
    expect(buildFormatString(r).startsWith('~~%ae~~')).toBe(true);
  });
});

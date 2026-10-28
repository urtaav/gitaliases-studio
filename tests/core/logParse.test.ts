import { expect, test } from 'vitest';
import { buildLogAliasValue, DEFAULT_RECIPE, type LogRecipe } from '../../src/core/logFormat';
import { parseLogAliasValue } from '../../src/core/logParse';

const stripUids = (r: LogRecipe | null) => r && { ...r, fields: r.fields.map(({ uid: _uid, ...f }) => f) };

const variants: [string, LogRecipe][] = [
  ['default', DEFAULT_RECIPE],
  ['highlight off', { ...DEFAULT_RECIPE, highlight: { ...DEFAULT_RECIPE.highlight, enabled: false } }],
  ['graph + all + max', { ...DEFAULT_RECIPE, graph: true, all: true, maxCount: 30 }],
  ['custom date, no pager', {
    ...DEFAULT_RECIPE,
    dateFormat: 'format:%d-%b %H:%M',
    highlight: { ...DEFAULT_RECIPE.highlight, pager: false, marker: '★', bold: false, color: '#FF0000' },
  }],
];

test.each(variants)('round trip: %s', (_name, recipe) => {
  expect(stripUids(parseLogAliasValue(buildLogAliasValue(recipe)))).toEqual(stripUids(recipe));
});

test('values it did not build return null without throwing', () => {
  expect(parseLogAliasValue('status')).toBeNull();
  expect(parseLogAliasValue('!f() { echo hi; }; f')).toBeNull();
  expect(parseLogAliasValue("log --pretty=format:'%C(")).toBeNull();
  expect(parseLogAliasValue('log --oneline --graph')).toBeNull();
});

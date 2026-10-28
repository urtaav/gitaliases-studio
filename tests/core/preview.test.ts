import { describe, expect, test } from 'vitest';
import { fit, formatDate, renderPreview } from '../../src/core/preview';
import { DEFAULT_RECIPE, makeField } from '../../src/core/logFormat';
import { SAMPLE_COMMITS } from '../../src/data/sampleCommits';

describe('fit', () => {
  const name = 'Ana Lucía Hernández';
  test('trunc', () => expect(fit(name, 10, 'left', 'trunc')).toBe('Ana Lucí..'));
  test('ltrunc', () => expect(fit(name, 10, 'left', 'ltrunc')).toBe('..ernández'));
  test('mtrunc', () => expect(fit(name, 10, 'left', 'mtrunc')).toBe('Ana ..ndez'));
  test('pads left-aligned text on the right', () => expect(fit('ab', 5, 'left', 'trunc')).toBe('ab   '));
  test('right align', () => expect(fit('ab', 5, 'right', 'trunc')).toBe('   ab'));
  test('center', () => expect(fit('ab', 6, 'center', 'trunc')).toBe('  ab  '));
  test('no truncation never cuts', () => expect(fit(name, 5, 'left', 'none')).toBe(name));
});

test('relative dates', () => {
  expect(formatDate('2026-10-15T16:54:00', 'relative')).toBe('13 days ago');
  expect(formatDate('2026-10-15T16:54:00', 'short')).toBe('2026-10-15');
  expect(formatDate('2026-10-15T16:54:00', 'format:%d-%b %H:%M')).toBe('15-Oct 16:54');
});

describe('renderPreview', () => {
  const lines = renderPreview(DEFAULT_RECIPE, SAMPLE_COMMITS, 'Me');
  const text = (i: number) => lines[i]!.map((s) => s.text).join('');

  test('one line per commit', () => expect(lines).toHaveLength(SAMPLE_COMMITS.length));
  test('my commits get the marker and color', () => {
    const author = lines[0]!.find((s) => s.uid === 'author')!;
    expect(author.text.startsWith('▶ Me')).toBe(true);
    expect(author.color).toBe(DEFAULT_RECIPE.highlight.color);
  });
  test('other commits are padded to the same column', () => {
    expect(text(1).indexOf('│ feat')).toBe(text(0).indexOf('│ fix'));
  });
  test('%n starts a new line', () => {
    const r = { ...DEFAULT_RECIPE, fields: [makeField('%h'), makeField('%n'), makeField('%s')] };
    expect(renderPreview(r, SAMPLE_COMMITS.slice(0, 1), 'Me')).toHaveLength(2);
  });
});

import { describe, expect, test } from 'vitest';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { contrastRatio } from '../../src/core/contrast';
import { applyThemeToRecipe, THEMES } from '../../src/data/themes';
import { DEFAULT_RECIPE } from '../../src/core/logFormat';

const FORBIDDEN = [
  'dracula', 'one dark', 'nord', 'gruvbox', 'monokai', 'solarized', 'tokyo night',
  'catppuccin', 'rosé pine', 'rose pine', 'night owl', 'ayu', 'java', 'python', 'golang', 'rust',
];

test('contrastRatio', () => {
  expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
  expect(contrastRatio('#777777', '#777777')).toBe(1);
});

test('count, ids and modes', () => {
  expect(THEMES.length).toBeGreaterThanOrEqual(15);
  expect(THEMES.length).toBeLessThanOrEqual(20);
  const files = readdirSync(resolve('src/data/themes')).filter((f) => f.endsWith('.json'));
  expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length);
  expect(files.map((f) => f.replace('.json', '')).sort()).toEqual(THEMES.map((t) => t.id).sort());
  expect(THEMES.filter((t) => t.mode === 'light').length).toBeGreaterThanOrEqual(3);
  for (const fam of ['deity', 'creature', 'royalty', 'language']) {
    expect(THEMES.filter((t) => t.family === fam).length).toBeGreaterThanOrEqual(2);
  }
});

describe.each(THEMES.map((t) => [t.name, t] as const))('%s', (_name, t) => {
  test('colors are #RRGGBB', () => {
    for (const c of Object.values(t.colors)) expect(c).toMatch(/^#[0-9A-F]{6}$/i);
  });
  test('text roles are readable on its background', () => {
    for (const k of ['fg', 'hash', 'date', 'author', 'me', 'refs', 'subject'] as const) {
      expect(contrastRatio(t.colors[k], t.colors.bg), k).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrastRatio(t.colors.muted, t.colors.bg)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(t.colors.separator, t.colors.bg)).toBeGreaterThanOrEqual(1.5);
  });
  test('name is original', () => {
    for (const bad of FORBIDDEN) expect(t.name.toLowerCase()).not.toContain(bad);
  });
});

test('applyThemeToRecipe colors by role and keeps subject and refs', () => {
  const t = THEMES[0]!;
  const r = applyThemeToRecipe(DEFAULT_RECIPE, t);
  const by = (ph: string) => r.fields.find((f) => f.placeholder === ph)!.color;
  expect(by('%h')).toBe(t.colors.hash);
  expect(by('%an')).toBe(t.colors.author);
  expect(by('%s')).toBe('');
  expect(by('%d')).toBe('auto');
  expect(r.highlight.color).toBe(t.colors.me);
});

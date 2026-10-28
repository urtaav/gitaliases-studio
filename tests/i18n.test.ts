import { afterEach, expect, test } from 'vitest';
import { copy, detectLocale, setLocale } from '../src/copy';
import { LOCALES } from '../src/i18n';
import { getCatalog } from '../src/data/catalog';
import { buildUndoAliasValue, UNDO_SITUATIONS } from '../src/core/undo';
import { buildChartAliasValue, CHART_PRESETS } from '../src/core/chartFormat';

afterEach(() => setLocale('en'));

/** Every key path that holds a string or a function, so locales can be compared. */
function keys(o: unknown, prefix = ''): string[] {
  if (o === null || typeof o !== 'object') return [prefix];
  if (Array.isArray(o)) return [`${prefix}[${o.length}]`];
  return Object.entries(o).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

test('Spanish has exactly the same keys as English (catalog texts aside)', () => {
  const strip = (ks: string[]) => ks.filter((k) => !k.startsWith('catalogText') && !k.startsWith('catalogGroups'));
  expect(strip(keys(LOCALES.es)).sort()).toEqual(strip(keys(LOCALES.en)).sort());
});

test('the copy binding follows setLocale', () => {
  expect(copy.tabs.start).toBe('Start');
  setLocale('es');
  expect(copy.tabs.start).toBe('Inicio');
});

test('language detection', () => {
  expect(detectLocale('es-MX')).toBe('es');
  expect(detectLocale('es')).toBe('es');
  expect(detectLocale('en-US')).toBe('en');
  expect(detectLocale(undefined)).toBe('en');
});

test('every catalog alias and group has a Spanish text', () => {
  setLocale('es');
  for (const g of getCatalog()) {
    expect(LOCALES.es.catalogGroups[g.id], g.id).toBeTruthy();
    for (const e of g.entries) expect(LOCALES.es.catalogText[e.name], e.name).toBeTruthy();
  }
});

test('Spanish messages baked into aliases never break their quoting', () => {
  setLocale('es');
  for (const s of UNDO_SITUATIONS.filter((x) => x.risk === 'destructive')) {
    const v = buildUndoAliasValue({ situationId: s.id, confirm: true });
    expect(v).toContain('¿Continuar?');
    // The message sits between single quotes in the shell.
    expect(v.match(/'/g)!.length % 2).toBe(0);
  }
  expect(buildChartAliasValue(CHART_PRESETS.activity)).toContain('print "No hay commits en este periodo."');
});

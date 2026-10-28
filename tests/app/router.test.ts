import { expect, test } from 'vitest';
import { parseHash, routeToHash, tabTarget, topTabOf, type Route, type StudioTab } from '../../src/app/router';

test('parseHash', () => {
  expect(parseHash('#/studio/log')).toEqual({ page: 'studio', tab: 'log' });
  expect(parseHash('#/studio/branches')).toEqual({ page: 'studio', tab: 'branches' });
  expect(parseHash('#/nope')).toEqual({ page: 'landing' });
  expect(parseHash('#/studio/nope')).toEqual({ page: 'landing' });
  expect(parseHash('')).toEqual({ page: 'landing' });
});

test('routeToHash is the inverse of parseHash', () => {
  const tabs: StudioTab[] = ['start', 'aliases', 'catalog', 'log', 'branches', 'chart', 'undo', 'apply'];
  const routes: Route[] = [{ page: 'landing' }, ...tabs.map((tab) => ({ page: 'studio' as const, tab }))];
  for (const r of routes) expect(parseHash(routeToHash(r))).toEqual(r);
});

test('designers share one top tab', () => {
  for (const t of ['log', 'branches', 'chart', 'undo'] as const) expect(topTabOf(t)).toBe('designers');
  expect(topTabOf('apply')).toBe('apply');
  expect(tabTarget('designers')).toBe('log');
});

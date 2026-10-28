import { expect, test } from 'vitest';
import { parseHash, routeToHash, type Route } from '../../src/app/router';

test('parseHash', () => {
  expect(parseHash('#/studio/log')).toEqual({ page: 'studio', tab: 'log' });
  expect(parseHash('#/nope')).toEqual({ page: 'landing' });
  expect(parseHash('')).toEqual({ page: 'landing' });
});

test('routeToHash is the inverse of parseHash', () => {
  const routes: Route[] = [
    { page: 'landing' },
    { page: 'studio', tab: 'aliases' },
    { page: 'studio', tab: 'catalog' },
    { page: 'studio', tab: 'log' },
    { page: 'studio', tab: 'apply' },
  ];
  for (const r of routes) expect(parseHash(routeToHash(r))).toEqual(r);
});

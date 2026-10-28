import { beforeEach, expect, test } from 'vitest';
import { openInDesigner } from '../../src/studio/openInDesigner';
import type { Action } from '../../src/state/workspace';

beforeEach(() => {
  // navigate() only touches location.hash.
  (globalThis as unknown as { window: unknown }).window = { location: { hash: '' } };
});

test('opening an undo alias always asks for the risk again', () => {
  const actions: Action[] = [];
  openInDesigner(
    {
      name: 'wipe',
      value: 'x',
      type: 'undo',
      risk: 'destructive',
      recipe: { kind: 'undo', undo: { situationId: 'wipe', confirm: true } },
    },
    (a) => actions.push(a),
  );
  expect(actions).toEqual([
    { type: 'setUndoDraft', draft: { situationId: 'wipe', confirm: true, name: 'wipe', acknowledged: false } },
  ]);
  expect((globalThis as unknown as { window: { location: { hash: string } } }).window.location.hash).toBe('#/studio/undo');
});

test('aliases without a recipe or a parsable log value are not opened', () => {
  const actions: Action[] = [];
  expect(openInDesigner({ name: 'st', value: 'status', type: 'shortcut' }, (a) => actions.push(a))).toBe(false);
  expect(actions).toEqual([]);
});

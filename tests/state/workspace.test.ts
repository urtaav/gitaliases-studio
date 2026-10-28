import { describe, expect, test } from 'vitest';
import { diffAliases, initialState, reducer, type WorkspaceState } from '../../src/state/workspace';
import { loadWorkspace, saveWorkspace, STORAGE_KEY } from '../../src/state/persistence';
import type { Alias } from '../../src/core/types';

const a = (name: string, value: string): Alias => ({ name, value, type: 'shortcut' });
const kinds = (s: WorkspaceState) => diffAliases(s.baseline, s.aliases).map((c) => `${c.kind}:${c.name}`);
const imported = reducer(initialState(), { type: 'import', aliases: [a('st', 'status'), a('co', 'checkout')] });

describe('reducer + diff', () => {
  test('import has no changes', () => expect(kinds(imported)).toEqual([]));
  test('new alias is added', () =>
    expect(kinds(reducer(imported, { type: 'upsert', alias: a('lg', 'log') }))).toEqual(['added:lg']));
  test('edited value', () => {
    const s = reducer(imported, { type: 'upsert', alias: a('st', 'status -sb') });
    const [c] = diffAliases(s.baseline, s.aliases);
    expect(c).toMatchObject({ kind: 'edited', before: { value: 'status' }, after: { value: 'status -sb' } });
  });
  test('remove and restore', () => {
    const removed = reducer(imported, { type: 'remove', name: 'st' });
    expect(kinds(removed)).toEqual(['removed:st']);
    expect(kinds(reducer(removed, { type: 'restore', name: 'st' }))).toEqual([]);
  });
  test('removing an added alias leaves no change', () => {
    const s = reducer(reducer(imported, { type: 'upsert', alias: a('lg', 'log') }), { type: 'remove', name: 'lg' });
    expect(kinds(s)).toEqual([]);
  });
  test('rename is removed + added', () => {
    const s = reducer(imported, { type: 'upsert', alias: a('stat', 'status'), originalName: 'st' });
    expect(kinds(s)).toEqual(['added:stat', 'removed:st']);
  });
  test('markApplied clears changes', () => {
    const s = reducer(reducer(imported, { type: 'upsert', alias: a('lg', 'log') }), { type: 'markApplied' });
    expect(kinds(s)).toEqual([]);
  });
  test('shell follows the platform', () => {
    expect(initialState('Win32').shell).toBe('powershell');
    expect(initialState('MacIntel').shell).toBe('bash');
  });
});

describe('persistence never breaks the app', () => {
  const fresh = initialState();
  const store = (raw: string | null) => ({ getItem: () => raw });
  test('no storage', () => expect(loadWorkspace(null)).toEqual(fresh));
  test('corrupt JSON', () => expect(loadWorkspace(store('{not json'))).toEqual(fresh));
  test('old schema', () => expect(loadWorkspace(store('{"version":0}'))).toEqual(fresh));
  test('throwing storage', () =>
    expect(loadWorkspace({ getItem: () => { throw new Error('blocked'); } })).toEqual(fresh));
  test('save then load', () => {
    let saved = '';
    saveWorkspace({ setItem: (k, v) => { expect(k).toBe(STORAGE_KEY); saved = v; } }, imported);
    expect(loadWorkspace(store(saved))).toEqual(imported);
  });
  test('save with full storage does not throw', () => {
    expect(() => saveWorkspace({ setItem: () => { throw new Error('quota'); } }, imported)).not.toThrow();
  });
});

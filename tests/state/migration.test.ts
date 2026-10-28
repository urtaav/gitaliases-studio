import { expect, test } from 'vitest';
import { loadWorkspace, migrate } from '../../src/state/persistence';
import { initialState } from '../../src/state/workspace';
import { DEFAULT_RECIPE } from '../../src/core/logFormat';

const v1 = {
  version: 1,
  baseline: [{ name: 'st', value: 'status', type: 'shortcut' }],
  aliases: [
    { name: 'st', value: 'status', type: 'shortcut' },
    { name: 'ltable', value: 'log …', type: 'log', recipe: DEFAULT_RECIPE },
  ],
  imported: true,
  themeId: 'frost-regent',
  shell: 'powershell',
  terminalBg: '#000000',
  draft: DEFAULT_RECIPE,
  draftName: 'ltable',
  meName: 'Me',
};

test('a v1 workspace becomes v2 and keeps everything', () => {
  const s = migrate(v1)!;
  expect(s.version).toBe(2);
  expect(s.themeId).toBe('frost-regent');
  expect(s.meName).toBe('Me');
  expect(s.aliases[1]!.recipe).toEqual({ kind: 'log', log: DEFAULT_RECIPE });
  expect(s.aliases[0]!.recipe).toBeUndefined();
  // New v2 drafts are filled in.
  expect(s.branchDraft).toEqual(initialState().branchDraft);
  expect(s.chartDraft).toBeDefined();
  expect(s.undoDraft.situationId).toBe('undo');
});

test('loadWorkspace migrates v1 data from storage', () => {
  const s = loadWorkspace({ getItem: () => JSON.stringify(v1) });
  expect(s.version).toBe(2);
  expect(s.aliases).toHaveLength(2);
});

test('unknown versions start fresh', () => {
  expect(migrate({ ...v1, version: 99 })).toBeNull();
  expect(migrate(null)).toBeNull();
});

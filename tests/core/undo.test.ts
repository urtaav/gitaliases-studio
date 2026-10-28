import { expect, test } from 'vitest';
import { buildUndoAliasValue, undoRisk, UNDO_SITUATIONS } from '../../src/core/undo';
import { detectRisk } from '../../src/core/risk';

test('the seven situations from the design, in order', () => {
  expect(UNDO_SITUATIONS.map((s) => s.alias)).toEqual(['unstage', 'undo', 'reword', 'revert-last', 'discard', 'wipe', 'cleanup']);
});

test('confirm wrapper for wipe', () => {
  expect(buildUndoAliasValue({ situationId: 'wipe', confirm: true })).toBe(
    `!f() { printf '%s [y/N] ' 'This deletes all uncommitted changes. Continue?'; read a; [ "$a" = y ] && git reset --hard HEAD; }; f`,
  );
});

test('discard forwards file arguments only when wrapped', () => {
  expect(buildUndoAliasValue({ situationId: 'discard', confirm: true })).toContain('git restore "$@"; }; f');
  expect(buildUndoAliasValue({ situationId: 'discard', confirm: false })).toBe('restore');
});

test('safe situations never get a prompt', () => {
  expect(buildUndoAliasValue({ situationId: 'undo', confirm: true })).toBe('reset --soft HEAD~1');
});

test('risk levels match the command risk detector', () => {
  for (const s of UNDO_SITUATIONS) {
    expect(undoRisk(s.id), s.id).toBe(s.risk === 'safe' ? undefined : s.risk);
    if (s.risk === 'destructive') expect(detectRisk(s.command), s.id).toBe('destructive');
    if (s.risk === 'safe') expect(detectRisk(s.command), s.id).toBeUndefined();
  }
});

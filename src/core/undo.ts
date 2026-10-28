import type { Risk } from './types';

export type UndoRisk = 'safe' | 'careful' | 'destructive';

export interface UndoSituation {
  id: string;
  title: string;
  does: string;
  doesNot: string;
  avoidWhen: string;
  example: string;
  alias: string;
  command: string;
  risk: UndoRisk;
  /** Whether the command takes file paths after the alias. */
  takesArgs: boolean;
  confirmMessage?: string;
}

export interface UndoRecipe {
  situationId: string;
  confirm: boolean;
}

export const UNDO_SITUATIONS: readonly UndoSituation[] = [
  {
    id: 'unstage',
    title: "I staged files I didn't mean to",
    does: 'Takes the files out of the staging area. Your changes stay in the files.',
    doesNot: 'It does not change or delete anything you wrote.',
    avoidWhen: 'Nothing to watch out for.',
    example: 'git unstage app.js',
    alias: 'unstage',
    command: 'restore --staged',
    risk: 'safe',
    takesArgs: true,
  },
  {
    id: 'undo',
    title: 'I committed, but I want my changes back',
    does: 'Removes your last commit and leaves its changes staged, ready to commit again.',
    doesNot: 'It does not delete your changes.',
    avoidWhen: 'You already pushed that commit. Use "I already pushed a bad commit" instead.',
    example: 'git undo',
    alias: 'undo',
    command: 'reset --soft HEAD~1',
    risk: 'safe',
    takesArgs: false,
  },
  {
    id: 'reword',
    title: 'The message of my last commit is wrong',
    does: 'Opens your editor to rewrite the last commit message. Staged changes are added too.',
    doesNot: 'It does not touch older commits.',
    avoidWhen: 'You already pushed it: others would have the old version.',
    example: 'git reword',
    alias: 'reword',
    command: 'commit --amend',
    risk: 'careful',
    takesArgs: false,
  },
  {
    id: 'revert-last',
    title: 'I already pushed a bad commit',
    does: 'Creates a new commit that undoes the last one. History stays intact, so it is safe to push.',
    doesNot: 'It does not erase the bad commit; it cancels it.',
    avoidWhen: 'The last commit is not the bad one.',
    example: 'git revert-last',
    alias: 'revert-last',
    command: 'revert HEAD',
    risk: 'safe',
    takesArgs: false,
  },
  {
    id: 'discard',
    title: 'Throw away my changes in a file',
    does: 'Puts the files back as they were in the last commit.',
    doesNot: 'It cannot bring the discarded changes back.',
    avoidWhen: 'You might still need those changes. Commit or stash them first.',
    example: 'git discard app.js',
    alias: 'discard',
    command: 'restore',
    risk: 'destructive',
    takesArgs: true,
    confirmMessage: 'This throws away your changes in those files. Continue?',
  },
  {
    id: 'wipe',
    title: 'Reset everything to the last commit',
    does: 'Throws away every uncommitted change in tracked files.',
    doesNot: 'It does not remove new files you never added (see "Delete new files").',
    avoidWhen: 'You have any work you have not committed and still want.',
    example: 'git wipe',
    alias: 'wipe',
    command: 'reset --hard HEAD',
    risk: 'destructive',
    takesArgs: false,
    confirmMessage: 'This deletes all uncommitted changes. Continue?',
  },
  {
    id: 'cleanup',
    title: 'Delete new files I never added',
    does: 'Deletes untracked files and folders from your project.',
    doesNot: 'It does not touch files git already tracks.',
    avoidWhen: 'You created files you want to keep but have not added yet.',
    example: 'git cleanup',
    alias: 'cleanup',
    command: 'clean -fd',
    risk: 'destructive',
    takesArgs: false,
    confirmMessage: 'This deletes untracked files for good. Continue?',
  },
];

export const undoSituation = (id: string): UndoSituation | undefined => UNDO_SITUATIONS.find((s) => s.id === id);

export function buildUndoAliasValue(r: UndoRecipe): string {
  const s = undoSituation(r.situationId);
  if (!s) return '';
  if (!r.confirm || !s.confirmMessage) return s.command;
  // Only "y" runs it; "n", Enter or a closed input do nothing.
  const args = s.takesArgs ? ' "$@"' : '';
  return `!f() { printf '%s [y/N] ' '${s.confirmMessage}'; read a; [ "$a" = y ] && git ${s.command}${args}; }; f`;
}

export function undoRisk(situationId: string): Risk | undefined {
  const r = undoSituation(situationId)?.risk;
  return r === 'safe' ? undefined : r;
}

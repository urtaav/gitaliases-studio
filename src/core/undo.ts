import { copy } from '../i18n';
import type { Risk } from './types';

export type UndoRisk = 'safe' | 'careful' | 'destructive';

export interface UndoSituation {
  id: string;
  example: string;
  alias: string;
  command: string;
  risk: UndoRisk;
  /** Whether the command takes file paths after the alias. */
  takesArgs: boolean;
}

export interface UndoRecipe {
  situationId: string;
  confirm: boolean;
}

export const UNDO_SITUATIONS: readonly UndoSituation[] = [
  { id: 'unstage', example: 'git unstage app.js', alias: 'unstage', command: 'restore --staged', risk: 'safe', takesArgs: true },
  { id: 'undo', example: 'git undo', alias: 'undo', command: 'reset --soft HEAD~1', risk: 'safe', takesArgs: false },
  { id: 'reword', example: 'git reword', alias: 'reword', command: 'commit --amend', risk: 'careful', takesArgs: false },
  { id: 'revert-last', example: 'git revert-last', alias: 'revert-last', command: 'revert HEAD', risk: 'safe', takesArgs: false },
  { id: 'discard', example: 'git discard app.js', alias: 'discard', command: 'restore', risk: 'destructive', takesArgs: true },
  { id: 'wipe', example: 'git wipe', alias: 'wipe', command: 'reset --hard HEAD', risk: 'destructive', takesArgs: false },
  { id: 'cleanup', example: 'git cleanup', alias: 'cleanup', command: 'clean -fd', risk: 'destructive', takesArgs: false },
];

export const undoSituation = (id: string): UndoSituation | undefined => UNDO_SITUATIONS.find((s) => s.id === id);

/** Title, what it does / doesn't, when to avoid it, and the confirm prompt, in the active language. */
export const undoText = (id: string) => copy.core.undo[id]!;

export function buildUndoAliasValue(r: UndoRecipe): string {
  const s = undoSituation(r.situationId);
  if (!s) return '';
  if (!r.confirm || s.risk !== 'destructive') return s.command;
  // Only "y" runs it; "n", Enter or a closed input do nothing. The prompt can't hold a single quote.
  const message = undoText(s.id).confirm.replace(/'/g, '');
  const args = s.takesArgs ? ' "$@"' : '';
  return `!f() { printf '%s [y/N] ' '${message}'; read a; [ "$a" = y ] && git ${s.command}${args}; }; f`;
}

export function undoRisk(situationId: string): Risk | undefined {
  const r = undoSituation(situationId)?.risk;
  return r === 'safe' ? undefined : r;
}

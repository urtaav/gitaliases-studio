import type { Dispatch } from 'react';
import { parseLogAliasValue } from '../core/logParse';
import { navigate } from '../app/router';
import type { Action } from '../state/workspace';
import type { Alias, Recipe } from '../core/types';

/** The recipe an alias can be designed from, if any. Hand-written log aliases are parsed. */
export function recipeOf(a: Alias): Recipe | null {
  if (a.recipe) return a.recipe;
  if (a.type === 'log') {
    const log = parseLogAliasValue(a.value);
    return log ? { kind: 'log', log } : null;
  }
  return null;
}

/** Loads the alias into its designer and goes there. Returns false if it can't be designed. */
export function openInDesigner(a: Alias, dispatch: Dispatch<Action>): boolean {
  const r = recipeOf(a);
  if (!r) return false;
  switch (r.kind) {
    case 'log':
      dispatch({ type: 'setDraft', draft: r.log, name: a.name });
      navigate({ page: 'studio', tab: 'log' });
      break;
    case 'branches':
      dispatch({ type: 'setBranchDraft', draft: r.branches, name: a.name });
      navigate({ page: 'studio', tab: 'branches' });
      break;
    case 'chart':
      dispatch({ type: 'setChartDraft', draft: r.chart, name: a.name });
      navigate({ page: 'studio', tab: 'chart' });
      break;
    case 'undo':
      dispatch({ type: 'setUndoDraft', draft: { ...r.undo, name: a.name } });
      navigate({ page: 'studio', tab: 'undo' });
      break;
  }
  return true;
}

import type { LogRecipe } from './logFormat';
import type { Recipe } from './recipe';

export type { LogRecipe, Recipe };

export type AliasType = 'shortcut' | 'shell' | 'log' | 'branches' | 'chart' | 'undo';

/** 'careful' rewrites history; 'destructive' can delete work. */
export type Risk = 'careful' | 'destructive';

export interface Alias {
  name: string;
  value: string;
  type: AliasType;
  description?: string;
  recipe?: Recipe;
  risk?: Risk;
}

export interface ParsedAlias {
  name: string;
  value: string;
}

export type Shell = 'powershell' | 'bash' | 'cmd';

export type ChangeKind = 'added' | 'edited' | 'removed';

export interface Change {
  kind: ChangeKind;
  name: string;
  before?: Alias;
  after?: Alias;
}

export type IssueCode = 'invalid-name' | 'duplicate' | 'builtin' | 'empty-value' | 'invalid-separator';

export interface Issue {
  code: IssueCode;
  message: string;
}

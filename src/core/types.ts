import type { LogRecipe } from './logFormat';

export type { LogRecipe };

export type AliasType = 'shortcut' | 'shell' | 'log';

export interface Alias {
  name: string;
  value: string;
  type: AliasType;
  description?: string;
  recipe?: LogRecipe;
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

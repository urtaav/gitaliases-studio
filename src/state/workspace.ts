import { DEFAULT_RECIPE, type LogRecipe } from '../core/logFormat';
import { applyThemeToRecipe, DEFAULT_THEME_ID, getTheme } from '../data/themes';
import type { Alias, Change, Shell } from '../core/types';

export interface WorkspaceState {
  version: 1;
  baseline: Alias[];
  aliases: Alias[];
  imported: boolean;
  themeId: string;
  shell: Shell;
  terminalBg: string;
  draft: LogRecipe;
  meName: string;
}

export type Action =
  | { type: 'import'; aliases: Alias[] }
  | { type: 'upsert'; alias: Alias; originalName?: string }
  | { type: 'remove'; name: string }
  | { type: 'restore'; name: string }
  | { type: 'markApplied' }
  | { type: 'setTheme'; themeId: string }
  | { type: 'setShell'; shell: Shell }
  | { type: 'setTerminalBg'; color: string }
  | { type: 'setDraft'; draft: LogRecipe }
  | { type: 'setMeName'; name: string }
  | { type: 'reset' };

export function initialState(platform: string = ''): WorkspaceState {
  const theme = getTheme(DEFAULT_THEME_ID);
  return {
    version: 1,
    baseline: [],
    aliases: [],
    imported: false,
    themeId: theme.id,
    shell: /win/i.test(platform) ? 'powershell' : 'bash',
    terminalBg: theme.colors.bg,
    draft: applyThemeToRecipe(DEFAULT_RECIPE, theme),
    meName: 'you',
  };
}

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export function reducer(s: WorkspaceState, a: Action): WorkspaceState {
  switch (a.type) {
    case 'import':
      return { ...s, baseline: a.aliases, aliases: a.aliases, imported: true };
    case 'upsert': {
      const key = a.originalName ?? a.alias.name;
      const exists = s.aliases.some((x) => same(x.name, key));
      const aliases = exists
        ? s.aliases.map((x) => (same(x.name, key) ? a.alias : x))
        : [...s.aliases, a.alias];
      return { ...s, aliases };
    }
    case 'remove':
      return { ...s, aliases: s.aliases.filter((x) => !same(x.name, a.name)) };
    case 'restore': {
      const original = s.baseline.find((x) => same(x.name, a.name));
      if (!original || s.aliases.some((x) => same(x.name, a.name))) return s;
      return { ...s, aliases: [...s.aliases, original] };
    }
    case 'markApplied':
      return { ...s, baseline: s.aliases };
    case 'setTheme': {
      const theme = getTheme(a.themeId);
      return {
        ...s,
        themeId: theme.id,
        terminalBg: theme.colors.bg,
        draft: applyThemeToRecipe(s.draft, theme),
      };
    }
    case 'setShell':
      return { ...s, shell: a.shell };
    case 'setTerminalBg':
      return { ...s, terminalBg: a.color };
    case 'setDraft':
      return { ...s, draft: a.draft };
    case 'setMeName':
      return { ...s, meName: a.name };
    case 'reset':
      return initialState(s.shell === 'powershell' ? 'Win' : '');
  }
}

/** What applying would change, grouped added → edited → removed, each sorted by name. */
export function diffAliases(baseline: Alias[], aliases: Alias[]): Change[] {
  const base = new Map(baseline.map((a) => [a.name.toLowerCase(), a]));
  const cur = new Map(aliases.map((a) => [a.name.toLowerCase(), a]));
  const added: Change[] = [];
  const edited: Change[] = [];
  const removed: Change[] = [];

  for (const [key, after] of cur) {
    const before = base.get(key);
    if (!before) added.push({ kind: 'added', name: after.name, after });
    else if (before.value !== after.value) edited.push({ kind: 'edited', name: after.name, before, after });
  }
  for (const [key, before] of base) {
    if (!cur.has(key)) removed.push({ kind: 'removed', name: before.name, before });
  }
  const byName = (x: Change, y: Change) => x.name.localeCompare(y.name);
  return [...added.sort(byName), ...edited.sort(byName), ...removed.sort(byName)];
}

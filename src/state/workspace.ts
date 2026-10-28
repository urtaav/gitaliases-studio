import { DEFAULT_RECIPE, type LogRecipe } from '../core/logFormat';
import { DEFAULT_BRANCH_RECIPE, type BranchRecipe } from '../core/branchFormat';
import { CHART_PRESETS, type ChartRecipe } from '../core/chartFormat';
import type { UndoRecipe } from '../core/undo';
import { detectLocale, type Locale } from '../i18n';
import {
  applyThemeToBranchRecipe,
  applyThemeToChartRecipe,
  applyThemeToRecipe,
  DEFAULT_THEME_ID,
  getTheme,
} from '../data/themes';
import type { Alias, Change, Shell } from '../core/types';

export interface WorkspaceState {
  version: 2;
  baseline: Alias[];
  aliases: Alias[];
  imported: boolean;
  themeId: string;
  shell: Shell;
  terminalBg: string;
  /** Log designer draft and the alias name it saves to. */
  draft: LogRecipe;
  draftName: string;
  branchDraft: BranchRecipe;
  branchDraftName: string;
  chartDraft: ChartRecipe;
  chartDraftName: string;
  undoDraft: UndoDraft;
  meName: string;
  locale: Locale;
}

export type UndoDraft = UndoRecipe & { name: string; acknowledged: boolean };

export type Action =
  | { type: 'import'; aliases: Alias[] }
  | { type: 'upsert'; alias: Alias; originalName?: string }
  | { type: 'remove'; name: string }
  | { type: 'restore'; name: string }
  | { type: 'markApplied' }
  | { type: 'setTheme'; themeId: string }
  | { type: 'setShell'; shell: Shell }
  | { type: 'setTerminalBg'; color: string }
  | { type: 'setDraft'; draft: LogRecipe; name?: string }
  | { type: 'setBranchDraft'; draft: BranchRecipe; name?: string }
  | { type: 'setChartDraft'; draft: ChartRecipe; name?: string }
  | { type: 'setUndoDraft'; draft: Partial<UndoDraft> }
  | { type: 'setMeName'; name: string }
  | { type: 'setLocale'; locale: Locale }
  | { type: 'reset' };

export function initialState(platform: string = '', language: string = ''): WorkspaceState {
  const theme = getTheme(DEFAULT_THEME_ID);
  return {
    version: 2,
    baseline: [],
    aliases: [],
    imported: false,
    themeId: theme.id,
    shell: /win/i.test(platform) ? 'powershell' : 'bash',
    terminalBg: theme.colors.bg,
    draft: applyThemeToRecipe(DEFAULT_RECIPE, theme),
    draftName: 'ltable',
    branchDraft: applyThemeToBranchRecipe(DEFAULT_BRANCH_RECIPE, theme),
    branchDraftName: 'recent',
    chartDraft: applyThemeToChartRecipe(CHART_PRESETS.activity, theme),
    chartDraftName: 'activity',
    undoDraft: { situationId: 'undo', confirm: false, name: 'undo', acknowledged: false },
    meName: 'you',
    locale: detectLocale(language),
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
        branchDraft: applyThemeToBranchRecipe(s.branchDraft, theme),
        chartDraft: applyThemeToChartRecipe(s.chartDraft, theme),
      };
    }
    case 'setShell':
      return { ...s, shell: a.shell };
    case 'setTerminalBg':
      return { ...s, terminalBg: a.color };
    case 'setDraft':
      return { ...s, draft: a.draft, draftName: a.name ?? s.draftName };
    case 'setBranchDraft':
      return { ...s, branchDraft: a.draft, branchDraftName: a.name ?? s.branchDraftName };
    case 'setChartDraft':
      return { ...s, chartDraft: a.draft, chartDraftName: a.name ?? s.chartDraftName };
    case 'setUndoDraft':
      return { ...s, undoDraft: { ...s.undoDraft, ...a.draft } };
    case 'setMeName':
      return { ...s, meName: a.name };
    case 'setLocale':
      return { ...s, locale: a.locale };
    case 'reset':
      // Keep the language and terminal the person already chose.
      return { ...initialState(s.shell === 'powershell' ? 'Win' : ''), locale: s.locale };
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

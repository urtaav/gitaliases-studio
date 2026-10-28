import { fieldDef } from '../fields';
import { copy } from '../../i18n';
import type { LogRecipe } from '../../core/logFormat';
import type { BranchRecipe } from '../../core/branchFormat';
import type { ChartRecipe } from '../../core/chartFormat';

export interface ThemeColors {
  bg: string;
  fg: string;
  muted: string;
  accent: string;
  hash: string;
  date: string;
  author: string;
  me: string;
  refs: string;
  separator: string;
  subject: string;
}

export interface Theme {
  id: string;
  name: string;
  family: 'deity' | 'creature' | 'royalty' | 'language';
  mode: 'dark' | 'light';
  description: string;
  colors: ThemeColors;
}

const files = import.meta.glob<Theme>('./*.json', { eager: true, import: 'default' });

export const THEMES: readonly Theme[] = Object.values(files).sort(
  (a, b) => a.family.localeCompare(b.family) || a.name.localeCompare(b.name),
);

export const DEFAULT_THEME_ID = 'nyx-veil';

export const THEME_FAMILIES: readonly Theme['family'][] = ['deity', 'creature', 'royalty', 'language'];
export const familyLabel = (f: Theme['family']) => copy.themeFamilies[f];

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME_ID)!;
}

/** Branch lists: name like refs, dates and authors like the log, the rest muted. */
export function applyThemeToBranchRecipe(r: BranchRecipe, t: Theme): BranchRecipe {
  const byKey: Record<string, string> = {
    name: t.colors.refs,
    date: t.colors.date,
    author: t.colors.author,
    hash: t.colors.hash,
    head: t.colors.me,
    subject: '',
    upstream: t.colors.muted,
    track: t.colors.muted,
  };
  return {
    ...r,
    separatorColor: t.colors.separator,
    fields: r.fields.map((f) => ({ ...f, color: byKey[f.key] ?? f.color })),
  };
}

export function applyThemeToChartRecipe(r: ChartRecipe, t: Theme): ChartRecipe {
  return { ...r, color: t.colors.me };
}

/** Paints a recipe with a theme by field role. The subject keeps the terminal color. */
export function applyThemeToRecipe(r: LogRecipe, t: Theme): LogRecipe {
  const roleColor: Record<string, string> = {
    hash: t.colors.hash,
    date: t.colors.date,
    author: t.colors.author,
    other: t.colors.muted,
  };
  return {
    ...r,
    separatorColor: t.colors.separator,
    highlight: { ...r.highlight, color: t.colors.me },
    fields: r.fields.map((f) => {
      const role = fieldDef(f.placeholder)?.role ?? 'other';
      if (role === 'refs' || role === 'subject') return f;
      return { ...f, color: roleColor[role] ?? f.color };
    }),
  };
}

import { fieldDef } from '../fields';
import type { LogRecipe } from '../../core/logFormat';

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

export const FAMILY_LABELS: Record<Theme['family'], string> = {
  deity: 'Night deities',
  creature: 'Creatures of the night',
  royalty: 'Night royalty',
  language: 'Language nods',
};

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME_ID)!;
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

import type { Theme } from '../data/themes';

export function themeCssVars(t: Theme): Record<string, string> {
  const c = t.colors;
  return {
    '--bg': c.bg,
    '--fg': c.fg,
    '--muted': c.muted,
    '--accent': c.accent,
    '--sep': c.separator,
    '--hash': c.hash,
    '--date': c.date,
    '--author': c.author,
    '--me': c.me,
    '--refs': c.refs,
  };
}

export function applyTheme(t: Theme): void {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(themeCssVars(t))) root.style.setProperty(k, v);
  root.dataset.mode = t.mode;
  root.style.colorScheme = t.mode;
}

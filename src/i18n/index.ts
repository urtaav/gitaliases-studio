import { en, type Copy } from './en';
import { es } from './es';

export type Locale = 'en' | 'es';
export type { Copy };

export const LOCALES: Record<Locale, Copy> = { en, es };

/**
 * Current copy. A live binding: modules that import it always read the active locale,
 * so changing the language only needs setLocale() and a re-render.
 */
export let copy: Copy = en;
let current: Locale = 'en';

export function setLocale(l: Locale): void {
  current = l;
  copy = LOCALES[l];
}

export const getLocale = (): Locale => current;

export function detectLocale(lang: string | undefined): Locale {
  return /^es\b/i.test(lang ?? '') ? 'es' : 'en';
}

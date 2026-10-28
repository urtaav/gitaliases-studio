import type { Risk } from './types';

// Commands that can delete work that is not committed or pushed anywhere.
const DESTRUCTIVE =
  /reset\s+--hard|clean\s+-\w*f|push\s+(-f\b|--force(?!-with-lease))|checkout\s+--\s+\.|(^|[\s!'"])restore(?!\s+--staged)(\s|$|['"])/;
// Commands that rewrite history others may already have.
const CAREFUL = /commit\s+--amend|push\s+--force-with-lease|(^|\s)rebase(\s|$)/;

export function detectRisk(value: string): Risk | undefined {
  if (DESTRUCTIVE.test(value)) return 'destructive';
  if (CAREFUL.test(value)) return 'careful';
  return undefined;
}

import { GIT_BUILTINS } from './gitBuiltins';
import type { Alias, AliasType, Issue } from './types';

const NAME_RE = /^[A-Za-z][A-Za-z0-9-]*$/;

/** git treats alias names case-insensitively, so comparisons are lowercase. */
export function validateName(name: string, existing: string[], originalName?: string): Issue[] {
  const issues: Issue[] = [];
  const lower = name.toLowerCase();

  if (!NAME_RE.test(name)) {
    issues.push({
      code: 'invalid-name',
      message: 'Use letters, numbers or dashes, starting with a letter.',
    });
    return issues;
  }
  if (GIT_BUILTINS.has(lower)) {
    issues.push({
      code: 'builtin',
      message: `git already has a command called "${lower}", so this alias would never run.`,
    });
  }
  const isSelf = originalName !== undefined && originalName.toLowerCase() === lower;
  if (!isSelf && existing.some((n) => n.toLowerCase() === lower)) {
    issues.push({ code: 'duplicate', message: `You already have an alias called "${lower}".` });
  }
  return issues;
}

export function validateValue(value: string): Issue[] {
  return value.trim() === ''
    ? [{ code: 'empty-value', message: 'Tell the alias what to run.' }]
    : [];
}

export function inferType(value: string): AliasType {
  const v = value.trim();
  if (/^log\s/.test(v) && /--(pretty|format)=/.test(v)) return 'log';
  if (v.startsWith('!')) {
    // Highlight-my-commits aliases built by the log designer.
    if (v.includes('git log') && v.includes('~~%ae~~')) return 'log';
    return 'shell';
  }
  return 'shortcut';
}

export function describeAlias(a: Alias): string {
  if (a.description) return a.description;
  switch (a.type) {
    case 'shell':
      return 'Runs a shell command';
    case 'log':
      return 'Custom log view';
    default:
      return `Runs git ${a.value.trim()}`;
  }
}

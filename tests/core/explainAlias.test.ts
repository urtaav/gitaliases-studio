import { afterEach, describe, expect, test } from 'vitest';
import { describePlaceholders, explainAlias, tokenize } from '../../src/core/explainAlias';
import { DEFAULT_BRANCH_RECIPE } from '../../src/core/branchFormat';
import { setLocale } from '../../src/i18n';

afterEach(() => setLocale('en'));

const view = (value: string) => explainAlias({ value }).map((p) => [p.text, p.explanation]);

test('tokenize keeps quoted parts together', () => {
  expect(tokenize(`log --format='%h %s' -n 5`)).toEqual(['log', "--format='%h %s'", '-n', '5']);
  expect(tokenize('commit -m "two words"')).toEqual(['commit', '-m', '"two words"']);
});

describe('git shortcuts', () => {
  test('subcommand and flags', () => {
    expect(view('log --oneline --graph --decorate --all')).toEqual([
      ['log', 'Show the commit history'],
      ['--oneline', 'One line per commit, with a short hash'],
      ['--graph', 'Draw the branch lines on the left'],
      ['--decorate', 'Show branch and tag names next to commits'],
      ['--all', 'Include every branch'],
    ]);
  });
  test('a leading "git" is ignored', () => expect(view('git status -sb')[0]).toEqual(['status', 'Show the state of your files']));
  test('unknown options and arguments still get a plain sentence', () => {
    expect(view('checkout --weird main')).toEqual([
      ['checkout', 'Switch branches or restore files'],
      ['--weird', 'Option --weird (see git help)'],
      ['main', 'Uses "main"'],
    ]);
  });
  test('format strings list what they show', () => {
    const [, fmt] = view("for-each-ref --format='%(committerdate:short) %(refname:short)' refs/heads/");
    expect(fmt![1]).toContain('Last commit date, Branch name');
    expect(describePlaceholders('%h %an %s')).toBe('Commit hash (short), Author name, Subject');
  });
  test('global options before the subcommand', () => {
    expect(view('-p log -M')).toEqual([
      ['-p', 'Show the output page by page'],
      ['log', 'Show the commit history'],
      ['-M', 'Detect renamed files'],
    ]);
  });
});

describe('shell aliases and pasted config lines', () => {
  test('a pasted git config line is unwrapped', () => {
    const parts = view(`git config --global alias.churn "!git -p log --name-only | sort | uniq -c | sort -rn"`);
    expect(parts[0]).toEqual(['git config --global alias.churn', 'Saves the alias "churn" in your global settings']);
    expect(parts[1]).toEqual(['!', 'Runs as a shell command instead of a git subcommand']);
    expect(parts.map((p) => p[0])).toEqual([
      'git config --global alias.churn', '!', 'git -p', 'log', '--name-only', '|', 'sort', '|', 'uniq -c', '|', 'sort -rn',
    ]);
    expect(parts.find((p) => p[0] === 'uniq -c')![1]).toBe('Group equal lines and count them');
  });
  test('function wrappers and operators', () => {
    const texts = view(`!f() { git checkout -b "$1" && git push -u origin "$1"; }; f`).map((p) => p[0]);
    expect(texts).toEqual(['!', 'f() { … }; f', 'git checkout', '-b', '"$1"', '&&', 'git push', '-u', 'origin', '"$1"']);
  });
});

test('designer aliases use their recipe', () => {
  const parts = explainAlias({ value: 'ignored', recipe: { kind: 'branches', branches: DEFAULT_BRANCH_RECIPE } });
  expect(parts[0]!.text).toBe('for-each-ref');
});

test('explanations follow the active language', () => {
  setLocale('es');
  expect(view('log --oneline')).toEqual([
    ['log', 'Muestra el historial de commits'],
    ['--oneline', 'Una línea por commit, con hash corto'],
  ]);
});

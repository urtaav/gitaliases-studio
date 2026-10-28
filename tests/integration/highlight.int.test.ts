import { expect, test } from 'vitest';
import { spawnSync } from 'node:child_process';
import { buildLogAliasValue, DEFAULT_RECIPE } from '../../src/core/logFormat';
import { isolatedEnv, tmp } from './helpers';

const ME = { name: 'Me Myself', email: 'me@example.com' };
const OTHER = { name: 'Someone Else', email: 'other@example.com' };

test('highlight alias marks only my commits, with real git and sed', () => {
  const repo = tmp('repo');
  const env = isolatedEnv(repo);
  const git = (args: string[], who?: typeof ME) =>
    spawnSync('git', args, {
      cwd: repo,
      encoding: 'utf8',
      env: who
        ? {
            ...env,
            GIT_AUTHOR_NAME: who.name,
            GIT_AUTHOR_EMAIL: who.email,
            GIT_COMMITTER_NAME: who.name,
            GIT_COMMITTER_EMAIL: who.email,
          }
        : env,
    });

  expect(git(['init', '-q']).status).toBe(0);
  for (const [i, who] of [ME, OTHER, ME].entries()) {
    expect(git(['commit', '-q', '--allow-empty', '-m', `commit ${i}`], who).status).toBe(0);
  }
  git(['config', '--global', 'user.email', ME.email]);
  const value = buildLogAliasValue({ ...DEFAULT_RECIPE, highlight: { ...DEFAULT_RECIPE.highlight, pager: false } });
  expect(git(['config', '--global', 'alias.hl', value]).status).toBe(0);

  const out = git(['hl', '-3']);
  expect(out.status, out.stderr).toBe(0);
  const lines = out.stdout.trimEnd().split('\n');
  expect(lines).toHaveLength(3);
  for (const line of lines) {
    const mine = line.includes(ME.name);
    expect(line.includes('▶ '), line).toBe(mine);
    expect(line.includes('\x1b[1;38;2;'), line).toBe(mine);
    expect(line).not.toContain('~~');
  }
}, 60_000);

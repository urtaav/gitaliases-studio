import { describe, expect, test } from 'vitest';
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { serializeAliasFile } from '../../src/core/aliasFile';
import { buildApplyAllSteps, buildSetCommand } from '../../src/core/shell';
import { TRICKY_VALUES } from '../fixtures/trickyValues';
import { bashPath, gitGet, hasPwsh, hasWindowsPowerShell, isolatedEnv, runScript, tmp } from './helpers';

// The PowerShell command must work in both pwsh 7 and Windows PowerShell 5.1.
const shells = [
  { runner: 'bash' as const, gen: 'bash' as const, available: bashPath() !== null },
  { runner: 'powershell' as const, gen: 'powershell' as const, available: hasPwsh() },
  { runner: 'powershell51' as const, gen: 'powershell' as const, available: hasWindowsPowerShell() },
];

describe.each(shells)('one by one in $runner', ({ runner, gen, available }) => {
  test.skipIf(!available).each(TRICKY_VALUES)('$name survives exactly', ({ name, value }) => {
    const dir = tmp(runner);
    const env = isolatedEnv(dir);
    const cmd = buildSetCommand(gen, name, value);
    const r = runScript(runner, cmd.text, env, dir);
    expect(r.status, r.stderr).toBe(0);
    expect(gitGet(name, env)).toBe(value);
  }, 30_000);
});

test('all at once keeps include.path entries the user already had', () => {
  const dir = tmp('keep');
  const env = isolatedEnv(dir);
  const git = (args: string[]) => spawnSync('git', args, { env, cwd: dir, encoding: 'utf8' });
  git(['config', '--global', 'include.path', '~/work.gitconfig']);
  const include = buildApplyAllSteps('bash', { imported: false }).find((s) => s.id === 'include')!.command!;
  const args = include.split(' ').slice(1);
  git(args);
  git(args); // applying twice must not add a second entry
  expect(git(['config', '--global', '--get-all', 'include.path']).stdout.trim().split('\n')).toEqual([
    '~/work.gitconfig',
    '~/.gitaliases',
  ]);
}, 30_000);

test('all at once: the include file gives back every value', () => {
  const dir = tmp('file');
  const env = isolatedEnv(dir);
  const file = join(dir, '.gitaliases');
  writeFileSync(file, serializeAliasFile(TRICKY_VALUES));
  const r = spawnSync('git', ['config', '--global', 'include.path', file.replace(/\\/g, '/')], { env, encoding: 'utf8' });
  expect(r.status, r.stderr).toBe(0);
  for (const { name, value } of TRICKY_VALUES) expect(gitGet(name, env, 'all'), name).toBe(value);
  // And git actually runs an alias that lives in the included file.
  const run = spawnSync('git', ['plain'], { env, cwd: dir, encoding: 'utf8' });
  expect(run.stderr).not.toMatch(/is not a git command/);
}, 30_000);

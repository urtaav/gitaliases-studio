import { describe, expect, test } from 'vitest';
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { serializeAliasFile } from '../../src/core/aliasFile';
import { buildSetCommand } from '../../src/core/shell';
import { TRICKY_VALUES } from '../fixtures/trickyValues';
import { bashPath, gitGet, hasPwsh, isolatedEnv, runScript, tmp } from './helpers';

const shells = [
  { shell: 'bash' as const, available: bashPath() !== null },
  { shell: 'powershell' as const, available: hasPwsh() },
];

describe.each(shells)('one by one in $shell', ({ shell, available }) => {
  test.skipIf(!available).each(TRICKY_VALUES)('$name survives exactly', ({ name, value }) => {
    const dir = tmp(shell);
    const env = isolatedEnv(dir);
    const cmd = buildSetCommand(shell, name, value);
    const r = runScript(shell, cmd.text, env, dir);
    expect(r.status, r.stderr).toBe(0);
    expect(gitGet(name, env)).toBe(value);
  }, 30_000);
});

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

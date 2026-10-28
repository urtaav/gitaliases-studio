import { expect, test } from 'vitest';
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { serializeAliasFile } from '../../src/core/aliasFile';
import { buildCheatAliasValue, cheatAlias } from '../../src/core/cheat';
import { isolatedEnv, tmp } from './helpers';

/** HOME points at a temp folder so ~/.gitaliases is the test's own file. */
function homeEnv() {
  const dir = tmp('cheat');
  const env = { ...isolatedEnv(dir), HOME: dir, USERPROFILE: dir };
  return { dir, env };
}

test('git cheat prints each alias with its description from ~/.gitaliases', () => {
  const { dir, env } = homeEnv();
  const file = join(dir, '.gitaliases');
  writeFileSync(
    file,
    serializeAliasFile([
      { name: 'st', value: 'status -sb', description: 'Short status that also shows your branch' },
      { name: 'wipe', value: 'reset --hard HEAD', description: '[can delete work] Reset everything' },
      { ...cheatAlias(), description: cheatAlias().description! },
    ]),
  );
  spawnSync('git', ['config', '--global', 'include.path', file.replace(/\\/g, '/')], { env });

  const r = spawnSync('git', ['cheat'], { env, cwd: dir, encoding: 'utf8' });
  expect(r.status, r.stderr).toBe(0);
  const lines = r.stdout.trimEnd().split('\n').map((l) => l.trim().replace(/\s+/, ' | '));
  expect(lines).toEqual([
    'cheat | List my aliases with their descriptions',
    'st | Short status that also shows your branch',
    'wipe | [can delete work] Reset everything',
  ]);
}, 60_000);

test('without the file, git cheat still lists the aliases', () => {
  const { dir, env } = homeEnv();
  spawnSync('git', ['config', '--global', 'alias.st', 'status'], { env });
  spawnSync('git', ['config', '--global', 'alias.cheat', buildCheatAliasValue()], { env });
  const r = spawnSync('git', ['cheat'], { env, cwd: dir, encoding: 'utf8' });
  expect(r.status, r.stderr).toBe(0);
  expect(r.stdout).toContain('st status');
}, 60_000);

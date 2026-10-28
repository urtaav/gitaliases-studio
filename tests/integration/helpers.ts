import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const tmp = (prefix: string): string => mkdtempSync(join(tmpdir(), `gas-${prefix}-`));

/** On Windows plain "bash" may be WSL; use the one that ships with Git. */
export function bashPath(): string | null {
  if (process.platform !== 'win32') return 'bash';
  const candidates = ['C:/Program Files/Git/bin/bash.exe', 'C:/Program Files (x86)/Git/bin/bash.exe'];
  return candidates.find((p) => existsSync(p)) ?? null;
}

export function hasCommand(cmd: string, args: string[]): boolean {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  return r.status === 0;
}

export const hasPwsh = (): boolean => hasCommand('pwsh', ['-NoProfile', '-Command', '$PSVersionTable.PSVersion.Major']);

/** Environment with an isolated global config, so tests never touch the real one. */
export function isolatedEnv(dir: string): NodeJS.ProcessEnv {
  return {
    ...process.env,
    GIT_CONFIG_GLOBAL: join(dir, 'global.gitconfig'),
    GIT_CONFIG_NOSYSTEM: '1',
    LANG: 'C.UTF-8',
  };
}

/** Runs a script the same way a user pasting it would: as a file in that shell. */
export function runScript(shell: 'bash' | 'powershell', script: string, env: NodeJS.ProcessEnv, dir: string): SpawnSyncReturns<string> {
  if (shell === 'bash') {
    const file = join(dir, 'cmd.sh');
    writeFileSync(file, script + '\n');
    return spawnSync(bashPath()!, [file], { env, encoding: 'utf8' });
  }
  const file = join(dir, 'cmd.ps1');
  // BOM so Windows PowerShell and pwsh read the file as UTF-8.
  writeFileSync(file, '\uFEFF' + script + '\n');
  return spawnSync('pwsh', ['-NoProfile', '-NonInteractive', '-File', file], { env, encoding: 'utf8' });
}

/**
 * scope 'all' reads config the way git does when it runs an alias (includes followed);
 * '--global' alone ignores include.path, as documented for git config.
 */
export function gitGet(name: string, env: NodeJS.ProcessEnv, scope: 'global' | 'all' = 'global'): string | null {
  const args = scope === 'global' ? ['config', '--global', '--get', `alias.${name}`] : ['config', '--get', `alias.${name}`];
  const r = spawnSync('git', args, { env, encoding: 'utf8', cwd: env.GIT_CONFIG_GLOBAL!.replace(/[\\/][^\\/]+$/, '') });
  return r.status === 0 ? r.stdout.replace(/\n$/, '') : null;
}

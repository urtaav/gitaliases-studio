import type { Shell } from './types';

export const ALIAS_FILE_NAME = '.gitaliases';

export interface CommandResult {
  text: string;
  supported: boolean;
  notice?: 'needs-pwsh-7.3' | 'cmd-unsafe';
}

/** Characters cmd.exe interprets even inside double quotes, or that would end them. */
export function isCmdSafe(value: string): boolean {
  return !/["%^&|<>!()\r\n]/.test(value);
}

export function buildSetCommand(shell: Shell, name: string, value: string): CommandResult {
  switch (shell) {
    case 'bash':
      return {
        text: `git config --global alias.${name} '${value.replace(/'/g, `'\\''`)}'`,
        supported: true,
      };
    case 'powershell': {
      // A single-quoted here-string is fully literal: no $, backtick or quote handling.
      const text = `$value = @'\n${value}\n'@\ngit config --global alias.${name} $value`;
      // Windows PowerShell 5.1 drops embedded double quotes when calling native programs.
      return value.includes('"')
        ? { text, supported: true, notice: 'needs-pwsh-7.3' }
        : { text, supported: true };
    }
    case 'cmd':
      return isCmdSafe(value)
        ? { text: `git config --global alias.${name} "${value}"`, supported: true }
        : { text: '', supported: false, notice: 'cmd-unsafe' };
  }
}

export function buildUnsetCommand(name: string): string {
  return `git config --global --unset alias.${name}`;
}

export type ApplyStepId = 'backup' | 'download' | 'remove-section' | 'include' | 'test';

export interface ApplyStep {
  id: ApplyStepId;
  command?: string;
}

const BACKUP: Record<Shell, string> = {
  powershell: 'Copy-Item ~/.gitconfig ~/.gitconfig.bak',
  bash: 'cp ~/.gitconfig ~/.gitconfig.bak',
  cmd: 'copy "%USERPROFILE%\\.gitconfig" "%USERPROFILE%\\.gitconfig.bak"',
};

/** "All at once" method. Steps after the backup contain no quotes, so they work in any shell. */
export function buildApplyAllSteps(
  shell: Shell,
  opts: { imported: boolean; testAlias?: string },
): ApplyStep[] {
  const steps: ApplyStep[] = [
    { id: 'backup', command: BACKUP[shell] },
    { id: 'download' },
  ];
  // Only offered after an import: otherwise we don't know what would be deleted.
  if (opts.imported) {
    steps.push({ id: 'remove-section', command: 'git config --global --remove-section alias' });
  }
  // A plain set would overwrite an include.path the user already has; --replace-all with a
  // value pattern only touches our own entry, so other includes survive and re-runs don't duplicate it.
  steps.push({
    id: 'include',
    command: `git config --global --replace-all include.path ~/${ALIAS_FILE_NAME} gitaliases`,
  });
  if (opts.testAlias) steps.push({ id: 'test', command: `git ${opts.testAlias}` });
  return steps;
}

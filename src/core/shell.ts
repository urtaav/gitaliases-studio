import type { Shell } from './types';

export const ALIAS_FILE_NAME = '.gitaliases';

export interface CommandResult {
  text: string;
  supported: boolean;
  notice?: 'cmd-unsafe';
}

// Windows PowerShell 5.1 (and pwsh < 7.3) pass native arguments without escaping inner
// double quotes, so git receives a cut value. This line escapes them only on those versions.
const PS_LEGACY_QUOTES = String.raw`if ($PSVersionTable.PSVersion -lt [version]'7.3') { $value = $value -replace '(\\*)"', '$1$1\"' -replace '(\\+)$', '$1$1' }`;

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
      const fix = value.includes('"') ? `${PS_LEGACY_QUOTES}\n` : '';
      return {
        text: `$value = @'\n${value}\n'@\n${fix}git config --global alias.${name} $value`,
        supported: true,
      };
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

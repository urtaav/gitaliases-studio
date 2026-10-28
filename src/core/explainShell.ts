import { copy } from '../i18n';
import { ALIAS_FILE_NAME, type ApplyStep } from './shell';
import type { CommandPart } from './explain';
import type { Shell } from './types';

const short = (t: string) => (t.length > 70 ? t.slice(0, 67) + '…' : t);
const p = (text: string, explanation: string, i: number): CommandPart => ({ text, explanation, source: `s${i}` });

/** Explains the command that sets one alias in the given shell. */
export function explainSetCommand(shell: Shell, name: string, value: string, text: string): CommandPart[] {
  const t = copy.shellExplain;
  if (shell === 'powershell') {
    const parts = [p("$value = @'", t.hereStart, 0), p(short(value), t.value, 1), p("'@", t.hereEnd, 2)];
    if (text.includes('$PSVersionTable')) parts.push(p("if ($PSVersionTable.PSVersion -lt [version]'7.3') { … }", t.psFix, 3));
    parts.push(p(`git config --global alias.${name} $value`, t.setPs(name), 4));
    return parts;
  }
  return [
    p('git config --global', t.gitConfig, 0),
    p(`alias.${name}`, t.aliasKey(name), 1),
    p(short(text.slice(`git config --global alias.${name} `.length)), shell === 'bash' ? t.bashValue : t.cmdValue, 2),
  ];
}

export function explainUnsetCommand(name: string): CommandPart[] {
  const t = copy.shellExplain;
  return [p('git config --global', t.gitConfig, 0), p(`--unset alias.${name}`, t.unset(name), 1)];
}

/** Explains each "All at once" step command. */
export function explainApplyStep(step: ApplyStep): CommandPart[] {
  const t = copy.shellExplain;
  switch (step.id) {
    case 'backup':
      return [p(step.command!, t.backup, 0)];
    case 'remove-section':
      return [p('git config --global', t.gitConfig, 0), p('--remove-section alias', t.removeSection, 1)];
    case 'include':
      return [
        p('git config --global', t.gitConfig, 0),
        p(`--replace-all include.path ~/${ALIAS_FILE_NAME}`, t.include, 1),
        p('gitaliases', t.includeKey, 2),
      ];
    case 'test':
      return [p(step.command!, t.test(step.command!.replace(/^git /, '')), 0)];
    default:
      return [];
  }
}

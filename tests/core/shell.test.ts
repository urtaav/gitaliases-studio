import { describe, expect, test } from 'vitest';
import { buildApplyAllSteps, buildSetCommand, buildUnsetCommand, isCmdSafe } from '../../src/core/shell';

describe('buildSetCommand', () => {
  test('bash escapes single quotes', () => {
    expect(buildSetCommand('bash', 'x', "it's").text).toBe("git config --global alias.x 'it'\\''s'");
  });
  test('bash keeps $ and backslashes literal', () => {
    expect(buildSetCommand('bash', 'x', '!echo $HOME \\n').text).toBe("git config --global alias.x '!echo $HOME \\n'");
  });
  test('powershell uses a literal here-string', () => {
    const v = '!echo $HOME `date`';
    expect(buildSetCommand('powershell', 'x', v)).toEqual({
      text: `$value = @'\n${v}\n'@\ngit config --global alias.x $value`,
      supported: true,
    });
  });
  test('powershell escapes double quotes only on versions older than 7.3', () => {
    const v = 'log --format="%h"';
    const fix = String.raw`if ($PSVersionTable.PSVersion -lt [version]'7.3') { $value = $value -replace '(\\*)"', '$1$1\"' -replace '(\\+)$', '$1$1' }`;
    expect(buildSetCommand('powershell', 'x', v)).toEqual({
      text: `$value = @'\n${v}\n'@\n${fix}\ngit config --global alias.x $value`,
      supported: true,
    });
  });
  test('cmd only for safe values', () => {
    expect(buildSetCommand('cmd', 'x', 'checkout -b')).toEqual({
      text: 'git config --global alias.x "checkout -b"',
      supported: true,
    });
    expect(buildSetCommand('cmd', 'x', 'log --format="%h"')).toEqual({ text: '', supported: false, notice: 'cmd-unsafe' });
  });
});

test('isCmdSafe', () => {
  expect(isCmdSafe('checkout -b')).toBe(true);
  for (const ch of ['"', '%', '^', '&', '|', '<', '>', '!', '(', ')']) expect(isCmdSafe(`a${ch}b`)).toBe(false);
});

test('buildUnsetCommand', () => {
  expect(buildUnsetCommand('x')).toBe('git config --global --unset alias.x');
});

describe('buildApplyAllSteps', () => {
  test('after an import', () => {
    const steps = buildApplyAllSteps('powershell', { imported: true, testAlias: 'st' });
    expect(steps.map((s) => s.id)).toEqual(['backup', 'download', 'remove-section', 'include', 'test']);
    expect(steps[0]!.command).toBe('Copy-Item ~/.gitconfig ~/.gitconfig.bak');
    expect(steps[2]!.command).toBe('git config --global --remove-section alias');
    // --replace-all with a value pattern keeps other include.path entries and never duplicates ours.
    expect(steps[3]!.command).toBe('git config --global --replace-all include.path ~/.gitaliases gitaliases');
    expect(steps[4]!.command).toBe('git st');
  });
  test('backup command per shell', () => {
    expect(buildApplyAllSteps('bash', { imported: false })[0]!.command).toBe('cp ~/.gitconfig ~/.gitconfig.bak');
    expect(buildApplyAllSteps('cmd', { imported: false })[0]!.command).toBe(
      'copy "%USERPROFILE%\\.gitconfig" "%USERPROFILE%\\.gitconfig.bak"',
    );
  });
  test('without an import nothing is removed', () => {
    expect(buildApplyAllSteps('bash', { imported: false }).map((s) => s.id)).toEqual(['backup', 'download', 'include']);
  });
});

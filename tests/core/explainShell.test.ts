import { expect, test } from 'vitest';
import { explainApplyStep, explainSetCommand, explainUnsetCommand } from '../../src/core/explainShell';
import { buildApplyAllSteps, buildSetCommand } from '../../src/core/shell';

const texts = (parts: { text: string }[]) => parts.map((p) => p.text);

test('PowerShell: the quote fix is explained only when it is there', () => {
  const plain = buildSetCommand('powershell', 'st', 'status');
  expect(texts(explainSetCommand('powershell', 'st', 'status', plain.text))).toEqual([
    "$value = @'", 'status', "'@", 'git config --global alias.st $value',
  ]);
  const quoted = buildSetCommand('powershell', 'x', 'log --format="%h"');
  expect(texts(explainSetCommand('powershell', 'x', 'log --format="%h"', quoted.text))).toContain(
    "if ($PSVersionTable.PSVersion -lt [version]'7.3') { … }",
  );
});

test('bash splits settings, name and quoted value', () => {
  const cmd = buildSetCommand('bash', 'x', "it's");
  expect(texts(explainSetCommand('bash', 'x', "it's", cmd.text))).toEqual(['git config --global', 'alias.x', "'it'\\''s'"]);
});

test('unset and the all-at-once steps', () => {
  expect(texts(explainUnsetCommand('x'))).toEqual(['git config --global', '--unset alias.x']);
  const steps = buildApplyAllSteps('bash', { imported: true, testAlias: 'st' });
  expect(texts(explainApplyStep(steps.find((s) => s.id === 'include')!))).toEqual([
    'git config --global', '--replace-all include.path ~/.gitaliases', 'gitaliases',
  ]);
  expect(explainApplyStep(steps.find((s) => s.id === 'test')!)[0]!.explanation).toContain('"st"');
});

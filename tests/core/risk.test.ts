import { expect, test } from 'vitest';
import { detectRisk } from '../../src/core/risk';

test.each([
  ['reset --hard', 'destructive'],
  ['reset --hard HEAD~1', 'destructive'],
  ['clean -fd', 'destructive'],
  ['clean -xdf', 'destructive'],
  ['push --force', 'destructive'],
  ['push -f origin main', 'destructive'],
  ['checkout -- .', 'destructive'],
  ['restore', 'destructive'],
  ['restore src/app.js', 'destructive'],
  ['!git restore "$@"', 'destructive'],
  ['push --force-with-lease', 'careful'],
  ['commit --amend --no-edit', 'careful'],
  ['rebase -i HEAD~3', 'careful'],
  ['restore --staged', undefined],
  ['reset --soft HEAD~1', undefined],
  ['status', undefined],
  ['log --oneline', undefined],
])('%s → %s', (value, risk) => {
  expect(detectRisk(value)).toBe(risk);
});

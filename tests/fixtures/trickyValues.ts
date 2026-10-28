import { buildBranchAliasValue, DEFAULT_BRANCH_RECIPE } from '../../src/core/branchFormat';
import { buildChartAliasValue, CHART_PRESETS } from '../../src/core/chartFormat';
import { buildUndoAliasValue } from '../../src/core/undo';
import { buildCheatAliasValue } from '../../src/core/cheat';
import { setLocale } from '../../src/i18n';

// Spanish confirm prompts carry ¿ and accents into the alias: they must survive every shell too.
setLocale('es');
const SPANISH_WIPE = buildUndoAliasValue({ situationId: 'wipe', confirm: true });
setLocale('en');

/** Values that break naive quoting in one shell or another, plus every builder's output. */
export const TRICKY_VALUES: { name: string; value: string }[] = [
  { name: 'recent', value: buildBranchAliasValue(DEFAULT_BRANCH_RECIPE) },
  { name: 'chartday', value: buildChartAliasValue(CHART_PRESETS.activity) },
  { name: 'chartfile', value: buildChartAliasValue(CHART_PRESETS.churn) },
  { name: 'wipe', value: buildUndoAliasValue({ situationId: 'wipe', confirm: true }) },
  { name: 'discard', value: buildUndoAliasValue({ situationId: 'discard', confirm: true }) },
  { name: 'wipees', value: SPANISH_WIPE },
  { name: 'cheat', value: buildCheatAliasValue() },
  { name: 'plain', value: 'status -sb' },
  { name: 'single', value: "commit -m 'it''s fine'" },
  { name: 'double', value: 'log --pretty=format:"%h %s"' },
  { name: 'backslash', value: '!echo C:\\Users\\dev' },
  { name: 'dollar', value: '!echo $HOME and ${PATH}' },
  { name: 'backtick', value: '!echo `date`' },
  { name: 'percent', value: 'log --pretty=format:%h%%' },
  { name: 'semicolon', value: '!git fetch; git status' },
  { name: 'hash', value: '!echo #notacomment' },
  { name: 'func', value: '!f() { git checkout -b "$1" && git push -u origin "$1"; }; f' },
  // Empty quotes and a non-ASCII bar: the case that broke in Windows PowerShell 5.1.
  { name: 'activity', value: `!git log --format="%ad" | awk '{printf "%s ", $1; printf "▇"; print ""}'` },
  { name: 'trailingbs', value: '!echo "C:\\temp\\"' },
];

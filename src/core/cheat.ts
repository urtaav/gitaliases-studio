import { copy } from '../i18n';
import { ALIAS_FILE_NAME } from './shell';
import type { Alias } from './types';

export const CHEAT_ALIAS_NAME = 'cheat';

/**
 * Prints every alias in ~/.gitaliases with the description stored above it as "#: …".
 * Without the file (aliases set one by one) it falls back to listing names and commands.
 */
export function buildCheatAliasValue(): string {
  const awk =
    String.raw`/^[[:space:]]*#: /{ sub(/^[[:space:]]*#: /, ""); d=$0; next } ` +
    String.raw`/^[[:space:]]*[A-Za-z][A-Za-z0-9-]*[[:space:]]*=/{ printf "  %-16s %s\n", $1, d; d="" }`;
  return (
    `!f() { if [ -f ~/${ALIAS_FILE_NAME} ]; then awk '${awk}' ~/${ALIAS_FILE_NAME}; ` +
    `else git config --get-regexp '^alias[.]' | sed 's/^alias[.]//'; fi; }; f`
  );
}

export function cheatAlias(): Alias {
  return { name: CHEAT_ALIAS_NAME, value: buildCheatAliasValue(), type: 'shell', description: copy.core.cheatDescription };
}

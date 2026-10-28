import { contrastRatio } from '../core/contrast';
import { getTheme } from '../data/themes';
import { useWorkspace } from '../state/WorkspaceContext';

/** Background the user said their terminal has, and a text color that stays readable on it. */
export function useTerminalColors(): { bg: string; fg: string } {
  const { state } = useWorkspace();
  const theme = getTheme(state.themeId);
  const bg = state.terminalBg;
  if (!/^#[0-9A-F]{6}$/i.test(bg) || contrastRatio(theme.colors.fg, bg) >= 4.5) return { bg, fg: theme.colors.fg };
  return { bg, fg: contrastRatio('#FFFFFF', bg) > contrastRatio('#111111', bg) ? '#FFFFFF' : '#111111' };
}

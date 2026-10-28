import { copy } from '../copy';
import { TerminalFrame } from '../app/TerminalFrame';
import { FAMILY_LABELS, THEMES, type Theme } from '../data/themes';
import { useWorkspace } from '../state/WorkspaceContext';
import type { StudioTab } from '../app/router';
import { AliasesTab } from './AliasesTab';
import { CatalogTab } from './CatalogTab';
import { LogDesignerTab } from './LogDesignerTab';
import { ApplyTab } from './ApplyTab';

export function ThemeSelect({ id = 'theme-select' }: { id?: string }) {
  const { state, dispatch } = useWorkspace();
  const families = Object.keys(FAMILY_LABELS) as Theme['family'][];
  return (
    <label className="inline-field" htmlFor={id}>
      <span>{copy.themeLabel}</span>
      <select
        id={id}
        value={state.themeId}
        onChange={(e) => dispatch({ type: 'setTheme', themeId: e.target.value })}
      >
        {families.map((fam) => (
          <optgroup key={fam} label={FAMILY_LABELS[fam]}>
            {THEMES.filter((t) => t.family === fam).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.mode === 'light' ? ' (light)' : ''}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

export function StudioLayout({ tab }: { tab: StudioTab }) {
  const { changes, dispatch } = useWorkspace();
  return (
    <div className="studio">
      <TerminalFrame active={tab} badges={{ apply: changes.length }} toolbar={<ThemeSelect />}>
        {tab === 'aliases' && <AliasesTab />}
        {tab === 'catalog' && <CatalogTab />}
        {tab === 'log' && <LogDesignerTab />}
        {tab === 'apply' && <ApplyTab />}
      </TerminalFrame>
      <footer className="studio-footer">
        <span>{copy.privacy}</span>
        <button
          type="button"
          className="btn-link"
          onClick={() => {
            if (window.confirm(copy.resetConfirm)) dispatch({ type: 'reset' });
          }}
        >
          {copy.resetWorkspace}
        </button>
      </footer>
    </div>
  );
}

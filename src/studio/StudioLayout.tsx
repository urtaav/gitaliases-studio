import { copy } from '../copy';
import { TerminalFrame } from '../app/TerminalFrame';
import { LanguageSelect } from '../components/LanguageSelect';
import { familyLabel, THEME_FAMILIES, THEMES } from '../data/themes';
import { useWorkspace } from '../state/WorkspaceContext';
import { DESIGNER_TABS, type StudioTab } from '../app/router';
import { AliasesTab } from './AliasesTab';
import { BranchDesignerTab } from './BranchDesignerTab';
import { ChartDesignerTab } from './ChartDesignerTab';
import { DesignerSwitch } from './DesignerSwitch';
import { StartTab } from './StartTab';
import { UndoTab } from './UndoTab';
import { CatalogTab } from './CatalogTab';
import { LogDesignerTab } from './LogDesignerTab';
import { ApplyTab } from './ApplyTab';

export function ThemeSelect({ id = 'theme-select' }: { id?: string }) {
  const { state, dispatch } = useWorkspace();
  return (
    <label className="inline-field" htmlFor={id}>
      <span>{copy.themeLabel}</span>
      <select
        id={id}
        value={state.themeId}
        onChange={(e) => dispatch({ type: 'setTheme', themeId: e.target.value })}
      >
        {THEME_FAMILIES.map((fam) => (
          <optgroup key={fam} label={familyLabel(fam)}>
            {THEMES.filter((t) => t.family === fam).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.mode === 'light' ? ' ' + copy.light : ''}
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
      <TerminalFrame
        active={tab}
        badges={{ apply: changes.length }}
        toolbar={
          <>
            <LanguageSelect />
            <ThemeSelect />
          </>
        }
      >
        {DESIGNER_TABS.includes(tab) && <DesignerSwitch active={tab} />}
        {tab === 'start' && <StartTab />}
        {tab === 'aliases' && <AliasesTab />}
        {tab === 'catalog' && <CatalogTab />}
        {tab === 'log' && <LogDesignerTab />}
        {tab === 'branches' && <BranchDesignerTab />}
        {tab === 'chart' && <ChartDesignerTab />}
        {tab === 'undo' && <UndoTab />}
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

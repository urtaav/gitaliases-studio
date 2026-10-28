import { copy } from '../copy';
import { LOCALES, type Locale } from '../i18n';
import { useWorkspace } from '../state/WorkspaceContext';

export function LanguageSelect({ id = 'lang-select' }: { id?: string }) {
  const { state, dispatch } = useWorkspace();
  return (
    <label className="inline-field" htmlFor={id}>
      <span>{copy.languageLabel}</span>
      <select id={id} value={state.locale} onChange={(e) => dispatch({ type: 'setLocale', locale: e.target.value as Locale })}>
        {(Object.keys(LOCALES) as Locale[]).map((l) => (
          <option key={l} value={l} lang={l}>
            {LOCALES[l].languageName}
          </option>
        ))}
      </select>
    </label>
  );
}

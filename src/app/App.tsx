import { useEffect } from 'react';
import { copy, setLocale } from '../copy';
import { getTheme } from '../data/themes';
import { Landing } from '../pages/Landing';
import { useWorkspace } from '../state/WorkspaceContext';
import { StudioLayout } from '../studio/StudioLayout';
import { applyTheme } from './theme';
import { useRoute } from './router';

export function App() {
  const route = useRoute();
  const { state } = useWorkspace();
  // Set before the children render, so every `copy` read below uses this language.
  setLocale(state.locale);

  useEffect(() => {
    document.documentElement.lang = state.locale;
  }, [state.locale]);

  useEffect(() => {
    applyTheme(getTheme(state.themeId));
  }, [state.themeId]);

  useEffect(() => {
    document.title =
      route.page === 'landing' ? copy.appName : `${copy.pageTitles[route.tab]} · ${copy.appName}`;
  }, [route, state.locale]);

  return (
    <>
      <a className="skip" href="#content">
        {copy.skipToContent}
      </a>
      {route.page === 'landing' ? <Landing /> : <StudioLayout tab={route.tab} />}
    </>
  );
}

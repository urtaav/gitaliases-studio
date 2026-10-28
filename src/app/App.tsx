import { useEffect } from 'react';
import { copy } from '../copy';
import { getTheme } from '../data/themes';
import { Landing } from '../pages/Landing';
import { useWorkspace } from '../state/WorkspaceContext';
import { StudioLayout } from '../studio/StudioLayout';
import { applyTheme } from './theme';
import { useRoute } from './router';

export function App() {
  const route = useRoute();
  const { state } = useWorkspace();

  useEffect(() => {
    applyTheme(getTheme(state.themeId));
  }, [state.themeId]);

  useEffect(() => {
    document.title =
      route.page === 'landing' ? copy.appName : `${copy.tabs[route.tab]} · ${copy.appName}`;
  }, [route]);

  return (
    <>
      <a className="skip" href="#content">
        {copy.skipToContent}
      </a>
      {route.page === 'landing' ? <Landing /> : <StudioLayout tab={route.tab} />}
    </>
  );
}

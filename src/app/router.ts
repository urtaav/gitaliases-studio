import { useEffect, useState } from 'react';

export type StudioTab = 'aliases' | 'catalog' | 'log' | 'apply';
export type Route = { page: 'landing' } | { page: 'studio'; tab: StudioTab };

export const STUDIO_TABS: readonly StudioTab[] = ['aliases', 'catalog', 'log', 'apply'];

export function parseHash(hash: string): Route {
  const m = /^#\/studio\/(aliases|catalog|log|apply)\/?$/.exec(hash);
  return m ? { page: 'studio', tab: m[1] as StudioTab } : { page: 'landing' };
}

export function routeToHash(r: Route): string {
  return r.page === 'landing' ? '#/' : `#/studio/${r.tab}`;
}

export function navigate(r: Route): void {
  window.location.hash = routeToHash(r);
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

import { useEffect, useState } from 'react';

export type StudioTab = 'start' | 'aliases' | 'catalog' | 'log' | 'branches' | 'chart' | 'undo' | 'apply';
export type TopTab = 'start' | 'aliases' | 'catalog' | 'designers' | 'apply';
export type Route = { page: 'landing' } | { page: 'studio'; tab: StudioTab };

export const TOP_TABS: readonly TopTab[] = ['start', 'aliases', 'catalog', 'designers', 'apply'];
export const DESIGNER_TABS: readonly StudioTab[] = ['log', 'branches', 'chart', 'undo'];
const ALL_TABS: readonly StudioTab[] = ['start', 'aliases', 'catalog', ...DESIGNER_TABS, 'apply'];

export function topTabOf(tab: StudioTab): TopTab {
  return DESIGNER_TABS.includes(tab) ? 'designers' : (tab as TopTab);
}

/** Where a top tab link goes; Designers opens the history designer first. */
export function tabTarget(top: TopTab): StudioTab {
  return top === 'designers' ? 'log' : top;
}

export function parseHash(hash: string): Route {
  const m = /^#\/studio\/([a-z]+)\/?$/.exec(hash);
  const tab = m?.[1] as StudioTab | undefined;
  return tab && ALL_TABS.includes(tab) ? { page: 'studio', tab } : { page: 'landing' };
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

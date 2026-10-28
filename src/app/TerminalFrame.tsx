import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { copy } from '../copy';
import { navigate, STUDIO_TABS, type StudioTab } from './router';

interface Props {
  active: StudioTab;
  badges?: Partial<Record<StudioTab, number>>;
  toolbar?: ReactNode;
  children: ReactNode;
}

/** The studio window: title bar, step tabs, body. */
export function TerminalFrame({ active, badges = {}, toolbar, children }: Props) {
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const onKey = (e: KeyboardEvent<HTMLAnchorElement>, i: number) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (i + delta + STUDIO_TABS.length) % STUDIO_TABS.length;
    const tab = STUDIO_TABS[next]!;
    navigate({ page: 'studio', tab });
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="window">
      <div className="window-bar">
        <span className="window-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <a className="window-title" href="#/">
          {copy.appName}
        </a>
        <div className="window-tools">{toolbar}</div>
      </div>
      <nav className="tabstrip" aria-label="Studio steps">
        <div role="tablist">
          {STUDIO_TABS.map((tab, i) => (
            <a
              key={tab}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              href={`#/studio/${tab}`}
              aria-selected={tab === active}
              tabIndex={tab === active ? 0 : -1}
              className="tab"
              onKeyDown={(e) => onKey(e, i)}
              title={copy.tabHints[tab]}
            >
              <span className="tab-step">{i + 1}</span>
              {copy.tabs[tab]}
              {badges[tab] ? <span className="badge">{badges[tab]}</span> : null}
            </a>
          ))}
        </div>
      </nav>
      <main id="content" className="window-body" role="tabpanel">
        {children}
      </main>
    </div>
  );
}

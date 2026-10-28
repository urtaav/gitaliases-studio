import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { copy } from '../copy';
import { navigate, tabTarget, topTabOf, TOP_TABS, type StudioTab, type TopTab } from './router';

interface Props {
  active: StudioTab;
  badges?: Partial<Record<TopTab, number>>;
  toolbar?: ReactNode;
  children: ReactNode;
}

/** The studio window: title bar, step tabs (0–4), body. */
export function TerminalFrame({ active, badges = {}, toolbar, children }: Props) {
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const activeTop = topTabOf(active);

  const onKey = (e: KeyboardEvent<HTMLAnchorElement>, i: number) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (i + delta + TOP_TABS.length) % TOP_TABS.length;
    navigate({ page: 'studio', tab: tabTarget(TOP_TABS[next]!) });
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
          {TOP_TABS.map((top, i) => (
            <a
              key={top}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              href={`#/studio/${tabTarget(top)}`}
              aria-selected={top === activeTop}
              tabIndex={top === activeTop ? 0 : -1}
              className="tab"
              onKeyDown={(e) => onKey(e, i)}
              title={copy.tabHints[top]}
            >
              <span className="tab-step">{i}</span>
              {copy.tabs[top]}
              {badges[top] ? <span className="badge">{badges[top]}</span> : null}
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

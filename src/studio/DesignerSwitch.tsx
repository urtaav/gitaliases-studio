import { copy } from '../copy';
import { DESIGNER_TABS, type StudioTab } from '../app/router';

/** Sub-navigation between the four designers. */
export function DesignerSwitch({ active }: { active: StudioTab }) {
  return (
    <nav className="designer-switch" aria-label="Designers">
      {DESIGNER_TABS.map((tab) => (
        <a
          key={tab}
          href={`#/studio/${tab}`}
          className="btn btn-small"
          aria-current={tab === active ? 'page' : undefined}
        >
          {copy.designers[tab as keyof typeof copy.designers]}
        </a>
      ))}
    </nav>
  );
}

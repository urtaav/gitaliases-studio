import { copy } from '../copy';
import type { CommandPart } from '../core/explain';

interface Props {
  parts: CommandPart[];
  focus?: string | null;
  onFocus?(source: string | null): void;
  /** Small, closed-by-default version used under a command block. */
  compact?: boolean;
}

/** Lists each piece of a command next to what it means. */
export function CommandExplain({ parts, focus = null, onFocus = () => {}, compact = false }: Props) {
  const list = (
    <ul className="explain-list">
      {parts.map((p, i) => (
        <li
          key={i}
          tabIndex={0}
          className={focus === p.source ? 'is-focus' : undefined}
          onMouseEnter={() => onFocus(p.source)}
          onMouseLeave={() => onFocus(null)}
          onFocus={() => onFocus(p.source)}
          onBlur={() => onFocus(null)}
        >
          <code>{p.text}</code>
          <span>{p.explanation}</span>
        </li>
      ))}
    </ul>
  );

  if (compact) {
    return (
      <details className="explain-compact">
        <summary>{copy.explain.toggle}</summary>
        {list}
      </details>
    );
  }
  return (
    <details className="panel explain" open>
      <summary>
        <h2>{copy.explain.title}</h2>
      </summary>
      <p className="help">{copy.explain.hint}</p>
      {list}
    </details>
  );
}

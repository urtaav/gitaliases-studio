import type { CSSProperties } from 'react';
import type { ColorAttr } from '../core/colors';
import type { Segment } from '../core/preview';

const ATTR_STYLE: Record<ColorAttr, CSSProperties> = {
  bold: { fontWeight: 700 },
  dim: { opacity: 0.6 },
  italic: { fontStyle: 'italic' },
  ul: { textDecoration: 'underline' },
  reverse: { filter: 'invert(1)' },
  strike: { textDecoration: 'line-through' },
};

interface Props {
  lines: Segment[][];
  title: string;
  note?: string;
  bg: string;
  fg: string;
  /** Segments whose uid matches are highlighted. */
  focus: string | null;
}

/** A fake terminal that draws preview lines with their colors. */
export function TermPreview({ lines, title, note, bg, fg, focus }: Props) {
  return (
    <section className="term" aria-label={title}>
      <div className="term-bar">
        <span>{title}</span>
        {note && <span>{note}</span>}
      </div>
      <div className="term-body" style={{ background: bg }}>
        {lines.map((line, i) => (
          <div key={i}>
            {line.length === 0 ? ' ' : null}
            {line.map((s, j) => (
              <span
                key={j}
                className={focus && s.uid === focus ? 'seg-hi' : undefined}
                style={{ color: s.color ?? fg, ...Object.assign({}, ...s.attrs.map((a) => ATTR_STYLE[a])) }}
              >
                {s.text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

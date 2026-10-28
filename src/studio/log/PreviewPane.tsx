import { copy } from '../../copy';
import { renderPreview } from '../../core/preview';
import { SAMPLE_COMMITS } from '../../data/sampleCommits';
import type { LogRecipe } from '../../core/logFormat';
import type { ColorAttr } from '../../core/colors';

const ATTR_STYLE: Record<ColorAttr, React.CSSProperties> = {
  bold: { fontWeight: 700 },
  dim: { opacity: 0.6 },
  italic: { fontStyle: 'italic' },
  ul: { textDecoration: 'underline' },
  reverse: { filter: 'invert(1)' },
  strike: { textDecoration: 'line-through' },
};

interface Props {
  recipe: LogRecipe;
  meName: string;
  terminalBg: string;
  terminalFg: string;
  aliasName: string;
  focusUid: string | null;
}

export function PreviewPane({ recipe, meName, terminalBg, terminalFg, aliasName, focusUid }: Props) {
  const lines = renderPreview(recipe, SAMPLE_COMMITS, meName);
  return (
    <section className="term" aria-label={copy.log.preview}>
      <div className="term-bar">
        <span>
          $ git {aliasName || 'alias'}
        </span>
        <span>{copy.log.previewNote}</span>
      </div>
      <div className="term-body" style={{ background: terminalBg }}>
        {lines.map((line, i) => (
          <div key={i}>
            {line.length === 0 ? ' ' : null}
            {line.map((s, j) => (
              <span
                key={j}
                className={focusUid && s.uid === focusUid ? 'seg-hi' : undefined}
                style={{
                  color: s.color ?? terminalFg,
                  ...Object.assign({}, ...s.attrs.map((a) => ATTR_STYLE[a])),
                }}
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

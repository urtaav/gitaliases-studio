import { useState } from 'react';
import { copy } from '../copy';
import { explainAlias } from '../core/explainAlias';
import { CommandExplain } from './CommandExplain';

/** Paste any alias or git command and see it explained. Nothing is stored. */
export function ExplainAny() {
  const [text, setText] = useState('');
  const parts = text.trim() ? explainAlias({ value: text }) : [];
  return (
    <section className="panel" aria-labelledby="explain-any" style={{ marginBottom: 16 }}>
      <h2 id="explain-any">{copy.explain.anyTitle}</h2>
      <p className="help">{copy.explain.anyHelp}</p>
      <label htmlFor="explain-any-input" className="sr-only">
        {copy.explain.anyTitle}
      </label>
      <input
        id="explain-any-input"
        type="text"
        value={text}
        spellCheck={false}
        placeholder={copy.explain.anyPlaceholder}
        onChange={(e) => setText(e.target.value)}
        style={{ width: '100%', fontFamily: 'var(--font)' }}
      />
      {parts.length > 0 ? (
        <CommandExplain parts={parts} />
      ) : (
        <p className="help" style={{ marginTop: 8 }}>
          {copy.explain.anyEmpty}
        </p>
      )}
    </section>
  );
}

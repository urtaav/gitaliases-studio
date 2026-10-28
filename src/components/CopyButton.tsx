import { useState } from 'react';
import { copy } from '../copy';
import { CommandExplain } from './CommandExplain';
import type { CommandPart } from '../core/explain';

async function writeClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for browsers that block the clipboard API.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-small"
      onClick={async () => {
        await writeClipboard(text);
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
    >
      <span aria-live="polite">{done ? copy.copied : (label ?? copy.copy)}</span>
    </button>
  );
}

/** A command with a copy button and, when given, a "What does this do?" breakdown. */
export function CommandBlock({ text, label, parts }: { text: string; label?: string; parts?: CommandPart[] }) {
  return (
    <div className="cmd">
      <pre>
        <code>{text}</code>
      </pre>
      <CopyButton text={text} label={label} />
      {parts && parts.length > 0 && <CommandExplain parts={parts} compact />}
    </div>
  );
}

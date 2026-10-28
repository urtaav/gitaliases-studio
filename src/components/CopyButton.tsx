import { useState } from 'react';
import { copy } from '../copy';

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

export function CopyButton({ text, label = copy.copy }: { text: string; label?: string }) {
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
      <span aria-live="polite">{done ? copy.copied : label}</span>
    </button>
  );
}

export function CommandBlock({ text, label }: { text: string; label?: string }) {
  return (
    <div className="cmd">
      <pre>
        <code>{text}</code>
      </pre>
      <CopyButton text={text} label={label} />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { copy, REPO_URL } from '../copy';
import { ThemeSelect } from '../studio/StudioLayout';

const LONG = 'git log --oneline --graph --decorate --all';
const SHORT = 'git lg';

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Types the long command, then shows the alias that replaces it. Static with reduced motion. */
function Demo() {
  const still = prefersReducedMotion();
  const [typed, setTyped] = useState(still ? LONG.length : 0);
  const [showShort, setShowShort] = useState(still);

  useEffect(() => {
    if (still) return;
    if (typed < LONG.length) {
      const id = setTimeout(() => setTyped((n) => n + 1), 45);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setShowShort(true), 700);
    return () => clearTimeout(id);
  }, [typed, still]);

  return (
    <div className="demo" aria-label={`Instead of typing ${LONG}, type ${SHORT}.`} role="img">
      <div className="term-bar">
        <span>terminal</span>
        <span>same result, fewer keys</span>
      </div>
      <div className="demo-body" aria-hidden="true">
        <div>
          <span className="prompt">$ </span>
          <span className="long">{LONG.slice(0, typed)}</span>
          {!showShort && <span className="caret">&nbsp;</span>}
        </div>
        {showShort && (
          <div style={{ marginTop: 10 }}>
            <span className="prompt">$ </span>
            <span className="short">{SHORT}</span>
            <span className="caret">&nbsp;</span>
          </div>
        )}
      </div>
    </div>
  );
}

const PROBLEMS = [
  {
    title: 'Long commands',
    body: 'git log --oneline --graph --decorate --all is a lot to type ten times a day.',
  },
  {
    title: 'Hard to set up',
    body: 'Creating an alias means remembering git config syntax and getting every quote right.',
  },
  {
    title: 'Quotes break across terminals',
    body: 'A command that works in Bash fails in PowerShell, and the error message rarely tells you why.',
  },
  {
    title: 'Hard to share',
    body: 'Your favorite aliases live inside one computer. Moving them to a new laptop or a teammate is a chore.',
  },
];

const GLOSSARY = [
  ['Alias', 'A short name you invent for a longer git command. You type git st and git runs git status.'],
  ['Terminal', 'The window where you type commands: PowerShell or Command Prompt on Windows, Terminal on macOS and Linux.'],
  ['.gitconfig', 'A text file in your home folder where git keeps your settings, including aliases.'],
  ['Global config', 'Settings that apply to every repository on your computer, not just one project.'],
];

export function Landing() {
  return (
    <div className="landing">
      <nav className="landing-nav" aria-label="Main">
        <a className="window-title" href="#/">
          {copy.appName}
        </a>
        <div className="btn-row">
          <ThemeSelect id="landing-theme" />
          <a className="btn" href={REPO_URL}>
            GitHub
          </a>
        </div>
      </nav>

      <main id="content">
        <section className="hero">
          <h1>Git aliases without the syntax.</h1>
          <p>
            Pick, design and apply shortcuts for the git commands you use every day. You see what each one does, you
            choose your terminal, and you get commands that work the first time.
          </p>
          <div className="btn-row">
            <a className="btn btn-primary" href="#/studio/aliases">
              Open the studio
            </a>
            <a className="btn" href="#/studio/catalog">
              Browse popular aliases
            </a>
          </div>
          <Demo />
        </section>

        <section className="section" aria-labelledby="problem">
          <h2 id="problem">Why it exists</h2>
          <div className="problems">
            {PROBLEMS.map((p) => (
              <article key={p.title}>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="how">
          <h2 id="how">How it works</h2>
          <ol className="how">
            <li>
              <b>1. Import</b>
              Paste the aliases you already have, or start from zero. Only the alias section of your settings is read.
            </li>
            <li>
              <b>2. Customize</b>
              Add aliases from the catalog, write your own in two fields, or design how your git history looks.
            </li>
            <li>
              <b>3. Apply</b>
              Download one file and run one line, or copy a command per alias for your terminal.
            </li>
          </ol>
        </section>

        <section className="section" aria-labelledby="glossary">
          <h2 id="glossary">New to the terminal?</h2>
          <dl className="glossary">
            {GLOSSARY.map(([term, def]) => (
              <div key={term} style={{ display: 'contents' }}>
                <dt>{term}</dt>
                <dd>{def}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="section" aria-labelledby="privacy">
          <h2 id="privacy">Your settings stay with you</h2>
          <p className="muted" style={{ maxWidth: '64ch' }}>
            Everything runs in your browser. Nothing you paste or import is uploaded, and the page makes no requests to
            other sites. Your work is saved in this browser only, and you can clear it at any time.
          </p>
        </section>
      </main>

      <footer className="landing-footer">
        <a href={REPO_URL}>Source on GitHub</a>
        <span>MIT license</span>
        <a href={`${REPO_URL}#contributing`}>Add a theme or an alias</a>
      </footer>
    </div>
  );
}

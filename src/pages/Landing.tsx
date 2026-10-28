import { useEffect, useState } from 'react';
import { copy, REPO_URL } from '../copy';
import { LanguageSelect } from '../components/LanguageSelect';
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
    <div className="demo" aria-label={copy.landing.demoLabel(LONG, SHORT)} role="img">
      <div className="term-bar">
        <span>{copy.landing.demoBar}</span>
        <span>{copy.landing.demoNote}</span>
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

export function Landing() {
  const t = copy.landing;
  return (
    <div className="landing">
      <nav className="landing-nav" aria-label="Main">
        <a className="window-title" href="#/">
          {copy.appName}
        </a>
        <div className="btn-row">
          <LanguageSelect id="landing-lang" />
          <ThemeSelect id="landing-theme" />
          <a className="btn" href={REPO_URL}>
            GitHub
          </a>
        </div>
      </nav>

      <main id="content">
        <section className="hero">
          <h1>{t.heroTitle}</h1>
          <p>{t.heroBody}</p>
          <div className="btn-row">
            <a className="btn btn-primary" href="#/studio/start">
              {t.open}
            </a>
            <a className="btn" href="#/studio/catalog">
              {t.browse}
            </a>
          </div>
          <Demo />
        </section>

        <section className="section" aria-labelledby="problem">
          <h2 id="problem">{t.whyTitle}</h2>
          <div className="problems">
            {t.problems.map((p) => (
              <article key={p.title}>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="how">
          <h2 id="how">{t.howTitle}</h2>
          <ol className="how">
            {t.how.map((h) => (
              <li key={h.title}>
                <b>{h.title}</b>
                {h.body}
              </li>
            ))}
          </ol>
        </section>

        <section className="section" aria-labelledby="glossary">
          <h2 id="glossary">{t.glossaryTitle}</h2>
          <dl className="glossary">
            {t.glossary.map(([term, def]) => (
              <div key={term} style={{ display: 'contents' }}>
                <dt>{term}</dt>
                <dd>{def}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="section" aria-labelledby="privacy">
          <h2 id="privacy">{t.privacyTitle}</h2>
          <p className="muted" style={{ maxWidth: '64ch' }}>
            {t.privacyBody}
          </p>
        </section>
      </main>

      <footer className="landing-footer">
        <a href={REPO_URL}>{t.source}</a>
        <span>{t.license}</span>
        <a href={`${REPO_URL}#contributing`}>{t.contribute}</a>
      </footer>
    </div>
  );
}

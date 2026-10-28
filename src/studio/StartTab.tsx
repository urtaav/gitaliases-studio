import { copy } from '../copy';

export function StartTab() {
  return (
    <>
      <header className="page-head">
        <h1>{copy.start.title}</h1>
        <p>{copy.start.intro}</p>
      </header>
      <div className="start-grid">
        {copy.start.choices.map((c) => (
          <a key={c.tab} className="start-card" href={`#/studio/${c.tab}`}>
            <h2>{c.title}</h2>
            <p>{c.example}</p>
            <pre aria-hidden="true">{c.sample}</pre>
          </a>
        ))}
      </div>
      <p className="muted" style={{ marginTop: 20 }}>
        <a href="#/studio/catalog">{copy.start.orCatalog}</a>
        <br />
        <a href="#/studio/aliases">{copy.start.orMine}</a>
      </p>
    </>
  );
}

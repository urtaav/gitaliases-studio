import { useState } from 'react';
import { copy } from '../copy';
import { AliasForm } from '../components/AliasForm';
import { CATALOG, type CatalogEntry } from '../data/catalog';
import { inferType } from '../core/validate';
import { useWorkspace } from '../state/WorkspaceContext';
import type { Alias } from '../core/types';

const toAlias = (e: CatalogEntry): Alias => ({
  name: e.name,
  value: e.value,
  type: inferType(e.value),
  description: e.description,
});

export function CatalogTab() {
  const { state, dispatch } = useWorkspace();
  const [query, setQuery] = useState('');
  const [clash, setClash] = useState<CatalogEntry | null>(null);
  const [renaming, setRenaming] = useState<CatalogEntry | null>(null);

  const q = query.trim().toLowerCase();
  const groups = CATALOG.map((g) => ({
    ...g,
    entries: g.entries.filter(
      (e) => !q || e.name.includes(q) || e.description.toLowerCase().includes(q) || e.value.includes(q),
    ),
  })).filter((g) => g.entries.length);

  const existing = (name: string) => state.aliases.find((a) => a.name.toLowerCase() === name);
  const names = state.aliases.map((a) => a.name);

  const add = (e: CatalogEntry) => {
    const mine = existing(e.name);
    if (mine && mine.value !== e.value) {
      setClash(e);
      return;
    }
    dispatch({ type: 'upsert', alias: toAlias(e) });
  };

  return (
    <>
      <header className="page-head">
        <h1>{copy.catalog.title}</h1>
        <p>{copy.catalog.intro}</p>
      </header>

      <div className="field" style={{ maxWidth: 420 }}>
        <label htmlFor="cat-search">{copy.catalog.search}</label>
        <input
          id="cat-search"
          type="search"
          value={query}
          placeholder={copy.catalog.searchPlaceholder}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {renaming && (
        <AliasForm
          initial={{ ...toAlias(renaming), name: '' }}
          existingNames={names}
          onSave={(a) => {
            dispatch({ type: 'upsert', alias: a });
            setRenaming(null);
          }}
          onCancel={() => setRenaming(null)}
        />
      )}

      {!groups.length && <p className="muted">{copy.catalog.noResults(query)}</p>}

      {groups.map((g) => (
        <section key={g.id} className="catalog-group" aria-labelledby={`cat-${g.id}`}>
          <h3 id={`cat-${g.id}`}>{g.title}</h3>
          <div className="cards">
            {g.entries.map((e) => {
              const mine = existing(e.name);
              const isAdded = mine?.value === e.value;
              return (
                <article key={e.name} className="card">
                  <div className="alias-name">git {e.name}</div>
                  <p className="alias-desc">{e.description}</p>
                  <div className="alias-cmd">
                    runs <code>git {e.value}</code>
                  </div>
                  <div className="alias-cmd">
                    example <code>{e.example}</code>
                  </div>
                  {e.warning && (
                    <p className="help" style={{ color: 'var(--warn)' }}>
                      {copy.catalog.warning}: {e.warning}
                    </p>
                  )}
                  {clash === e && mine && (
                    <div className="dialog notice notice-warn" role="group" aria-label={copy.catalog.clashTitle(e.name)}>
                      <p>
                        {copy.catalog.clashTitle(e.name)}: <code>{mine.value}</code>
                      </p>
                      <div className="btn-row">
                        <button
                          type="button"
                          className="btn btn-small"
                          onClick={() => {
                            dispatch({ type: 'upsert', alias: toAlias(e), originalName: mine.name });
                            setClash(null);
                          }}
                        >
                          {copy.catalog.clashReplace}
                        </button>
                        <button
                          type="button"
                          className="btn btn-small"
                          onClick={() => {
                            setRenaming(e);
                            setClash(null);
                            window.scrollTo({ top: 0 });
                          }}
                        >
                          {copy.catalog.clashRename}
                        </button>
                        <button type="button" className="btn btn-small" onClick={() => setClash(null)}>
                          {copy.catalog.clashCancel}
                        </button>
                      </div>
                    </div>
                  )}
                  <footer>
                    <span />
                    <button
                      type="button"
                      className={`btn btn-small${isAdded ? '' : ' btn-primary'}`}
                      disabled={isAdded}
                      onClick={() => add(e)}
                      aria-label={`${copy.catalog.add} git ${e.name}`}
                    >
                      {isAdded ? copy.catalog.added : copy.catalog.add}
                    </button>
                  </footer>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}

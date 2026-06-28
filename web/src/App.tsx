import { useEffect, useMemo, useState } from 'react';
import type { Template, TemplatesData } from './types';
import TemplateCard from './components/TemplateCard';
import TemplateModal from './components/TemplateModal';
import Filters, { EMPTY_FILTERS, type FilterState } from './components/Filters';

type LoadState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'ready'; data: TemplatesData };

export default function App() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<Template | null>(null);

  useEffect(() => {
    fetch('/data/templates.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: TemplatesData) =>
        setLoad(data.templates?.length ? { status: 'ready', data } : { status: 'empty' }),
      )
      .catch(() => setLoad({ status: 'empty' }));
  }, []);

  const templates = load.status === 'ready' ? load.data.templates : [];

  const facets = useMemo(() => {
    const uniq = (xs: string[]) => Array.from(new Set(xs)).sort();
    return {
      schemes: uniq(templates.map((t) => t.scheme)),
      formalities: uniq(templates.map((t) => t.formality)),
      moods: uniq(templates.flatMap((t) => t.mood)),
    };
  }, [templates]);

  const shown = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return templates.filter((t) => {
      if (filters.scheme && t.scheme !== filters.scheme) return false;
      if (filters.formality && t.formality !== filters.formality) return false;
      if (filters.mood && !t.mood.includes(filters.mood)) return false;
      if (q) {
        const hay = `${t.name} ${t.tagline} ${t.mood.join(' ')} ${t.tone.join(' ')} ${t.best_for}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [templates, filters]);

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <h1>Frontend Slides — Template Gallery</h1>
          <p>Live first-slide previews of every bold template. Click any card to browse the full deck.</p>
        </div>
        {load.status === 'ready' && (
          <Filters
            state={filters}
            facets={facets}
            shown={shown.length}
            total={templates.length}
            onChange={setFilters}
          />
        )}
      </header>

      {load.status === 'loading' && <p className="state">Loading templates…</p>}

      {load.status === 'empty' && (
        <div className="state state--empty">
          <h2>No templates vendored yet</h2>
          <p>The gallery renders the real template HTML, which is fetched from upstream once:</p>
          <pre>npm run fetch</pre>
          <p>Then reload this page.</p>
        </div>
      )}

      {load.status === 'ready' && (
        <main className="grid">
          {shown.map((t) => (
            <TemplateCard key={t.slug} template={t} onOpen={setSelected} />
          ))}
          {shown.length === 0 && <p className="state">No templates match these filters.</p>}
        </main>
      )}

      {load.status === 'ready' && (
        <footer className="app__footer">
          Templates from <code>{load.data.source}</code> · {load.data.fetched_count} vendored
        </footer>
      )}

      {selected && <TemplateModal template={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

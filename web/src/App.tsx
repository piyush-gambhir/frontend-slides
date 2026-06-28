import { useEffect, useMemo, useState } from 'react';
import type { Template, TemplatesData } from './types';
import TemplateCard from './components/TemplateCard';
import PresentDialog from './components/PresentDialog';
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
    <div className="mx-auto max-w-[1480px] px-7 pb-20 pt-8">
      <header className="sticky top-0 z-20 bg-gradient-to-b from-[#f5f5f7] from-80% to-transparent pb-4">
        <div>
          <h1 className="text-[27px] font-bold tracking-tight">Frontend Slides — Template Gallery</h1>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            Live first-slide previews of every bold template. Click any card to open the full slideshow.
          </p>
        </div>
        {load.status === 'ready' && (
          <Filters state={filters} facets={facets} shown={shown.length} total={templates.length} onChange={setFilters} />
        )}
      </header>

      {load.status === 'loading' && <p className="py-16 text-center text-muted-foreground">Loading templates…</p>}

      {load.status === 'empty' && (
        <div className="mx-auto mt-16 max-w-xl rounded-xl bg-card p-8 text-center shadow-sm">
          <h2 className="mb-2 text-xl font-semibold">No templates vendored yet</h2>
          <p className="text-muted-foreground">The gallery renders the real template HTML, fetched from upstream once:</p>
          <pre className="my-4 inline-block rounded-md bg-muted px-4 py-3 text-sm">npm run fetch</pre>
          <p className="text-muted-foreground">Then reload this page.</p>
        </div>
      )}

      {load.status === 'ready' && (
        <main className="mt-3 grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(330px,1fr))]">
          {shown.map((t) => (
            <TemplateCard key={t.slug} template={t} onOpen={setSelected} />
          ))}
          {shown.length === 0 && (
            <p className="col-span-full py-16 text-center text-muted-foreground">No templates match these filters.</p>
          )}
        </main>
      )}

      {load.status === 'ready' && (
        <footer className="mt-10 text-center text-xs text-muted-foreground">
          Templates from <code className="text-foreground">{load.data.source}</code> · {load.data.fetched_count} vendored
        </footer>
      )}

      <PresentDialog template={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

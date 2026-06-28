export interface FilterState {
  query: string;
  scheme: string;
  formality: string;
  mood: string;
}

export const EMPTY_FILTERS: FilterState = { query: '', scheme: '', formality: '', mood: '' };

interface Facets {
  schemes: string[];
  formalities: string[];
  moods: string[];
}

export default function Filters({
  state,
  facets,
  shown,
  total,
  onChange,
}: {
  state: FilterState;
  facets: Facets;
  shown: number;
  total: number;
  onChange: (next: FilterState) => void;
}) {
  const set = (patch: Partial<FilterState>) => onChange({ ...state, ...patch });
  const active = state.query || state.scheme || state.formality || state.mood;

  return (
    <div className="filters">
      <input
        className="filters__search"
        type="search"
        placeholder="Search name, tagline, mood…"
        value={state.query}
        onChange={(e) => set({ query: e.target.value })}
      />
      <Select label="Scheme" value={state.scheme} options={facets.schemes} onChange={(v) => set({ scheme: v })} />
      <Select label="Formality" value={state.formality} options={facets.formalities} onChange={(v) => set({ formality: v })} />
      <Select label="Mood" value={state.mood} options={facets.moods} onChange={(v) => set({ mood: v })} />
      <span className="filters__count">{shown} / {total}</span>
      {active ? (
        <button className="filters__clear" onClick={() => onChange(EMPTY_FILTERS)}>Clear</button>
      ) : null}
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select className="filters__select" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      <option value="">{label}: all</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

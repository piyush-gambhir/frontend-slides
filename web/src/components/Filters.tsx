import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface FilterState {
  query: string;
  scheme: string;
  formality: string;
  mood: string;
}

export const EMPTY_FILTERS: FilterState = { query: '', scheme: '', formality: '', mood: '' };

const ALL = '__all__';

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
    <div className="flex flex-wrap items-center gap-2.5">
      <Input
        type="search"
        placeholder="Search name, tagline, mood…"
        value={state.query}
        onChange={(e) => set({ query: e.target.value })}
        className="min-w-[200px] flex-1"
      />
      <FacetSelect label="Scheme" value={state.scheme} options={facets.schemes} onChange={(v) => set({ scheme: v })} />
      <FacetSelect label="Formality" value={state.formality} options={facets.formalities} onChange={(v) => set({ formality: v })} />
      <FacetSelect label="Mood" value={state.mood} options={facets.moods} onChange={(v) => set({ mood: v })} />
      <span className="ml-1 whitespace-nowrap text-sm tabular-nums text-muted-foreground">
        {shown} / {total}
      </span>
      {active ? (
        <Button variant="secondary" size="sm" onClick={() => onChange(EMPTY_FILTERS)}>
          Clear
        </Button>
      ) : null}
    </div>
  );
}

function FacetSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? '' : v)}>
      <SelectTrigger className="w-[150px] capitalize">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{label}: all</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o} className="capitalize">
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

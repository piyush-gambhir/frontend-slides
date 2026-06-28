import type { Template } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DeckFrame from './DeckFrame';

export default function TemplateCard({ template, onOpen }: { template: Template; onOpen: (t: Template) => void }) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onOpen(template)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(template);
        }
      }}
      className="group cursor-pointer overflow-hidden outline-none transition-all hover:-translate-y-1 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="relative">
        <DeckFrame slug={template.slug} />
        <Badge
          variant={template.scheme === 'dark' ? 'default' : 'secondary'}
          className="absolute right-3 top-3 capitalize shadow-sm backdrop-blur"
        >
          {template.scheme}
        </Badge>
      </div>
      <CardContent>
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-semibold tracking-tight">{template.name}</h3>
          <span className="whitespace-nowrap text-xs text-muted-foreground">{template.slide_count} slides</span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{template.tagline}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {template.mood.slice(0, 3).map((m) => (
            <Badge key={m} variant="secondary">
              {m}
            </Badge>
          ))}
          <Badge variant="muted">{template.formality}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

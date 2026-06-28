import type { Template } from '../types';
import LiveThumbnail from './LiveThumbnail';

export default function TemplateCard({ template, onOpen }: { template: Template; onOpen: (t: Template) => void }) {
  return (
    <button className="card" onClick={() => onOpen(template)} aria-label={`Open ${template.name}`}>
      <div className="card__thumb">
        <LiveThumbnail slug={template.slug} />
        <span className={`badge badge--${template.scheme}`}>{template.scheme}</span>
      </div>
      <div className="card__body">
        <div className="card__head">
          <h3 className="card__name">{template.name}</h3>
          <span className="card__count">{template.slide_count} slides</span>
        </div>
        <p className="card__tagline">{template.tagline}</p>
        <div className="chips">
          {template.mood.slice(0, 3).map((m) => (
            <span className="chip" key={m}>{m}</span>
          ))}
          <span className="chip chip--muted">{template.formality}</span>
        </div>
      </div>
    </button>
  );
}

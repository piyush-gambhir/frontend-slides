import { useEffect } from 'react';
import type { Template } from '../types';
import LiveThumbnail from './LiveThumbnail';

export default function TemplateModal({ template, onClose }: { template: Template; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
        <header className="modal__head">
          <div>
            <h2 className="modal__title">{template.name}</h2>
            <p className="modal__tagline">{template.tagline}</p>
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="modal__stage">
          {/* Interactive: arrow keys / space navigate the real deck inside the iframe. */}
          <LiveThumbnail key={template.slug} slug={template.slug} interactive />
        </div>
        <p className="modal__hint">Click the deck and use ← → / Space to navigate all {template.slide_count} slides.</p>

        <div className="modal__meta">
          <Meta label="Scheme" value={template.scheme} />
          <Meta label="Formality" value={template.formality} />
          <Meta label="Density" value={template.density} />
          <Meta label="Mood" value={template.mood.join(', ')} />
          <Meta label="Tone" value={template.tone.join(', ')} />
          <Meta label="Occasion" value={template.occasion.join(', ')} />
          <Meta label="Best for" value={template.best_for} block />
          <Meta label="Avoid for" value={template.avoid_for} block />
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value, block }: { label: string; value: string; block?: boolean }) {
  return (
    <div className={`meta ${block ? 'meta--block' : ''}`}>
      <span className="meta__label">{label}</span>
      <span className="meta__value">{value}</span>
    </div>
  );
}

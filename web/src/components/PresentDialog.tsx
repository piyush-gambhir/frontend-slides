import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Template } from '../types';
import DeckFrame from './DeckFrame';

/**
 * Opens the real template deck as a near-fullscreen slideshow — exactly how it
 * would look when presented. No metadata panel; just the deck, navigable with
 * the arrow keys / space (click it first to focus).
 *
 * Deliberately a plain portal lightbox rather than Radix Dialog: the shared
 * DialogContent's base styling collapsed the box and pushed the close control
 * off-screen. This is full-control and reliably closeable via the × button, a
 * backdrop click, Escape on the page (window listener), or Escape inside the
 * focused deck iframe (DeckFrame.onEscape).
 */
export default function PresentDialog({ template, onClose }: { template: Template | null; onClose: () => void }) {
  const open = !!template;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!template) return null;

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // click the empty backdrop to close
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(24, 24, 32, 0.55)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="overflow-hidden rounded-xl shadow-2xl ring-1 ring-black/10"
        style={{ position: 'relative', width: 'min(96vw, calc(88vh * 16 / 9))' }}
      >
        <DeckFrame key={template.slug} slug={template.slug} interactive onEscape={onClose} />
      </div>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="flex items-center justify-center rounded-full bg-white text-xl text-foreground shadow-md outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10, height: '40px', width: '40px' }}
      >
        ×
      </button>
    </div>,
    document.body,
  );
}

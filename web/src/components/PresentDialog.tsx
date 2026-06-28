import type { Template } from '../types';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import DeckFrame from './DeckFrame';

/**
 * Opens the real template deck as a near-fullscreen slideshow — exactly how it
 * would look when presented. No metadata panel; just the deck, navigable with
 * the arrow keys / space (click it first to focus). The box is the largest 16:9
 * that fits the viewport.
 */
export default function PresentDialog({ template, onClose }: { template: Template | null; onClose: () => void }) {
  return (
    <Dialog open={!!template} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[min(96vw,calc(90vh*16/9))] max-w-none border-0 bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">{template?.name ?? 'Template preview'}</DialogTitle>
        {template && (
          <div className="relative overflow-hidden rounded-xl shadow-2xl ring-1 ring-black/10">
            <DeckFrame key={template.slug} slug={template.slug} interactive />
          </div>
        )}
        <DialogClose
          aria-label="Close"
          className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg text-foreground shadow-md outline-none ring-offset-2 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          ×
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

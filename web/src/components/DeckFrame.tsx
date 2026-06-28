import { useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Renders a template deck in an iframe that ALWAYS fits a 16:9 box, at any size.
 *
 * The decks are built for a full 1920×1080 presentation viewport; in a small
 * iframe they don't scale down — they crop. So we render the iframe at its true
 * 1920×1080 design size (where it looks right) and uniformly shrink the whole
 * thing with `transform: scale(factor)`.
 *
 * `factor` has to be a unitless number, so it's measured from the container
 * width (one-time on mount + on window resize, with ResizeObserver as a bonus
 * when available). We avoid depending on observers alone because they don't fire
 * reliably in every embedded context.
 */
const DESIGN_W = 1920;
const DESIGN_H = 1080;

export default function DeckFrame({
  slug,
  interactive = false,
  className,
}: {
  slug: string;
  interactive?: boolean;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / DESIGN_W);
    measure();
    window.addEventListener('resize', measure);
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }
    return () => {
      window.removeEventListener('resize', measure);
      ro?.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className={cn('relative aspect-video w-full overflow-hidden bg-muted', className)}>
      <iframe
        src={`/templates/${slug}.html`}
        title={`${slug} preview`}
        loading="lazy"
        scrolling="no"
        tabIndex={interactive ? 0 : -1}
        onLoad={() => setLoaded(true)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${DESIGN_W}px`,
          height: `${DESIGN_H}px`,
          border: 0,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
          pointerEvents: interactive ? 'auto' : 'none',
          opacity: loaded && scale > 0 ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
      />
      {(!loaded || scale === 0) && <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden="true" />}
    </div>
  );
}

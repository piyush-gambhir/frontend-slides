import { useState } from 'react';

/**
 * Live first-slide thumbnail: an iframe of the template's self-contained HTML.
 * The deck's own scaling fills the 16:9 box, so we see slide 1 rendered for
 * real — no screenshots. Browser-native `loading="lazy"` defers offscreen
 * iframes; we avoid IntersectionObserver because it doesn't fire reliably in
 * every embedded/headless context. The iframe is non-interactive in the grid
 * (clicks open the modal); interactive in the modal for full-deck navigation.
 */
export default function LiveThumbnail({ slug, interactive = false }: { slug: string; interactive?: boolean }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`thumb ${interactive ? 'thumb--full' : ''}`}>
      <iframe
        className="thumb__frame"
        src={`/templates/${slug}.html`}
        title={`${slug} preview`}
        loading="lazy"
        scrolling="no"
        tabIndex={interactive ? 0 : -1}
        onLoad={() => setLoaded(true)}
        style={{ pointerEvents: interactive ? 'auto' : 'none', opacity: loaded ? 1 : 0 }}
      />
      {!loaded && <div className="thumb__skeleton" aria-hidden="true" />}
    </div>
  );
}

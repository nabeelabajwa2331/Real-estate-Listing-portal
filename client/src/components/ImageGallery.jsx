import { useState } from 'react';

// Main photo plus a thumbnail strip, with prev/next controls. Renders a
// graceful placeholder when a listing has no images yet.
export default function ImageGallery({ images = [], title = '' }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return <div className="gallery gallery-empty">No photos for this listing</div>;
  }

  const current = images[Math.min(active, images.length - 1)];
  const go = (step) => setActive((i) => (i + step + images.length) % images.length);

  return (
    <div className="gallery">
      <div className="gallery-main">
        <img src={current.url} alt={`${title} — photo ${active + 1}`} />

        {images.length > 1 && (
          <>
            <button type="button" className="gallery-nav prev" onClick={() => go(-1)} aria-label="Previous photo">
              ‹
            </button>
            <button type="button" className="gallery-nav next" onClick={() => go(1)} aria-label="Next photo">
              ›
            </button>
            <span className="gallery-count">
              {active + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((img, i) => (
            <button
              type="button"
              key={img.url}
              className={i === active ? 'thumb active' : 'thumb'}
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1}`}
            >
              <img src={img.url} alt={`Thumbnail ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

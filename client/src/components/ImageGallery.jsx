import { useState } from 'react';
import { assetUrl } from '../config/api.js';
import SmartImage from './SmartImage.jsx';

// Main photo plus a thumbnail strip, with prev/next controls. Renders a
// graceful placeholder when a listing has no images yet.
export default function ImageGallery({ images = [], title = '' }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="gallery">
        <div className="gallery-main">
          <SmartImage alt={`No photos for ${title || 'this listing'}`} />
        </div>
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];
  const go = (step) => setActive((i) => (i + step + images.length) % images.length);

  return (
    <div className="gallery">
      <div className="gallery-main">
        <SmartImage src={assetUrl(current.url)} alt={`${title} — photo ${active + 1}`} loading="eager" />

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
              <SmartImage src={assetUrl(img.url)} alt={`Thumbnail ${i + 1}`} loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

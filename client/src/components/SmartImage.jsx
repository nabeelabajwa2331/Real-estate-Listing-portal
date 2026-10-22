import { FALLBACK_IMAGE } from '../config/api.js';

// An <img> that always shows something: if the listing has no photo, or the
// remote photo fails to load, it falls back to the bundled placeholder.
export default function SmartImage({ src, alt = '', loading, ...rest }) {
  return (
    <img
      src={src || FALLBACK_IMAGE}
      alt={alt}
      loading={loading}
      onError={(event) => {
        if (event.currentTarget.getAttribute('src') === FALLBACK_IMAGE) return;
        event.currentTarget.src = FALLBACK_IMAGE;
      }}
      {...rest}
    />
  );
}

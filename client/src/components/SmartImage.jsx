import { useEffect, useState } from 'react';
import { FALLBACK_IMAGE } from '../config/api.js';

// An <img> that always shows something: if the listing has no photo, or the
// remote photo fails to load, it falls back to the bundled placeholder.
//
// The failure is remembered in state. Without that, every parent re-render
// would put the broken URL back on the element, the browser would retry it,
// fail again, and the image would appear to "load forever".
export default function SmartImage({ src, alt = '', loading, ...rest }) {
  const [failed, setFailed] = useState(false);

  // A different photo gets a fresh chance to load.
  useEffect(() => {
    setFailed(false);
  }, [src]);

  const finalSrc = !src || failed ? FALLBACK_IMAGE : src;

  return (
    <img
      src={finalSrc}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => {
        if (!failed) setFailed(true);
      }}
      {...rest}
    />
  );
}

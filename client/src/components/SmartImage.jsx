import { useEffect, useState } from 'react';
import { FALLBACK_IMAGE } from '../config/api.js';

export default function SmartImage({ src, alt = '', loading, ...rest }) {
  const [failed, setFailed] = useState(false);

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

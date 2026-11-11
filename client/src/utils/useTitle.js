import { useEffect } from 'react';

const DEFAULT_TITLE = 'RealEstate — Property listings in Pakistan';

// Keeps the browser tab title in step with the current page. Screen readers and
// search engines both use it to distinguish pages that share the SPA shell.
export function useTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · RealEstate` : DEFAULT_TITLE;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

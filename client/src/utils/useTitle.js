import { useEffect } from 'react';

const DEFAULT_TITLE = 'RealEstate — Property listings in Pakistan';

export function useTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · RealEstate` : DEFAULT_TITLE;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

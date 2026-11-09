import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api/axios.js';
import { useAuth } from './AuthContext.jsx';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [ids, setIds] = useState(() => new Set());

  // Load the saved ids once per signed-in user.
  useEffect(() => {
    if (!user) {
      setIds(new Set());
      return undefined;
    }
    let active = true;
    api
      .get('/favorites/ids')
      .then((res) => active && setIds(new Set(res.data.ids)))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user]);

  const isFavorite = useCallback((id) => ids.has(id), [ids]);

  // Optimistic toggle: update the UI first, revert if the request fails.
  const toggle = useCallback(
    async (id) => {
      // Nothing to save when no one is signed in (the UI hides the control).
      if (!user) return;

      const currentlySaved = ids.has(id);
      const apply = (add) =>
        setIds((prev) => {
          const next = new Set(prev);
          if (add) next.add(id);
          else next.delete(id);
          return next;
        });

      apply(!currentlySaved);
      try {
        if (currentlySaved) await api.delete(`/favorites/${id}`);
        else await api.post(`/favorites/${id}`);
      } catch {
        apply(currentlySaved);
      }
    },
    [ids, user]
  );

  return (
    <FavoritesContext.Provider value={{ ids, isFavorite, toggle, count: ids.size }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api, { errorMessage } from '../api/axios.js';
import { useAuth } from './AuthContext.jsx';
import { applyFavorite, favoriteIdSet } from '../utils/favorites.js';

const FavoritesContext = createContext(null);

// Single source of truth for the signed-in user's saved properties.
//
// The full listings (not just ids) are kept here so every surface that shows a
// saved-property count — the navbar badge, the dashboard sidebar, the overview
// metrics and the saved-items page — reads the same data. That removes the
// stale-count problem that appeared when each page fetched its own copy.
export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  // Refs mirror the latest committed state so rapid clicks (before React has
  // re-rendered) still toggle from the correct previous value.
  const itemsRef = useRef([]);
  const generation = useRef(0);
  // One serialised request chain per listing id. Requests for the same listing
  // never overlap, so the final server state matches the final click.
  const chains = useRef(new Map());
  // Bumped on every click; a failed request only rolls back if it is still the
  // newest action for that listing.
  const versions = useRef(new Map());

  const commit = useCallback((next) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) {
      generation.current += 1;
      commit([]);
      setLoading(false);
      setLoaded(false);
      setError('');
      return;
    }

    const run = generation.current + 1;
    generation.current = run;
    setLoading(true);
    setError('');

    // Let any in-flight save/unsave finish first, so a refresh can never
    // overwrite a newer optimistic change with an older server snapshot.
    const pending = [...chains.current.values()];
    if (pending.length) {
      await Promise.allSettled(pending);
      if (generation.current !== run) return;
    }

    // Remember which listings the user changes while this request is in
    // flight; those local choices win over the snapshot that was read before.
    const versionsAtStart = new Map(versions.current);

    try {
      const { data } = await api.get('/favorites');
      if (generation.current !== run) return; // a newer user/request won

      let merged = data.listings || [];
      for (const [id, version] of versions.current) {
        if (versionsAtStart.get(id) === version) continue;
        const item = itemsRef.current.find((entry) => entry._id === id);
        if (item) {
          if (!merged.some((entry) => entry._id === id)) merged = [item, ...merged];
        } else {
          merged = merged.filter((entry) => entry._id !== id);
        }
      }
      commit(merged);
    } catch (err) {
      if (generation.current === run) setError(errorMessage(err));
    } finally {
      if (generation.current === run) {
        setLoading(false);
        setLoaded(true);
      }
    }
  }, [userId, commit]);

  // Load once per signed-in user and clear everything on sign-out. The user id
  // (not the whole object) is the dependency so editing a profile does not
  // trigger a pointless reload.
  useEffect(() => {
    chains.current.clear();
    versions.current.clear();
    if (!userId) {
      generation.current += 1;
      commit([]);
      setLoading(false);
      setLoaded(false);
      setError('');
      return;
    }
    refresh();
  }, [userId, refresh, commit]);

  const ids = useMemo(() => favoriteIdSet(items), [items]);
  const count = items.length;

  const isFavorite = useCallback((id) => ids.has(id), [ids]);

  // Optimistic toggle with rollback. `listing` should be the listing object
  // being toggled so the card can appear/disappear immediately.
  const toggle = useCallback(
    (id, listing) => {
      if (!userId || !id) return Promise.resolve(false);

      const version = (versions.current.get(id) || 0) + 1;
      versions.current.set(id, version);
      setError('');

      const previousItem = itemsRef.current.find((item) => item._id === id);
      const wasSaved = Boolean(previousItem);
      const nextSaved = !wasSaved;
      const item = listing || previousItem;

      // Apply the new state immediately so every count and card reacts at once.
      if (item) commit(applyFavorite(itemsRef.current, item, nextSaved));

      const previous = chains.current.get(id) || Promise.resolve();
      const task = previous.then(async () => {
        try {
          if (nextSaved) await api.post(`/favorites/${id}`);
          else await api.delete(`/favorites/${id}`);
          return true;
        } catch (err) {
          // Only undo if the user has not toggled this listing again since.
          if (versions.current.get(id) === version) {
            if (item) commit(applyFavorite(itemsRef.current, item, wasSaved));
            setError(errorMessage(err));
          }
          return false;
        }
      });

      chains.current.set(id, task);
      task.finally(() => {
        if (chains.current.get(id) === task) chains.current.delete(id);
      });
      return task;
    },
    [userId, commit]
  );

  const clearError = useCallback(() => setError(''), []);

  const value = useMemo(
    () => ({
      items,
      ids,
      count,
      loading,
      loaded,
      error,
      isFavorite,
      toggle,
      refresh,
      clearError,
    }),
    [items, ids, count, loading, loaded, error, isFavorite, toggle, refresh, clearError]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export const useFavorites = () => useContext(FavoritesContext);

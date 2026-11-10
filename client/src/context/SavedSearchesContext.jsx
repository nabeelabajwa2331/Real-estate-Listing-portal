import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api, { errorMessage } from '../api/axios.js';
import { useAuth } from './AuthContext.jsx';

const SavedSearchesContext = createContext(null);

// Shared store for the signed-in user's saved searches. The list (and its
// count) is loaded once per account and updated in place when a search is
// saved or deleted, so the overview metric and the dashboard sidebar badge
// change without a page refresh.
export function SavedSearchesProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const searchesRef = useRef([]);
  const generation = useRef(0);
  // Local edits made since the page loaded. A refresh merges these on top of
  // its snapshot so an older server response can never resurrect a deleted
  // search or hide one that was just created.
  const removedIds = useRef(new Set());
  const createdItems = useRef(new Map());

  const commit = useCallback((next) => {
    searchesRef.current = next;
    setSearches(next);
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
    try {
      const { data } = await api.get('/saved-searches');
      if (generation.current !== run) return;

      let merged = (data.searches || []).filter((item) => !removedIds.current.has(item._id));
      for (const [id, item] of createdItems.current) {
        if (!merged.some((entry) => entry._id === id)) merged = [item, ...merged];
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

  useEffect(() => {
    if (!userId) {
      generation.current += 1;
      removedIds.current.clear();
      createdItems.current.clear();
      commit([]);
      setLoading(false);
      setLoaded(false);
      setSaving(false);
      setError('');
      return;
    }
    refresh();
  }, [userId, refresh, commit]);

  // Persists a new search and prepends it to the shared list immediately after
  // the server confirms it. Re-saving identical criteria returns the existing
  // record instead of creating a duplicate (the API enforces the same rule).
  const create = useCallback(
    async (name, params) => {
      setSaving(true);
      setError('');
      try {
        const { data } = await api.post('/saved-searches', { name, params });
        const saved = data.search;
        if (saved) {
          removedIds.current.delete(saved._id);
          createdItems.current.set(saved._id, saved);
          commit([
            saved,
            ...searchesRef.current.filter((item) => item._id !== saved._id),
          ]);
        }
        return data;
      } catch (err) {
        setError(errorMessage(err));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [commit]
  );

  // Optimistic delete: the row and every count disappear at once, and are put
  // back if the request fails.
  const remove = useCallback(
    async (id) => {
      const previous = searchesRef.current;
      const next = previous.filter((item) => item._id !== id);
      if (next.length === previous.length) return true;

      commit(next);
      removedIds.current.add(id);
      setError('');
      try {
        await api.delete(`/saved-searches/${id}`);
        return true;
      } catch (err) {
        removedIds.current.delete(id);
        commit(previous);
        setError(errorMessage(err));
        return false;
      }
    },
    [commit]
  );

  const clearError = useCallback(() => setError(''), []);
  const count = searches.length;

  const value = useMemo(
    () => ({
      searches,
      count,
      loading,
      loaded,
      saving,
      error,
      create,
      remove,
      refresh,
      clearError,
    }),
    [searches, count, loading, loaded, saving, error, create, remove, refresh, clearError]
  );

  return <SavedSearchesContext.Provider value={value}>{children}</SavedSearchesContext.Provider>;
}

export const useSavedSearches = () => useContext(SavedSearchesContext);

import { create } from 'zustand';
import api, { errorMessage } from '../api/axios.js';

export function createSavedSearchesStore(client = api) {
  let generation = 0;
  const removedIds = new Set();
  const createdItems = new Map();

  return create((set, get) => {
    const commit = (searches) => set({ searches, count: searches.length });

    const reset = () => {
      generation += 1;
      removedIds.clear();
      createdItems.clear();
      commit([]);
      set({ loading: false, loaded: false, saving: false, error: '' });
    };

    const refresh = async () => {
      if (!get().userId) {
        generation += 1;
        commit([]);
        set({ loading: false, loaded: false, error: '' });
        return;
      }

      const run = generation + 1;
      generation = run;
      set({ loading: true, error: '' });
      try {
        const { data } = await client.get('/saved-searches');
        if (generation !== run) return;

        let merged = (data?.searches || []).filter((item) => !removedIds.has(item._id));
        for (const [id, item] of createdItems) {
          if (!merged.some((entry) => entry._id === id)) merged = [item, ...merged];
        }
        commit(merged);
      } catch (err) {
        if (generation === run) set({ error: errorMessage(err) });
      } finally {
        if (generation === run) set({ loading: false, loaded: true });
      }
    };

    return {
      userId: null,
      searches: [],
      count: 0,
      loading: false,
      loaded: false,
      saving: false,
      error: '',

      setUser: (userId) => {
        const next = userId || null;
        if (get().userId === next && (next === null || get().loaded || get().loading)) return;
        set({ userId: next });
        if (!next) reset();
        else refresh();
      },

      refresh,

      create: async (name, params) => {
        set({ saving: true, error: '' });
        try {
          const { data } = await client.post('/saved-searches', { name, params });
          const saved = data?.search;
          if (saved) {
            removedIds.delete(saved._id);
            createdItems.set(saved._id, saved);
            commit([saved, ...get().searches.filter((item) => item._id !== saved._id)]);
          }
          return data;
        } catch (err) {
          set({ error: errorMessage(err) });
          throw err;
        } finally {
          set({ saving: false });
        }
      },

      remove: async (id) => {
        const previous = get().searches;
        const next = previous.filter((item) => item._id !== id);
        if (next.length === previous.length) return true;

        commit(next);
        removedIds.add(id);
        set({ error: '' });
        try {
          await client.delete(`/saved-searches/${id}`);
          return true;
        } catch (err) {
          removedIds.delete(id);
          commit(previous);
          set({ error: errorMessage(err) });
          return false;
        }
      },

      clearError: () => set({ error: '' }),
    };
  });
}

export const useSavedSearchesStore = createSavedSearchesStore();

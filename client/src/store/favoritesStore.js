import { create } from 'zustand';
import api, { errorMessage } from '../api/axios.js';
import { applyFavorite, favoriteIdSet } from '../utils/favorites.js';

export function createFavoritesStore(client = api) {
  let generation = 0;
  const chains = new Map();
  const versions = new Map();

  return create((set, get) => {
    const commit = (items) => set({ items, ids: favoriteIdSet(items), count: items.length });

    const reset = () => {
      generation += 1;
      commit([]);
      set({ loading: false, loaded: false, error: '' });
    };

    const refresh = async () => {
      if (!get().userId) {
        reset();
        return;
      }

      const run = generation + 1;
      generation = run;
      set({ loading: true, error: '' });

      const pending = [...chains.values()];
      if (pending.length) {
        await Promise.allSettled(pending);
        if (generation !== run) return;
      }

      const versionsAtStart = new Map(versions);

      try {
        const { data } = await client.get('/favorites');
        if (generation !== run) return; // a newer user/request won

        let merged = data?.listings || [];
        for (const [id, version] of versions) {
          if (versionsAtStart.get(id) === version) continue;
          const item = get().items.find((entry) => entry._id === id);
          if (item) {
            if (!merged.some((entry) => entry._id === id)) merged = [item, ...merged];
          } else {
            merged = merged.filter((entry) => entry._id !== id);
          }
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
      items: [],
      ids: new Set(),
      count: 0,
      loading: false,
      loaded: false,
      error: '',

      setUser: (userId) => {
        const next = userId || null;
        if (get().userId === next && (next === null || get().loaded || get().loading)) return;
        chains.clear();
        versions.clear();
        set({ userId: next });
        if (!next) reset();
        else refresh();
      },

      refresh,

      isFavorite: (id) => get().ids.has(id),

      toggle: (id, listing) => {
        if (!get().userId || !id) return Promise.resolve(false);

        const version = (versions.get(id) || 0) + 1;
        versions.set(id, version);
        set({ error: '' });

        const previousItem = get().items.find((item) => item._id === id);
        const wasSaved = Boolean(previousItem);
        const nextSaved = !wasSaved;
        const item = listing || previousItem;

        if (item) commit(applyFavorite(get().items, item, nextSaved));

        const previous = chains.get(id) || Promise.resolve();
        const task = previous.then(async () => {
          try {
            if (nextSaved) await client.post(`/favorites/${id}`);
            else await client.delete(`/favorites/${id}`);
            return true;
          } catch (err) {
            if (versions.get(id) === version) {
              if (item) commit(applyFavorite(get().items, item, wasSaved));
              set({ error: errorMessage(err) });
            }
            return false;
          }
        });

        chains.set(id, task);
        task.finally(() => {
          if (chains.get(id) === task) chains.delete(id);
        });
        return task;
      },

      clearError: () => set({ error: '' }),
    };
  });
}

export const useFavoritesStore = createFavoritesStore();

import { create } from 'zustand';
import api, { errorMessage } from '../api/axios.js';
import { applyFavorite, favoriteIdSet } from '../utils/favorites.js';

// Global store for the signed-in user's saved properties (Zustand).
//
// The full listings (not just ids) are kept here so every surface that shows a
// saved-property count (the navbar badge, the dashboard sidebar, the overview
// metrics and the saved-items page) reads the same data. Components subscribe
// to just the slice they need, so toggling one card does not re-render
// unrelated parts of the tree the way a single React context value would.
//
// `createFavoritesStore` is exported so tests can build an isolated instance.
export function createFavoritesStore(client = api) {
  // Non-reactive bookkeeping lives in the closure rather than in state: it
  // never needs to trigger a render.
  let generation = 0;
  // One serialised request chain per listing id. Requests for the same listing
  // never overlap, so the final server state matches the final click.
  const chains = new Map();
  // Bumped on every click; a failed request only rolls back if it is still the
  // newest action for that listing.
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

      // Let any in-flight save/unsave finish first, so a refresh can never
      // overwrite a newer optimistic change with an older server snapshot.
      const pending = [...chains.values()];
      if (pending.length) {
        await Promise.allSettled(pending);
        if (generation !== run) return;
      }

      // Remember which listings the user changes while this request is in
      // flight; those local choices win over the snapshot read before.
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

      // Called by <FavoritesProvider> whenever the signed-in account changes.
      // Loads once per user and clears everything on sign-out.
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

      // Optimistic toggle with rollback. `listing` should be the listing object
      // being toggled so the card can appear/disappear immediately.
      toggle: (id, listing) => {
        if (!get().userId || !id) return Promise.resolve(false);

        const version = (versions.get(id) || 0) + 1;
        versions.set(id, version);
        set({ error: '' });

        const previousItem = get().items.find((item) => item._id === id);
        const wasSaved = Boolean(previousItem);
        const nextSaved = !wasSaved;
        const item = listing || previousItem;

        // Apply the new state immediately so every count and card reacts at once.
        if (item) commit(applyFavorite(get().items, item, nextSaved));

        const previous = chains.get(id) || Promise.resolve();
        const task = previous.then(async () => {
          try {
            if (nextSaved) await client.post(`/favorites/${id}`);
            else await client.delete(`/favorites/${id}`);
            return true;
          } catch (err) {
            // Only undo if the user has not toggled this listing again since.
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

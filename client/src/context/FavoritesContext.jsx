import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAuth } from './AuthContext.jsx';
import { useFavoritesStore } from '../store/favoritesStore.js';

// Saved properties now live in a global Zustand store (see
// store/favoritesStore.js). This provider only keeps the store in step with
// the signed-in account; it no longer holds any state itself, so there is no
// context value whose identity change re-renders every consumer.
export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;

  // The user id (not the whole object) is the dependency so editing a profile
  // does not trigger a pointless reload.
  useEffect(() => {
    useFavoritesStore.getState().setUser(userId);
  }, [userId]);

  return children;
}

const selectPublic = (state) => ({
  items: state.items,
  ids: state.ids,
  count: state.count,
  loading: state.loading,
  loaded: state.loaded,
  error: state.error,
  isFavorite: state.isFavorite,
  toggle: state.toggle,
  refresh: state.refresh,
  clearError: state.clearError,
});

// Same shape as the old context hook, so existing components keep working.
// Components that only need one field can subscribe more narrowly with
// `useFavoritesStore((s) => s.count)`.
export const useFavorites = () => useFavoritesStore(useShallow(selectPublic));

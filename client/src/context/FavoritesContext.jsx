import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAuth } from './AuthContext.jsx';
import { useFavoritesStore } from '../store/favoritesStore.js';

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;

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

export const useFavorites = () => useFavoritesStore(useShallow(selectPublic));

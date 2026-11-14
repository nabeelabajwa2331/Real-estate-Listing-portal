import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAuth } from './AuthContext.jsx';
import { useSavedSearchesStore } from '../store/savedSearchesStore.js';

export function SavedSearchesProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    useSavedSearchesStore.getState().setUser(userId);
  }, [userId]);

  return children;
}

const selectPublic = (state) => ({
  searches: state.searches,
  count: state.count,
  loading: state.loading,
  loaded: state.loaded,
  saving: state.saving,
  error: state.error,
  create: state.create,
  remove: state.remove,
  refresh: state.refresh,
  clearError: state.clearError,
});

export const useSavedSearches = () => useSavedSearchesStore(useShallow(selectPublic));

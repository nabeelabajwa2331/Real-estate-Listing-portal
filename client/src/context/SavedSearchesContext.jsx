import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAuth } from './AuthContext.jsx';
import { useSavedSearchesStore } from '../store/savedSearchesStore.js';

// Saved searches now live in a global Zustand store (see
// store/savedSearchesStore.js). This provider only keeps the store in step
// with the signed-in account.
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

// Same shape as the old context hook, so existing components keep working.
export const useSavedSearches = () => useSavedSearchesStore(useShallow(selectPublic));

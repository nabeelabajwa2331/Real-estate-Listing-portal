import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios.js';

const AuthContext = createContext(null);

// The last confirmed session is cached so a refresh paints the signed-in
// header immediately instead of flashing "Sign in" while /auth/me is in
// flight. The server remains the source of truth: a failed check clears it.
const CACHE_KEY = 're.auth.user';

const readCachedUser = () => {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCachedUser = (next) => {
  try {
    if (next) window.localStorage.setItem(CACHE_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(CACHE_KEY);
  } catch {
    // Private browsing can block storage; the in-memory session still works.
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readCachedUser);
  const [loading, setLoading] = useState(true); // true until the first /auth/me check finishes

  const applyUser = (next) => {
    setUser(next);
    writeCachedUser(next);
  };

  // On page load, ask the server who is signed in (the cookie is sent automatically)
  useEffect(() => {
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        writeCachedUser(res.data.user);
      })
      .catch(() => {
        setUser(null);
        writeCachedUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // An expired or revoked session on any protected endpoint signs the browser
  // out locally instead of leaving the UI showing a logged-in shell whose
  // requests all fail. Auth endpoints are excluded because a failed sign-in is
  // not an expired session.
  useEffect(() => {
    const id = api.interceptors.response.use(
      (response) => response,
      (err) => {
        const url = err?.config?.url || '';
        if (err?.response?.status === 401 && !url.startsWith('/auth/')) {
          setUser(null);
          writeCachedUser(null);
        }
        return Promise.reject(err);
      }
    );
    return () => api.interceptors.response.eject(id);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    applyUser(data.user);
    return data.user;
  };

  const register = async (form) => {
    const { data } = await api.post('/auth/register', form);
    return data.message;
  };

  const loginWithGoogle = async (credential, role) => {
    const { data } = await api.post('/auth/google', { credential, ...(role ? { role } : {}) });
    applyUser(data.user);
    return data.user;
  };

  // Demo fallback shown while no real Google client ID is configured.
  const loginWithGoogleDemo = async (role) => {
    const { data } = await api.post('/auth/google/demo', role ? { role } : {});
    applyUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Even if the server is unreachable, drop the local session so another
      // account can sign in without inheriting this user's data.
    } finally {
      applyUser(null);
    }
  };

  const updateProfile = async (form) => {
    const { data } = await api.put('/auth/me', form);
    applyUser(data.user);
    return data.message;
  };

  const updateAvatar = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await api.post('/auth/me/avatar', formData);
    applyUser(data.user);
    return data.message;
  };

  const removeAvatar = async () => {
    const { data } = await api.delete('/auth/me/avatar');
    applyUser(data.user);
    return data.message;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithGoogle,
        loginWithGoogleDemo,
        register,
        logout,
        updateProfile,
        updateAvatar,
        removeAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Where each role lands after signing in
export const homeForRole = (role) =>
  ({ admin: '/admin', agent: '/agent', user: '/dashboard' })[role] || '/';

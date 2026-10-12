import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until the first /auth/me check finishes

  // On page load, ask the server who is signed in (the cookie is sent automatically)
  useEffect(() => {
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data.user);
    return data.user;
  };

  const register = async (form) => {
    const { data } = await api.post('/auth/register', form);
    return data.message;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  const updateProfile = async (form) => {
    const { data } = await api.put('/auth/me', form);
    setUser(data.user);
    return data.message;
  };

  const updateAvatar = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await api.post('/auth/me/avatar', formData);
    setUser(data.user);
    return data.message;
  };

  const removeAvatar = async () => {
    const { data } = await api.delete('/auth/me/avatar');
    setUser(data.user);
    return data.message;
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateProfile, updateAvatar, removeAvatar }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Where each role lands after signing in
export const homeForRole = (role) =>
  ({ admin: '/admin', agent: '/agent', user: '/dashboard' })[role] || '/';

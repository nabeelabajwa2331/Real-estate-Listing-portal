import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import { API_URL } from '../config/api.js';

const SocketContext = createContext(null);

// Owns the single Socket.IO connection for the app. It connects to the API
// origin (same origin when the server serves the SPA, or VITE_API_URL when the
// client is hosted separately) so the auth cookie is sent with the handshake.
export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      setSocket(null);
      return undefined;
    }

    const connection = io(API_URL || undefined, { withCredentials: true });
    setSocket(connection);

    return () => {
      connection.close();
      setSocket(null);
    };
  }, [user]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);

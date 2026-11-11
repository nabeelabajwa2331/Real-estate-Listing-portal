import { createContext, useContext, useEffect, useState } from 'react';
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

    // Load Socket.IO only once a signed-in user needs live updates. Guests never
    // download the client library, keeping the public pages lighter.
    let active = true;
    let connection = null;

    import('socket.io-client')
      .then(({ io }) => {
        if (!active) return;
        connection = io(API_URL || undefined, { withCredentials: true });
        setSocket(connection);
      })
      .catch(() => {
        // Real-time delivery is an enhancement; polling still works without it.
      });

    return () => {
      active = false;
      connection?.close();
      setSocket(null);
    };
  }, [user]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);

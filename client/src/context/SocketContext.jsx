import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { API_URL } from '../config/api.js';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!userId) {
      setSocket(null);
      return undefined;
    }

    let active = true;
    let connection = null;

    import('socket.io-client')
      .then(({ io }) => {
        if (!active) return;
        connection = io(API_URL || undefined, { withCredentials: true });
        setSocket(connection);
      })
      .catch(() => {
      });

    return () => {
      active = false;
      connection?.close();
      setSocket(null);
    };
  }, [userId]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);

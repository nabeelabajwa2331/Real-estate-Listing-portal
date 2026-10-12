import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

// Owns the single Socket.IO connection for the app. It connects to the same
// origin (Vite proxies /socket.io) so the auth cookie is sent. Feature contexts
// (inquiries, chat) subscribe to their own events on this socket.
export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      setSocket(null);
      return undefined;
    }

    const connection = io({ withCredentials: true });
    setSocket(connection);

    return () => {
      connection.close();
      setSocket(null);
    };
  }, [user]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);

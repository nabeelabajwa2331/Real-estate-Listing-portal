import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api/axios.js';
import { useAuth } from './AuthContext.jsx';
import { useSocket } from './SocketContext.jsx';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  const socket = useSocket();
  const [unread, setUnread] = useState(0);
  const [tick, setTick] = useState(0); // bumped on a real-time chat message

  const refresh = useCallback(async () => {
    if (!userId) {
      setUnread(0);
      return;
    }
    try {
      const { data } = await api.get('/chat/unread-count');
      setUnread(data.count);
    } catch {
      // ignore
    }
  }, [userId]);

  // Catch up on anything sent while the live connection was down.
  useEffect(() => {
    if (!socket) return undefined;
    const onReconnect = () => {
      setTick((value) => value + 1);
      refresh();
    };
    socket.io.on('reconnect', onReconnect);
    return () => socket.io.off('reconnect', onReconnect);
  }, [socket, refresh]);

  useEffect(() => {
    if (!socket) return undefined;
    const onMessage = () => {
      setTick((value) => value + 1);
      refresh();
    };
    socket.on('chat:message', onMessage);
    return () => socket.off('chat:message', onMessage);
  }, [socket, refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <ChatContext.Provider value={{ unread, refresh, tick }}>{children}</ChatContext.Provider>;
}

export const useChat = () => useContext(ChatContext);

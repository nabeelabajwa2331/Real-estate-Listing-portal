import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api/axios.js';
import { useAuth } from './AuthContext.jsx';
import { useSocket } from './SocketContext.jsx';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const socket = useSocket();
  const [unread, setUnread] = useState(0);
  const [tick, setTick] = useState(0); // bumped on a real-time chat message

  const refresh = useCallback(async () => {
    if (!user) {
      setUnread(0);
      return;
    }
    try {
      const { data } = await api.get('/chat/unread-count');
      setUnread(data.count);
    } catch {
      // ignore
    }
  }, [user]);

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

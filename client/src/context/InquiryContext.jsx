import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api/axios.js';
import { useAuth } from './AuthContext.jsx';
import { useSocket } from './SocketContext.jsx';

const InquiryContext = createContext(null);

export function InquiryProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  const socket = useSocket();
  const [unread, setUnread] = useState(0);
  const [tick, setTick] = useState(0); // bumped on a real-time message

  const refresh = useCallback(async () => {
    if (!userId) {
      setUnread(0);
      return;
    }
    try {
      const { data } = await api.get('/inquiries/unread-count');
      setUnread(data.count);
    } catch {
      // ignore; the badge just stays as-is
    }
  }, [userId]);

  // Messages that arrived while the connection was down were never pushed,
  // so catch up once it is back.
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
    socket.on('inquiry:message', onMessage);
    return () => socket.off('inquiry:message', onMessage);
  }, [socket, refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <InquiryContext.Provider value={{ unread, refresh, tick }}>{children}</InquiryContext.Provider>;
}

export const useInquiries = () => useContext(InquiryContext);

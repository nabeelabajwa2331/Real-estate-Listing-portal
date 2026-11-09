import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api/axios.js';
import { useAuth } from './AuthContext.jsx';
import { useSocket } from './SocketContext.jsx';

const InquiryContext = createContext(null);

export function InquiryProvider({ children }) {
  const { user } = useAuth();
  const socket = useSocket();
  const [unread, setUnread] = useState(0);
  const [tick, setTick] = useState(0); // bumped on a real-time message

  const refresh = useCallback(async () => {
    if (!user) {
      setUnread(0);
      return;
    }
    try {
      const { data } = await api.get('/inquiries/unread-count');
      setUnread(data.count);
    } catch {
      // ignore; the badge just stays as-is
    }
  }, [user]);

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

import { create } from 'zustand';

export const useServerStatusStore = create((set) => ({
  slowRequests: 0,
  recovered: false,
  markSlow: () => set((s) => ({ slowRequests: s.slowRequests + 1, recovered: false })),
  markDone: (succeeded = false) =>
    set((s) => {
      const slowRequests = Math.max(0, s.slowRequests - 1);
      return { slowRequests, recovered: s.recovered || (succeeded && slowRequests === 0) };
    }),
  dismiss: () => set({ recovered: false }),
}));

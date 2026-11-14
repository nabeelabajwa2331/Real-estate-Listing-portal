import { create } from 'zustand';

// Tracks API requests that are taking unusually long. The API runs on Render's
// free tier, which spins down after ~15 minutes idle; the first request after
// that can take 30-60 seconds while the service boots. Instead of leaving the
// visitor staring at a spinner, <ServerWakeBanner> reads this store and
// explains what is happening.
export const useServerStatusStore = create((set) => ({
  // Number of in-flight requests that have crossed the "slow" threshold.
  slowRequests: 0,
  // Set once a slow request has finished, so the banner can say "back online".
  recovered: false,
  markSlow: () => set((s) => ({ slowRequests: s.slowRequests + 1, recovered: false })),
  // `succeeded` is true when the slow request came back with a response, which
  // is the signal that the server is awake again.
  markDone: (succeeded = false) =>
    set((s) => {
      const slowRequests = Math.max(0, s.slowRequests - 1);
      return { slowRequests, recovered: s.recovered || (succeeded && slowRequests === 0) };
    }),
  dismiss: () => set({ recovered: false }),
}));

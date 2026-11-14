import { useServerStatusStore } from '../store/serverStatusStore.js';

export const SLOW_MS = 4000;
export const RETRY_DELAYS = [2000, 5000, 10000];

const GATEWAY_ERRORS = new Set([502, 503, 504]);

export const isRetryable = (err) => {
  const config = err?.config;
  if (!config || err?.code === 'ERR_CANCELED') return false;
  if ((config.method || 'get').toLowerCase() !== 'get') return false;
  if ((config.__retryCount || 0) >= RETRY_DELAYS.length) return false;
  const status = err.response?.status;
  return !err.response || GATEWAY_ERRORS.has(status);
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function attachColdStartHandling(instance, store = useServerStatusStore) {
  const finish = (config, succeeded) => {
    const meta = config?.__coldStart;
    if (!meta) return;
    clearTimeout(meta.timer);
    if (meta.slow) store.getState().markDone(succeeded);
    config.__coldStart = null;
  };

  instance.interceptors.request.use((config) => {
    const meta = { slow: false, timer: null };
    meta.timer = setTimeout(() => {
      meta.slow = true;
      store.getState().markSlow();
    }, SLOW_MS);
    config.__coldStart = meta;
    return config;
  });

  instance.interceptors.response.use(
    (response) => {
      finish(response.config, true);
      return response;
    },
    async (err) => {
      const config = err?.config;
      // Any HTTP response (even a 4xx) proves the server is up.
      finish(config, Boolean(err?.response) && !GATEWAY_ERRORS.has(err.response.status));
      if (!isRetryable(err)) throw err;

      const attempt = config.__retryCount || 0;
      config.__retryCount = attempt + 1;
      store.getState().markSlow();
      try {
        await wait(RETRY_DELAYS[attempt]);
      } finally {
        store.getState().markDone();
      }
      return instance(config);
    }
  );

  return instance;
}

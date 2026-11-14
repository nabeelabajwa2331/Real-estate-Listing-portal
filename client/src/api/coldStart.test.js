import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { attachColdStartHandling, isRetryable, RETRY_DELAYS, SLOW_MS } from './coldStart.js';
import { useServerStatusStore } from '../store/serverStatusStore.js';

const gatewayError = (config, status = 503) => {
  const err = new Error(`Request failed with status code ${status}`);
  err.config = config;
  err.response = { status, config, data: {} };
  return err;
};

// An axios instance whose network layer is a scripted adapter.
const instanceWith = (adapter) => attachColdStartHandling(axios.create({ adapter }));

describe('isRetryable', () => {
  it('retries GETs that hit gateway errors or got no response', () => {
    expect(isRetryable(gatewayError({ method: 'get' }, 502))).toBe(true);
    expect(isRetryable(gatewayError({ method: 'get' }, 504))).toBe(true);
    expect(isRetryable({ config: { method: 'get' } })).toBe(true);
  });

  it('never retries writes, client errors, cancellations or exhausted requests', () => {
    expect(isRetryable(gatewayError({ method: 'post' }))).toBe(false);
    expect(isRetryable(gatewayError({ method: 'get' }, 404))).toBe(false);
    expect(isRetryable({ code: 'ERR_CANCELED', config: { method: 'get' } })).toBe(false);
    expect(
      isRetryable(gatewayError({ method: 'get', __retryCount: RETRY_DELAYS.length }))
    ).toBe(false);
  });
});

describe('attachColdStartHandling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useServerStatusStore.setState({ slowRequests: 0, recovered: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('flags requests that take longer than the slow threshold', async () => {
    let finish;
    const api = instanceWith(
      (config) =>
        new Promise((resolve) => {
          finish = () => resolve({ data: 'ok', status: 200, statusText: 'OK', headers: {}, config });
        })
    );

    const request = api.get('/health');
    await vi.advanceTimersByTimeAsync(SLOW_MS - 1);
    expect(useServerStatusStore.getState().slowRequests).toBe(0);

    await vi.advanceTimersByTimeAsync(1);
    expect(useServerStatusStore.getState().slowRequests).toBe(1);

    finish();
    await request;
    expect(useServerStatusStore.getState().slowRequests).toBe(0);
    expect(useServerStatusStore.getState().recovered).toBe(true);
  });

  it('retries a GET through a cold start and then succeeds', async () => {
    let calls = 0;
    const api = instanceWith(async (config) => {
      calls += 1;
      if (calls < 3) throw gatewayError(config, 503);
      return { data: { status: 'ok' }, status: 200, statusText: 'OK', headers: {}, config };
    });

    const request = api.get('/health');
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS[0] + RETRY_DELAYS[1]);
    const response = await request;

    expect(calls).toBe(3);
    expect(response.data.status).toBe('ok');
    expect(useServerStatusStore.getState().slowRequests).toBe(0);
  });

  it('does not retry a failed POST', async () => {
    let calls = 0;
    const api = instanceWith(async (config) => {
      calls += 1;
      throw gatewayError(config, 503);
    });

    await expect(api.post('/auth/login', {})).rejects.toThrow('503');
    expect(calls).toBe(1);
  });
});

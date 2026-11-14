import { describe, it, expect, vi } from 'vitest';
import { createFavoritesStore } from './favoritesStore.js';

vi.mock('../api/axios.js', () => ({
  default: {},
  errorMessage: (err) => err?.message || 'Request failed',
}));

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const fakeClient = (listings = []) => ({
  get: vi.fn(() => Promise.resolve({ data: { listings } })),
  post: vi.fn(() => Promise.resolve({ data: {} })),
  delete: vi.fn(() => Promise.resolve({ data: {} })),
});

describe('favorites store', () => {
  it('loads saved listings when a user signs in', async () => {
    const client = fakeClient([{ _id: 'a' }, { _id: 'b' }]);
    const store = createFavoritesStore(client);

    store.getState().setUser('u1');
    await flush();

    const state = store.getState();
    expect(client.get).toHaveBeenCalledWith('/favorites');
    expect(state.count).toBe(2);
    expect(state.loaded).toBe(true);
    expect(state.isFavorite('a')).toBe(true);
    expect(state.isFavorite('z')).toBe(false);
  });

  it('does not refetch when the same user is set again (StrictMode double effects)', async () => {
    const client = fakeClient();
    const store = createFavoritesStore(client);
    store.getState().setUser('u1');
    store.getState().setUser('u1');
    await flush();
    expect(client.get).toHaveBeenCalledTimes(1);
  });

  it('clears everything on sign-out', async () => {
    const store = createFavoritesStore(fakeClient([{ _id: 'a' }]));
    store.getState().setUser('u1');
    await flush();

    store.getState().setUser(null);
    expect(store.getState().count).toBe(0);
    expect(store.getState().loaded).toBe(false);
  });

  it('saves optimistically before the server answers', async () => {
    const client = fakeClient();
    const pending = deferred();
    client.post.mockReturnValue(pending.promise);
    const store = createFavoritesStore(client);
    store.getState().setUser('u1');
    await flush();

    const task = store.getState().toggle('a', { _id: 'a', title: 'A' });
    expect(store.getState().isFavorite('a')).toBe(true);
    expect(store.getState().count).toBe(1);

    pending.resolve({ data: {} });
    await expect(task).resolves.toBe(true);
    expect(client.post).toHaveBeenCalledWith('/favorites/a');
  });

  it('rolls back and reports an error when saving fails', async () => {
    const client = fakeClient();
    client.post.mockRejectedValue(new Error('Network down'));
    const store = createFavoritesStore(client);
    store.getState().setUser('u1');
    await flush();

    await expect(store.getState().toggle('a', { _id: 'a' })).resolves.toBe(false);
    expect(store.getState().isFavorite('a')).toBe(false);
    expect(store.getState().error).toBe('Network down');
  });

  it('keeps the latest click when an earlier request fails', async () => {
    const client = fakeClient();
    client.post.mockRejectedValueOnce(new Error('first failed'));
    const store = createFavoritesStore(client);
    store.getState().setUser('u1');
    await flush();

    const first = store.getState().toggle('a', { _id: 'a' }); // save (fails)
    const second = store.getState().toggle('a', { _id: 'a' }); // unsave
    const third = store.getState().toggle('a', { _id: 'a' }); // save again
    await Promise.all([first, second, third]);

    expect(store.getState().isFavorite('a')).toBe(true);
    expect(store.getState().error).toBe('');
  });

  it('ignores toggles while signed out', async () => {
    const client = fakeClient();
    const store = createFavoritesStore(client);
    await expect(store.getState().toggle('a', { _id: 'a' })).resolves.toBe(false);
    expect(client.post).not.toHaveBeenCalled();
  });
});

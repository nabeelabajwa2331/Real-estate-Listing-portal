import { describe, it, expect, vi } from 'vitest';
import { createSavedSearchesStore } from './savedSearchesStore.js';

vi.mock('../api/axios.js', () => ({
  default: {},
  errorMessage: (err) => err?.message || 'Request failed',
}));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const fakeClient = (searches = []) => ({
  get: vi.fn(() => Promise.resolve({ data: { searches } })),
  post: vi.fn((url, body) => Promise.resolve({ data: { search: { _id: 'new', ...body } } })),
  delete: vi.fn(() => Promise.resolve({ data: {} })),
});

const signedIn = async (client) => {
  const store = createSavedSearchesStore(client);
  store.getState().setUser('u1');
  await flush();
  return store;
};

describe('saved searches store', () => {
  it('loads the user\'s searches on sign-in', async () => {
    const store = await signedIn(fakeClient([{ _id: 's1' }, { _id: 's2' }]));
    expect(store.getState().count).toBe(2);
    expect(store.getState().loaded).toBe(true);
  });

  it('prepends a newly created search', async () => {
    const client = fakeClient([{ _id: 's1' }]);
    const store = await signedIn(client);

    await store.getState().create('Lahore houses', { city: 'Lahore' });

    expect(client.post).toHaveBeenCalledWith('/saved-searches', {
      name: 'Lahore houses',
      params: { city: 'Lahore' },
    });
    expect(store.getState().searches.map((s) => s._id)).toEqual(['new', 's1']);
    expect(store.getState().saving).toBe(false);
  });

  it('does not duplicate a search the API returns again', async () => {
    const client = fakeClient([{ _id: 's1' }]);
    client.post.mockResolvedValue({ data: { search: { _id: 's1', name: 'Same' } } });
    const store = await signedIn(client);

    await store.getState().create('Same', {});
    expect(store.getState().count).toBe(1);
  });

  it('surfaces create errors and rethrows them', async () => {
    const client = fakeClient();
    client.post.mockRejectedValue(new Error('Too many saved searches'));
    const store = await signedIn(client);

    await expect(store.getState().create('x', {})).rejects.toThrow('Too many saved searches');
    expect(store.getState().error).toBe('Too many saved searches');
    expect(store.getState().saving).toBe(false);
  });

  it('removes optimistically and restores on failure', async () => {
    const client = fakeClient([{ _id: 's1' }, { _id: 's2' }]);
    client.delete.mockRejectedValue(new Error('Server error'));
    const store = await signedIn(client);

    const task = store.getState().remove('s1');
    expect(store.getState().count).toBe(1);

    await expect(task).resolves.toBe(false);
    expect(store.getState().searches.map((s) => s._id)).toEqual(['s1', 's2']);
    expect(store.getState().error).toBe('Server error');
  });

  it('keeps a deleted search hidden when a stale refresh returns it', async () => {
    const client = fakeClient([{ _id: 's1' }, { _id: 's2' }]);
    const store = await signedIn(client);

    await store.getState().remove('s1');
    await store.getState().refresh(); // server snapshot still lists s1

    expect(store.getState().searches.map((s) => s._id)).toEqual(['s2']);
  });

  it('resets on sign-out', async () => {
    const store = await signedIn(fakeClient([{ _id: 's1' }]));
    store.getState().setUser(null);
    expect(store.getState().count).toBe(0);
    expect(store.getState().loaded).toBe(false);
  });
});
